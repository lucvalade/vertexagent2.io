import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import twilio from "twilio";
import * as dotenv from "dotenv";
import FirecrawlApp from "@mendable/firecrawl-js";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import nodemailer from "nodemailer";

const dotEnvResult = dotenv.config();
console.log("[DotEnv] Result:", dotEnvResult.error ? "No .env file found" : "Loaded .env file");
if (dotEnvResult.parsed) {
  console.log("[DotEnv] Keys loaded:", Object.keys(dotEnvResult.parsed));
}

// SMTP Transporter setup
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const port = 587; // Explicitly use 587 for Hostinger/STARTTLS
    const user = process.env.SMTP_USER || 'sales@vertexagent.io';
    const pass = process.env.SMTP_PASS;

    if (!pass) {
      console.warn("[SMTP] No SMTP_PASS found in environment. Email sending will fail until configured.");
      return null;
    }

    console.log(`[SMTP] Initializing for ${user} via ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // TLS is upgraded via STARTTLS
      auth: {
        user,
        pass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
      debug: true,
      logger: true,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // Verify connection on startup
    transporter.verify((error, success) => {
      if (error) {
        console.error("[SMTP] Connection verification failed:", error);
      } else {
        console.log("[SMTP] Connection verified and ready to send messages.");
      }
    });
  }
  return transporter;
}

// Placeholder keys to warn about
const PLACEHOLDERS = ["MY_GEMINI_API_KEY", "YOUR_API_KEY", "INSERT_KEY_HERE"];

let aiClient: GoogleGenAI | null = null;
let firecrawlClient: FirecrawlApp | null = null;
let twilioClient: twilio.Twilio | null = null;

function getTwilio() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn("[Twilio] Missing SID or Token. Follow-up SMS disabled.");
      return null;
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Lazily initializes the Firecrawl client.
 */
function getFirecrawl() {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    
    // 3. Look for a Firecrawl key
    // We prioritize variables that actually contain a Firecrawl key (starts with 'fc-')
    const customKeyName = Object.keys(process.env).find(k => 
      process.env[k] && process.env[k]!.startsWith("fc-")
    );

    let actualKey = customKeyName ? process.env[customKeyName] : (process.env.FIRECRAWL_API_KEY || null);

    if (!actualKey || actualKey.trim() === "") {
      console.warn("[Firecrawl] No valid API key found starting with 'fc-'. Falling back to direct fetch.");
      return null;
    }
    
    // Support keys being passed accidentally as the variable name itself
    const finalKey = actualKey.startsWith("fc-") ? actualKey : (process.env[actualKey] || actualKey);

    console.log(`[Firecrawl] Initializing with key ending in ...${finalKey.slice(-4)}`);
    firecrawlClient = new FirecrawlApp({ apiKey: finalKey });
  }
  return firecrawlClient;
}

/**
 * Lazily initializes the Gemini AI client.
 * Strictly checks for runtime secrets and rejects placeholder strings.
 */
function getAi() {
  if (!aiClient) {
    // 1. Try standard keys
    let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 2. If standard key is missing or is known to be a placeholder, look for custom-named keys
    if (!apiKey || PLACEHOLDERS.includes(apiKey.trim())) {
      console.log("[AI Init] Standard key missing or is a placeholder. Searching for custom keys...");
      
      // Look for any key that looks like a real Google API key (starts with AIza)
      const customKey = Object.keys(process.env).find(k => 
        process.env[k] && 
        process.env[k]!.startsWith("AIza") && 
        !PLACEHOLDERS.includes(process.env[k]!)
      );

      if (customKey) {
        console.log(`[AI Init] Found alternative key in environment variable: ${customKey}`);
        apiKey = process.env[customKey];
      }
    }

    console.log(`[AI Init] SDK Initialization. Runtime key detected: ${!!apiKey}`);

    if (!apiKey || PLACEHOLDERS.includes(apiKey.trim())) {
      const isPlaceholder = apiKey && PLACEHOLDERS.includes(apiKey.trim());
      const msg = isPlaceholder 
        ? `A placeholder API key ("${apiKey}") was detected. Please ensure you have a secret named GEMINI_API_KEY with your real AIza... key.`
        : "Missing GEMINI_API_KEY or GOOGLE_API_KEY in runtime environment. Please set your API key in the Secrets panel.";
      
      console.error(`[AI Init] Configuration Error: ${msg}`);
      throw new Error(msg);
    }
    
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = 3000;

  app.use(express.json());

  /**
   * Health check endpoint for monitoring and self-diagnosis.
   */
  app.get("/api/health", (req, res) => {
    // Check for any valid key (Discovery Logic)
    let key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let discoveredFrom = key ? (PLACEHOLDERS.includes(key.trim()) ? null : "standard") : null;

    if (!discoveredFrom) {
      const customKey = Object.keys(process.env).find(k => 
        process.env[k] && 
        process.env[k]!.startsWith("AIza") && 
        !PLACEHOLDERS.includes(process.env[k]!)
      );
      if (customKey) {
        key = process.env[customKey];
        discoveredFrom = customKey;
      }
    }

    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      aiConfigured: !!discoveredFrom,
      keySource: discoveredFrom
    });
  });

  /**
   * API Route for Sending Emails via SMTP
   */
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: "Missing required fields (to, subject, and at least one of html or text)" });
    }

    try {
      const mailTransporter = getTransporter();
      if (!mailTransporter) {
        return res.status(503).json({ error: "Email service is not configured. Please set SMTP_PASS in your environment." });
      }

      console.log(`[SMTP] Attempting to send email to ${to} with subject: ${subject}`);
      
      const info = await mailTransporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Vertex Agent'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'sales@vertexagent.io'}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`[SMTP] Email success! Response: ${info.response}`);
      console.log(`[SMTP] MessageId: ${info.messageId}`);
      console.log(`[SMTP] Accepted: ${info.accepted}`);
      console.log(`[SMTP] Rejected: ${info.rejected}`);
      
      res.json({ 
        success: true, 
        messageId: info.messageId, 
        response: info.response,
        accepted: info.accepted 
      });
    } catch (err: any) {
      console.error("[SMTP] Full Error Object:", JSON.stringify(err, null, 2));
      console.error("[SMTP] Error Message:", err.message);
      res.status(500).json({ 
        error: `Failed to send email: ${err.message}`, 
        code: err.code,
        command: err.command
      });
    }
  });

  /**
   * API Route for Sending Follow-up SMS via Twilio
   */
  app.post("/api/send-followup", async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Missing required fields (to, message)" });
    }

    try {
      const client = getTwilio();
      if (!client) {
        return res.status(503).json({ error: "Twilio service is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN." });
      }

      console.log(`[Twilio] Sending SMS to ${to}...`);
      
      const msg = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log(`[Twilio] SMS success! Message SID: ${msg.sid}`);
      
      res.json({ success: true, sid: msg.sid });
    } catch (err: any) {
      console.error("[Twilio] Error:", err.message);
      res.status(500).json({ error: `Failed to send SMS: ${err.message}` });
    }
  });

  /**
   * API Route for Text-to-Speech (TTS) using Gemini securely
   * Path: POST /api/tts
   */
  app.post("/api/tts", async (req, res) => {
    const { transcript, agentName = "Sarah", clientName = "Mark" } = req.body;
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: "Transcript array is required" });
    }

    try {
      console.log(`[TTS] Synthesizing conversation transcript securely on server for Agent: ${agentName}, Client: ${clientName}...`);
      const ai = getAi();
      
      // Map names to specific genders / prebuilt voices
      const isClientFemale = ["sofia", "lucy", "sofía", "eleanor", "sara", "emma", "lucy diamond", "eleanor rigby"].includes(clientName.toLowerCase());
      const clientVoiceName = isClientFemale ? "Aoede" : "Puck";
      const agentVoiceName = "Kore"; // AI (Sarah, Elena, Chantal, Claire, Clara) are always female

      // Format clean transcript labeled by their exact human names
      const promptText = `TTS the following conversation between ${agentName} (${agentVoiceName} voice) and ${clientName} (${clientVoiceName} voice):
      ${transcript.map((m: any) => {
        const nameLabel = m.speaker === "AI" ? agentName : clientName;
        return `${nameLabel}: ${m.text}`;
      }).join('\n')}`;

      console.log("[TTS Generated Prompt]:\n", promptText);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: agentName,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: agentVoiceName } }
                },
                {
                  speaker: clientName,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: clientVoiceName } }
                }
              ]
            }
          }
        }
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio data returned from Gemini");
      }

      console.log("[TTS] Synthesis completed successfully.");
      res.json({ base64Audio });
    } catch (err: any) {
      console.error("[TTS Endpoint Error]:", err);
      res.status(500).json({ error: err.message || "Failed to synthesize audio" });
    }
  });

  /**
   * API Route for Listing URL Ingestion.
   * Path: POST /api/ingest
   * Implements a 4-stage pipeline: Validation, Retrieval, Structured Extraction, and Response.
   */
  app.post("/api/ingest", async (req, res) => {
    const { url } = req.body;
    
    // Stage 1: Validation and Normalization
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let normalizedUrl = url;
    try {
      const u = new URL(url);
      normalizedUrl = u.toString();
      console.log(`[Importer] URL Normalized -> ${normalizedUrl}`);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    try {
      console.log("[Importer] Stage 2: Retrieval initiated");
      const firecrawl = getFirecrawl();
      const ai = getAi();
      
      let extractedData: any = null;

      // --- STAGE 2A: FIRECRAWL ATTEMPT ---
      if (firecrawl) {
        try {
          console.log("[Importer] Using Firecrawl for robust scraping...");
          // Using any for options to bypass type check on 'markdown' vs others if SDK is strictly typed
          const scrapeResult: any = await firecrawl.scrape(normalizedUrl, {
            formats: ["markdown"]
          });

          if (scrapeResult && scrapeResult.markdown) {
            console.log("[Importer] Firecrawl retrieval successful. Content length:", scrapeResult.markdown.length);
            extractedData = await extractWithGemini(ai, scrapeResult.markdown, normalizedUrl);
          } else {
             console.warn("[Importer] Firecrawl returned no markdown content.");
          }
        } catch (fcErr) {
          console.error("[Importer] Firecrawl encountered an error:", fcErr);
        }
      }

      // --- STAGE 2B: GEMINI FALLBACK (DIRECT FETCH) ---
      if (!extractedData) {
        console.log("[Importer] Firecrawl unavailable or failed. Falling back to direct fetch + Gemini...");
        let htmlText = "";
        try {
          const fetchResponse = await fetch(normalizedUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://www.google.com/"
            }
          });
          
          if (fetchResponse.ok) {
            htmlText = await fetchResponse.text();
            console.log(`[Importer] Direct fetch successful. Length: ${htmlText.length}`);
          }
        } catch (fetchErr) {
          console.warn("[Importer] Direct fetch exception during fallback:", fetchErr);
        }

        extractedData = await extractWithGemini(ai, htmlText, normalizedUrl);
      }

      if (!extractedData || (!extractedData.address && !extractedData.description)) {
        throw new Error("Unable to extract listing data. The page content might be protected or incomplete.");
      }

      extractedData.sourceUrl = normalizedUrl;
      console.log(`[Importer] Final Status: ${extractedData.importStatus}. Fields: ${Object.keys(extractedData).join(", ")}`);
      
      res.json({ data: extractedData });

    } catch (err: any) {
      console.error("[Importer] Failure Details:", err);
      
      // Stage 4 Fallback: Create a 'failed' draft response
      const fallbackData = {
          sourceUrl: normalizedUrl,
          importStatus: "failed",
          notes: [`System error: ${err.message}`],
          address: "",
          description: ""
      };

      let errMsg = err.message || "Ingestion failed";
      
      // Specifically handle Rate Limit / Quota errors
      if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate limit") || errMsg.includes("503")) {
          errMsg = "The Gemini AI is currently heavily loaded or hitting a rate limit. Please wait about 30-60 seconds and try again. If you just enabled billing, it may take a few minutes for new quotas to apply.";
      }
      
      // Only attribute 403/401 to AI Provider if the error message specifically mentions API keys or unauthorized AI access
      const isAiAuthError = !errMsg.includes("rate limit") && (errMsg.toLowerCase().includes("api key") || 
                           (errMsg.includes("403") && !errMsg.toLowerCase().includes("website blocked")));
      
      if (isAiAuthError) {
          errMsg = `AI Configuration Error: Please check your API key in the Secrets panel. (Details: ${errMsg})`;
      }
      
      res.status(500).json({ 
          error: errMsg,
          data: fallbackData 
      });
    }
  });

  /**
   * Helper: Extract realtor listing data using Gemini AI.
   * Includes retry logic for quota/rate-limit resilience.
   */
  async function extractWithGemini(ai: GoogleGenAI, input: string, sourceUrl: string, attempt: number = 1): Promise<any> {
    console.log(`[Importer] Extracting with Gemini (Attempt ${attempt}/10)...`);
    
    try {
      const extractionSchema = {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING, description: "Street address only (e.g. 123 Main St)" },
          city: { type: Type.STRING, nullable: true },
          province: { type: Type.STRING, description: "State or Province code (e.g. CA, ON, NY)", nullable: true },
          postalCode: { type: Type.STRING, description: "Zip or Postal Code", nullable: true },
          country: { type: Type.STRING, description: "US or CA", nullable: true },
          price: { type: Type.NUMBER, nullable: true },
          beds: { type: Type.NUMBER, nullable: true },
          baths: { type: Type.NUMBER, nullable: true },
          sqft: { type: Type.NUMBER, nullable: true },
          propertyType: { type: Type.STRING, nullable: true },
          mlsNumber: { type: Type.STRING, nullable: true },
          originatingSystemName: { type: Type.STRING, description: "The MLS Board or Source System name", nullable: true },
          brokerageName: { type: Type.STRING, description: "The Real Estate Agency or Office name", nullable: true },
          agentName: { type: Type.STRING, description: "The Listing Agent's full name", nullable: true },
          description: { type: Type.STRING },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
          images: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                url: { type: Type.STRING },
                name: { type: Type.STRING, description: "A simple tag for the image (e.g. 'Photo 1')" }
              },
              required: ["url", "name"]
            }, 
            nullable: true 
          },
          importStatus: { type: Type.STRING, enum: ["complete", "partial", "failed"] }
        },
        required: ["address", "description", "importStatus"]
      };

      const prompt = `Extract detailed real estate listing information from the provided content.
URL: ${sourceUrl}

MANDATORY RULES:
1. GRANULAR ADDRESS: You MUST separate the address into 'address' (street), 'city', 'province' (state/prov code), and 'postalCode'.
2. ACCURACY: No hallucinations. If a value isn't clearly visible, use 'null' for numbers or empty string for text.
3. IMAGES: Extract all high-quality property images. Use a generic name if a descriptive title isn't immediate. Deduplicate URLS.
4. AGENT & BROKERAGE: Look specifically for listing attribution. 
   - A common format is 'Listed by: [Agent Name], [Title/Salesperson], [Brokerage Name]'. 
   - Always extract the Agent's Name and the full Brokerage Name separately. 
   - If multiple names appear, the brokerage is usually the corporate entity at the end.
5. STATUS: Set 'importStatus' to 'partial' if core details like Price or Beds/Baths are missing.
6. SEARCH: If the direct content is sparse or blocked, use the Search tool to find details for this exact address/URL.

CONTENT:
${input ? input.substring(0, 15000) : "[MISSING CONTENT - USE SEARCH TOOL TO FIND LISTING DETAILS]"}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: extractionSchema as any,
          tools: input.length < 500 ? [{ googleSearch: {} }] : [] as any
        },
      });

      const text = result.text;
      return JSON.parse(text || "{}");
    } catch (err: any) {
      console.error(`[Importer] Attempt ${attempt} Error:`, err.message?.substring(0, 200));
      const errMsg = err.message || "";
      const isQuotaError = errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate limit") || errMsg.includes("503") || errMsg.toLowerCase().includes("unavailable");
      
      if (isQuotaError && attempt < 10) {
        // Use a model fallback string if needed, but for now just increasing delay
        const delay = (Math.pow(1.5, attempt) * 4000) + (Math.random() * 2000); 
        console.warn(`[Importer] AI busy/rate-limited. Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        return extractWithGemini(ai, input, sourceUrl, attempt + 1);
      }
      throw err;
    }
  }

  // WebSocket handling for Voice Proxy
  wss.on("connection", (ws, req) => {
    console.log("[WS] Client connected to Voice Proxy");
    let aiSession: any = null;

    ws.on("message", async (message) => {
      try {
        const payload = JSON.parse(message.toString());

        if (payload.type === "setup") {
          console.log("[WS] Setting up AI Live session");
          const ai = getAi();
          aiSession = await ai.live.connect({
             model: "gemini-3.1-flash-live-preview",
             config: {
               responseModalities: [Modality.AUDIO],
               speechConfig: {
                 voiceConfig: { prebuiltVoiceConfig: { voiceName: payload.voice || "Puck" } },
               },
               systemInstruction: payload.systemInstruction,
               tools: payload.tools,
             },
             callbacks: {
               onopen: () => ws.send(JSON.stringify({ type: "open" })),
               onmessage: (msg) => ws.send(JSON.stringify({ type: "message", data: msg })),
               onclose: () => ws.close(),
               onerror: (err) => ws.send(JSON.stringify({ type: "error", message: err.message })),
             }
          });
        } else if (payload.type === "input" && aiSession) {
          aiSession.sendRealtimeInput(payload.data);
        } else if (payload.type === "tool_response" && aiSession) {
          aiSession.sendToolResponse(payload.data);
        }
      } catch (err: any) {
        console.error("[WS] Message Hub Error:", err);
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    });

    ws.on("close", () => {
      console.log("[WS] Client disconnected");
      if (aiSession) {
        aiSession.close();
      }
    });
  });

  /**
   * API Route for AI notes assist/rewrite
   * Path: POST /api/assist-notes
   */
  app.post("/api/assist-notes", async (req, res) => {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: "Notes content is required" });
    }

    try {
      console.log("[AI Assist Notes] Rewriting notes with Gemini...");
      const ai = getAi();
      const prompt = `You are an elite, highly professional real estate marketing assistant.
Rewrite the following open house listing descriptive notes and preparation checklist for a client-facing open house event.
Make it highly engaging, professionally styled, clear, and elegant.
Do NOT invent false statistics or false features, but structure and format the notes gracefully, emphasizing features.

RULES:
1. Return ONLY the rewritten text.
2. Under no circumstance should the output exceed 2000 characters.
3. The first letter of the rewritten notes MUST be capitalized (uppercase).

ORIGINAL NOTES:
"${notes}"`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      let text = result.text || "";
      text = text.trim();
      // Enforce capitalizing the first letter
      if (text.length > 0) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
      }
      
      // Ensure max 2000 characters
      if (text.length > 2000) {
        text = text.substring(0, 2000);
      }

      res.json({ success: true, rewrittenNotes: text });
    } catch (err: any) {
      console.error("[AI Assist Notes] Error generating content:", err);
      res.status(500).json({ error: err.message || "Failed to generate optimized notes" });
    }
  });

  /**
   * API Route for script translation
   * Path: POST /api/translate-script
   */
  app.post("/api/translate-script", async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Text and targetLanguage are required" });
    }

    try {
      console.log(`[Translate Script] Translating text to ${targetLanguage}...`);
      const ai = getAi();
      const prompt = `You are an elite multilingual real estate copywriter.
Translate the following real estate property welcome script into ${targetLanguage}.
Make it sound beautiful, natural, premium, elegant, and highly professional when spoken by a state-of-the-art neural AI voice.
Do NOT include any introduction, explanations, meta-comments or quotation marks. Only output the exact translated text.

SCRIPT TO TRANSLATE (in English):
"${text}"`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      let translatedText = result.text || "";
      translatedText = translatedText.trim();
      
      // Clean up markdown block encodings if models output them
      if (translatedText.startsWith("```")) {
        translatedText = translatedText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      translatedText = translatedText.trim();

      res.json({ success: true, translatedText });
    } catch (err: any) {
      console.error("[Translate Script] Error generating translation:", err);
      res.status(500).json({ error: err.message || "Failed to generate translation" });
    }
  });

  /**
   * API Route for Simple Text-To-Speech (TTS) using Gemini Voice securely
   * Path: POST /api/tts-simple
   */
  app.post("/api/tts-simple", async (req, res) => {
    const { text, lang = "English" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    try {
      console.log(`[TTS Simple] Synthesizing text with Gemini in ${lang}: "${text.substring(0, 40)}..."`);
      const ai = getAi();
      
      // Determine voice to use. Puck can be male, Kore female. Let's use puck for dynamic or Kore as default
      const voiceName = (lang === "French" || lang === "Spanish") ? "Aoede" : "Kore"; 

      const systemInstruction = `Speak natural, beautiful, and fluidly in ${lang}. Maintain a friendly, supportive, and extremely professional real estate agent guide tone. Do not announce yourself with metadata, just read the script perfectly.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        }
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio payload returned from Gemini model.");
      }

      res.json({ success: true, base64Audio });
    } catch (err: any) {
      console.error("[TTS Simple Endpoint Error]:", err);
      res.status(500).json({ error: err.message || "Failed to synthesize speech in backend" });
    }
  });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/api/voice-proxy") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // Prevent client-side/iframe caching of dev assets and vite dependencies
    app.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    });

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

