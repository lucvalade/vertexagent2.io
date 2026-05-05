import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useEffect, useRef, useState } from "react";

// Convert Float32Array into base64 string of Int16 PCM data
function float32ToBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, s, true);
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 PCM data to Float32Array for AudioContext playback
function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(buffer);
  const float32Array = new Float32Array(binary.length / 2);
  for (let i = 0; i < float32Array.length; i++) {
    float32Array[i] = view.getInt16(i * 2, true) / 32768; // true for little-endian
  }
  return float32Array;
}

export function useLiveVoice(systemInstruction: string, tools: any[], onToolCall: (name: string, args: any) => any) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/voice-proxy`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("[Voice] Proxy connection opened. Sending setup...");
        wsRef.current?.send(JSON.stringify({
          type: "setup",
          systemInstruction,
          tools,
          voice: "Puck"
        }));
      };

      wsRef.current.onmessage = async (e) => {
        const payload = JSON.parse(e.data);
        
        if (payload.type === "open") {
          console.log("[Voice] AI session established");
          setConnected(true);
          setConnecting(false);
        } else if (payload.type === "message") {
          const message = payload.data;
          
          // Handle audio playback
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
             const audioData = base64ToFloat32(base64Audio);
             const audioCtx = playbackContextRef.current;
             if (audioCtx) {
               const audioBuffer = audioCtx.createBuffer(1, audioData.length, 24000);
               audioBuffer.copyToChannel(audioData, 0);
               
               const source = audioCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(audioCtx.destination);
               
               const startTime = Math.max(playbackTimeRef.current, audioCtx.currentTime);
               source.start(startTime);
               playbackTimeRef.current = startTime + audioBuffer.duration;
             }
          }

          // Handle tool calls
          const toolCalls = message.toolCall?.functionCalls;
          if (toolCalls && toolCalls.length > 0) {
             const responses = await Promise.all(toolCalls.map(async (call: any) => {
               const result = await onToolCall(call.name, call.args);
               return {
                 id: call.id,
                 name: call.name,
                 response: result
               };
             }));
             
             wsRef.current?.send(JSON.stringify({
               type: "tool_response",
               data: { functionResponses: responses }
             }));
          }

          // Handle Interruption
          if (message.serverContent?.interrupted) {
             if (playbackContextRef.current) {
               playbackContextRef.current.suspend();
               playbackContextRef.current.resume();
               playbackTimeRef.current = playbackContextRef.current.currentTime;
             }
          }
        } else if (payload.type === "error") {
          setError(payload.message);
          stopSession();
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("[Voice] Proxy WebSocket error:", err);
        setError("Connection to proxy failed");
        stopSession();
      };

      wsRef.current.onclose = () => {
        console.log("[Voice] Proxy connection closed");
        stopSession();
      };

      // Audio rendering setup (Gemini outputs 24kHz PCM)
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      playbackTimeRef.current = playbackContextRef.current.currentTime;

      // Microphone capture setup (Gemini expects 16kHz PCM input)
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      await audioContextRef.current.audioWorklet.addModule("/pcm-processor.js");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = new AudioWorkletNode(audioContextRef.current, "pcm-processor");

      processorRef.current.port.onmessage = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const base64Data = float32ToBase64(e.data);
        wsRef.current.send(JSON.stringify({
          type: "input",
          data: { audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" } }
        }));
      };
      
      sourceRef.current.connect(processorRef.current);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start camera/mic or connect to voice proxy");
      setConnecting(false);
    }
  };

  const stopSession = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (playbackContextRef.current) playbackContextRef.current.close();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return {
    connecting,
    connected,
    error,
    startSession,
    stopSession
  };
}
