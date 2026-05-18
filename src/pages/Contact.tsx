import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail, Phone, MapPin, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Contact() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Message sent! We'll get back to you shortly.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div 
          className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-lg">
            V
          </div>
          VertexAgent.io
        </div>
        <Button variant="ghost" onClick={() => navigate("/")}>Back to Home</Button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Get in touch with <span className="text-blue-600">our team.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Have questions about our AI talking tours? Need a custom demo for your brokerage? 
              We're here to help you revolutionize how you sell real estate.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Email Us</h4>
                <a href="mailto:support@vertexagent.io" className="text-slate-500 hover:text-blue-600 transition-colors underline-offset-4 hover:underline">support@vertexagent.io</a>
                <p className="text-xs text-slate-400 mt-1">24/7 Response time within 2 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Call Us</h4>
                <a href="tel:+19055550192" className="text-slate-500 hover:text-blue-600 transition-colors underline-offset-4 hover:underline">+1 (905) 555-0192</a>
                <p className="text-xs text-slate-400 mt-1">Mon-Fri, 9am - 6pm EST</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Headquarters</h4>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=100+King+St+W,+Suite+5700,+Toronto,+ON+M5X+1C7,+Canada" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-blue-600 transition-colors underline-offset-4 hover:underline block"
                >
                  100 King St W, Suite 5700<br />
                  Toronto, ON M5X 1C7, Canada
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
                  placeholder="Jane Doe" 
                  required 
                  maxLength={50}
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com" 
                  required 
                  maxLength={100}
                  className="bg-slate-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: toTitleCase(e.target.value) })}
                placeholder="How can we help?" 
                required 
                maxLength={100}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us more about your needs (min 20 chars)..." 
                className="min-h-[150px] bg-slate-50"
                required 
                minLength={20}
                maxLength={200}
              />
              <div className="flex justify-end">
                <span className={`text-[10px] font-bold ${formData.message.length < 20 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {formData.message.length}/200
                </span>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} VertexAgent.io. All rights reserved.
      </footer>
    </div>
  );
}
