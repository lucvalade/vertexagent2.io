import React, { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Link2, 
  Search, 
  Loader2, 
  Globe, 
  ArrowRight, 
  FileText, 
  Coins, 
  Building, 
  Image,
  Layers,
  CheckCircle2
} from "lucide-react";

export default function UrlImportPage() {
  const [url, setUrl] = useState("https://www.zillow.com/homedetails/Luxury-Malibu-Oceanfront-Vila-Malibu-CA-90265/2059345/");
  const [isIngesting, setIsIngesting] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [results, setResults] = useState<any | null>(null);

  // Simulated extraction profiles
  const sampleData: Record<string, any> = {
    malibu: {
      address: "24800 Pacific Coast Hwy",
      city: "Malibu",
      provinceState: "California",
      postalZipCode: "90265",
      price: "$24,500,000",
      beds: 5,
      baths: 6,
      sqft: "6,200",
      propertyType: "Single Family Residential",
      mlsNumber: "26-789211",
      agentName: "Cassandra Vance",
      brokerageName: "Vertex Luxury Global",
      description: "Pristine oceanfront masterpiece situated on Malibu's ultra-private Malibu Cove Colony beach. Boasting majestic white water views from every room, high-end marble details, expansive decks with automated sliding doors, and private sandy ocean entry.",
      keyFeatures: ["Oceanfront beach access", "Automated smart systems", "Infinity pool and spa", "Private secure gate", "Wrap-around balconies"],
      imagesCount: 16
    },
    default: {
      address: "128 Oak Ridge Lane",
      city: "Burlington",
      provinceState: "Ontario",
      postalZipCode: "L7M 1W4",
      price: "$1,899,000",
      beds: 4,
      baths: 3.5,
      sqft: "3,400",
      propertyType: "Detached Custom Craft",
      mlsNumber: "W981024",
      agentName: "Marcus Thorne",
      brokerageName: "Oak Ridge Premier Corp",
      description: "Magnificent custom crafted home nestled in highly coveted Millcroft. Open concept professional chef style culinary domain, cascading natural light cascading, spa-like baths, and a professionally landscaped pool oasis.",
      keyFeatures: ["Millcroft Golf Access", "Professional gas range", "Finished lower suite", "Heated salt water pool", "Triple pane climate windows"],
      imagesCount: 22
    }
  };

  const startSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsIngesting(true);
    setResults(null);

    // Step 1: Validation
    setStage(1);

    // Step 2: Scraping
    setTimeout(() => {
      setStage(2);
    }, 1200);

    // Step 3: LLM Parsing
    setTimeout(() => {
      setStage(3);
    }, 2400);

    // Step 4: Normalization
    setTimeout(() => {
      setStage(4);
    }, 3600);

    // Finish
    setTimeout(() => {
      setIsIngesting(false);
      // Select simulation profile based on keyword
      const Lower = url.toLowerCase();
      if (Lower.includes("malibu") || Lower.includes("coast") || Lower.includes("beach")) {
        setResults(sampleData.malibu);
      } else {
        setResults(sampleData.default);
      }
    }, 4500);
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-800 pb-24 text-left">
        
        {/* HERO HEADER */}
        <section className="relative py-20 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto space-y-6 text-center max-w-3xl mx-auto z-10 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase mx-auto">
              <Sparkles className="h-3 w-3 animate-pulse" /> Automatic URL Ingestion
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Paste Any Property URL, <br />
              <span className="text-blue-600">Get a Ready-to-Publish Tour</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Turn public real-estate listing pages into structured, review-ready tour records for AI property tours, open house flyers, sign-in kiosk sequences, and text campaigns in less than 20 seconds.
            </p>
          </div>
        </section>

        {/* INTERACTIVE CRAWLER SANDBOX */}
        <section id="crawler-sandbox" className="py-20 px-6 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Left Box: simulator inputs */}
            <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Pipeline Ingestion Simulator</span>
                <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Try Live Sandbox Extraction</h2>
                <p className="text-slate-500 text-sm">
                  Choose a listing link or paste yours to view our ingestion stages in real-time. Witness how Gemini automatically structure parameters, normalizes fields, and hydrades descriptions.
                </p>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-black">Or use one of our configured samples:</span>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setUrl("https://www.zillow.com/homedetails/Luxury-Malibu-Oceanfront-Villa-CA-90265")}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-medium text-slate-700"
                    >
                      Oceanfront Malibu Villa
                    </button>
                    <button 
                      onClick={() => setUrl("https://www.redfin.com/home-details/Millcroft-Luxury-Golf-Course-Retreat")}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-medium text-slate-700"
                    >
                      Millcroft Golf Retreat
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={startSimulation} className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-4 shadow-inner">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Enter Public Listing Link (MLS, Zillow, Redfin, etc.)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-white border-slate-200 h-11 text-xs px-3 font-mono rounded-xl focus:border-blue-500"
                      placeholder="https://..."
                      disabled={isIngesting}
                    />
                    <Button 
                      type="submit" 
                      className="h-11 bg-blue-600 hover:bg-blue-700 text-xs px-5 rounded-xl font-bold flex gap-1.5"
                      disabled={isIngesting}
                    >
                      {isIngesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Start Parse
                    </Button>
                  </div>
                </div>

                {isIngesting && (
                  <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl space-y-3 font-mono text-[11px]">
                    <h5 className="font-bold text-blue-400 uppercase tracking-widest text-[9px] border-b border-slate-800 pb-1.5">Pipeline Execution Console</h5>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Stage 1: Input Normalization</span>
                        <span className={stage >= 1 ? "text-emerald-400" : "text-amber-400"}>{stage >= 1 ? "✓ COMPLETE" : "● RUNNING"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 2: Scraper Retrieval & Dom Dump</span>
                        <span className={stage >= 2 ? "text-emerald-400" : stage >= 1 ? "text-amber-400 animate-pulse" : "text-slate-600"}>{stage >= 2 ? "✓ COMPLETE" : stage >= 1 ? "● RUNNING" : "WAITING"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 3: Gemini Structured Parsing</span>
                        <span className={stage >= 3 ? "text-emerald-400" : stage >= 2 ? "text-amber-400 animate-pulse" : "text-slate-600"}>{stage >= 3 ? "✓ COMPLETE" : stage >= 2 ? "● RUNNING" : "WAITING"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 4: Normalization & Field Hydration</span>
                        <span className={stage >= 4 ? "text-emerald-400" : stage >= 3 ? "text-amber-400 animate-pulse" : "text-slate-600"}>{stage >= 4 ? "✓ COMPLETE" : stage >= 3 ? "● RUNNING" : "WAITING"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Box: extracted payload results */}
            <div className="lg:col-span-6 bg-[#155dfc] text-white rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
              
              <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 bg-rose-400 rounded-full"></span>
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
                  </div>
                  <h4 className="text-xs font-semibold text-white/80 font-mono">Structured output details</h4>
                  <span className="px-2 py-0.5 text-[8px] bg-emerald-500/20 text-white border border-emerald-400/30 rounded font-mono font-bold">SUCCESS</span>
                </div>

                {results ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">Price</Label>
                        <p className="font-extrabold text-emerald-300 text-sm font-mono">{results.price}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">Beds / Baths</Label>
                        <p className="font-black text-white text-sm font-mono">{results.beds} Beds / {results.baths} Baths</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">Address</Label>
                        <p className="font-bold text-white">{results.address}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">City / State</Label>
                        <p className="font-bold text-white">{results.city}, {results.provinceState}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">Listing Source</Label>
                        <p className="font-bold text-white font-mono text-xs">{results.brokerageName}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">MLS ID</Label>
                        <p className="font-bold text-white font-mono text-xs">{results.mlsNumber}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">Extracted Description</Label>
                      <p className="text-[11px] text-white/95 leading-normal bg-white/10 border border-white/20 p-3 rounded-xl italic">
                        "{results.description}"
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <Label className="text-[10px] text-blue-100/90 uppercase tracking-widest font-mono font-bold">AI Structured Keywords</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {results.keyFeatures.map((f: string, idx: number) => (
                          <span key={idx} className="bg-white/15 text-white border border-white/25 rounded-md text-[9px] font-mono px-2 py-0.5">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isIngesting ? (
                  <div className="py-24 text-center text-white space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
                    <p className="font-mono text-xs text-white/90">Assembling Firecrawl scraper & parsing fields...</p>
                  </div>
                ) : (
                  <div className="py-28 text-center text-white/90 space-y-2">
                    <Link2 className="h-10 w-10 mx-auto text-white/40 animate-pulse" />
                    <p className="text-xs font-semibold text-white">Input url and press "Start Parse" to trigger extraction simulation.</p>
                  </div>
                )}

                <div className="pt-4 border-t border-white/20 flex justify-between items-center text-[10px] text-blue-100 font-mono">
                  <span>Confidence rating: {results ? "98.4%" : "Pending link..."}</span>
                  <span>Images extracted: {results ? `${results.imagesCount} Photos` : "0"}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4 STAGE DETAILED EXPLANATION */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 border-l-4 border-blue-600 pl-3 font-mono">The Pipeline Engineering</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              The Four Ingestion Phase Protocols
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              Think of it like this: regular tools just copy and paste the basic description box from a website. AI Open House Connect goes way deeper—we pull the behind-the-scenes code of the entire page.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 items-stretch">
            
            <div className="p-6 bg-white hover:bg-blue-600 border border-slate-200/80 rounded-3xl space-y-4 transition-all duration-300 group cursor-default">
              <span className="h-8 w-8 bg-blue-50 group-hover:bg-blue-500 text-blue-600 group-hover:text-white border group-hover:border-blue-400 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-colors duration-300">01</span>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Input Validation</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 mt-1 leading-normal transition-colors duration-300">
                  Standardize the pasted web link, perform security checks on the data structure, and map the domain address to trigger appropriate scraping rules.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white hover:bg-blue-600 border border-slate-200/80 rounded-3xl space-y-4 transition-all duration-300 group cursor-default">
              <span className="h-8 w-8 bg-indigo-50 group-hover:bg-indigo-500 text-indigo-600 group-hover:text-white border group-hover:border-indigo-400 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-colors duration-300">02</span>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Scraping & Markup Retrieval</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 mt-1 leading-normal transition-colors duration-300">
                  Retrieve clean page source. When simple website connection, use a page-loading tool (Firecrawl) that opens the site more like a real visitor so it can get past tougher website blocks.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white hover:bg-blue-600 border border-slate-200/80 rounded-3xl space-y-4 transition-all duration-300 group cursor-default">
              <span className="h-8 w-8 bg-emerald-50 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white border group-hover:border-emerald-400 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-colors duration-300">03</span>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Gemini Extractions</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 mt-1 leading-normal transition-colors duration-300">
                  Send the page information to Google Gemini, make sure the results match the exact fields we need, and if some details are missing or blocked, look them up through search.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white hover:bg-blue-600 border border-slate-200/80 rounded-3xl space-y-4 transition-all duration-300 group cursor-default">
              <span className="h-8 w-8 bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white border group-hover:border-amber-400 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-colors duration-300">04</span>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Check & Save</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 mt-1 leading-normal transition-colors duration-300">
                  Check the imported details, fill in any missing address or city information if needed, and save everything.
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
