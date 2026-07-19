import React from "react";

interface AskMeAboutTableProps {
  language?: string;
  askMeAbout?: any[];
  onTopicClick?: (question: string) => void;
}

export default function AskMeAboutTable({ language = "en", askMeAbout, onTopicClick }: AskMeAboutTableProps) {
  const isFrench = language.toLowerCase() === "fr" || language.toLowerCase() === "french";

  // 16 rows of text data (bilingual)
  const rows = [
    {
      topic: isFrench ? "Chambres & Salles de bain" : "Bedrooms & Bathrooms",
      question: isFrench 
        ? "Combien de chambres et de salles de bain possède cette maison ?" 
        : "How many bedrooms and bathrooms does this home have?"
    },
    {
      topic: isFrench ? "Suite parentale / d'invités" : "In-Law Suite",
      question: isFrench 
        ? "Cette propriété dispose-t-elle d'une suite d'invités séparée ?" 
        : "Does this property feature a separate in-law suite?"
    },
    {
      topic: isFrench ? "Améliorations de la cuisine" : "Kitchen Upgrades",
      question: isFrench 
        ? "Quelles sont les caractéristiques et les appareils de la cuisine ?" 
        : "What are the key features and appliances in the kitchen?"
    },
    {
      topic: isFrench ? "Cour arrière & Terrain" : "Backyard & Lot Size",
      question: isFrench 
        ? "Pouvez-vous décrire l'espace arrière et les dimensions du terrain ?" 
        : "Can you describe the backyard space and overall lot dimensions?"
    },
    {
      topic: isFrench ? "Année de construction" : "Year Built",
      question: isFrench 
        ? "Quand cette maison a-t-elle été construite et rénovée ?" 
        : "When was this home constructed and has it been renovated?"
    },
    {
      topic: isFrench ? "Taxes foncières" : "Property Taxes",
      question: isFrench 
        ? "Quel est le montant des taxes foncières annuelles ?" 
        : "What are the annual property taxes for this address?"
    },
    {
      topic: isFrench ? "Écoles et secteur" : "School District",
      question: isFrench 
        ? "Quelles sont les écoles locales qui desservent ce quartier ?" 
        : "Which local schools serve this neighborhood?"
    },
    {
      topic: isFrench ? "Stationnement & Garage" : "Parking & Garage",
      question: isFrench 
        ? "Combien de places de stationnement y a-t-il dans le garage et l'allée ?" 
        : "How many parking spaces are available on the driveway and garage?"
    },
    {
      topic: isFrench ? "Sous-sol aménagé" : "Basement Status",
      question: isFrench 
        ? "Le sous-sol est-il entièrement fini et a-t-il une entrée ?" 
        : "Is the basement fully finished and does it have an entrance?"
    },
    {
      topic: isFrench ? "Numéro MLS de l'inscription" : "MLS Listing Number",
      question: isFrench 
        ? "Quel est le numéro MLS actif de cette propriété ?" 
        : "What is the active MLS number for this property?"
    },
    {
      topic: isFrench ? "Transport et autoroute" : "Local Transit & Highway",
      question: isFrench 
        ? "Quelle est la proximité des transports en commun et de l'autoroute ?" 
        : "How close is public transportation and the nearest highway?"
    },
    {
      topic: isFrench ? "Chauffage & Climatisation" : "Heating & Cooling",
      question: isFrench 
        ? "Quels types de systèmes de chauffage et de climatisation sont installés ?" 
        : "What type of heating and air conditioning systems are installed?"
    },
    {
      topic: isFrench ? "Superficie en pieds carrés" : "Square Footage",
      question: isFrench 
        ? "Quelle est la superficie totale approximative de l'intérieur ?" 
        : "What is the approximate total interior square footage?"
    },
    {
      topic: isFrench ? "Commodités à proximité" : "Nearby Amenities",
      question: isFrench 
        ? "Y a-t-il des épiceries, des parcs ou des centres commerciaux à proximité ?" 
        : "Are there grocery stores, parks, or shopping malls nearby?"
    },
    {
      topic: isFrench ? "Visites & Offres" : "Showing & Offers",
      question: isFrench 
        ? "Comment puis-je réserver une visite privée ou soumettre une offre ?" 
        : "How can I book a private showing or submit an offer?"
    },
    {
      topic: isFrench ? "Hypothèque & Financement" : "Mortgage & Financing",
      question: isFrench 
        ? "Quelles sont les options de financement et les incitatifs du prêteur ?" 
        : "What are the financing options or paired lender incentives?"
    }
  ];

  let displayRows = [];
  if (askMeAbout && Array.isArray(askMeAbout) && askMeAbout.length > 0) {
    const activeSorted = askMeAbout
      .filter((entry: any) => entry.active === true)
      .sort((a: any, b: any) => {
        const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 999;
        const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 999;
        return orderA - orderB;
      });

    if (activeSorted.length > 0) {
      displayRows = activeSorted.map((entry: any) => ({
        topic: entry.category || "",
        question: entry.sampleQuestion || entry.question || ""
      }));
    }
  }

  if (displayRows.length === 0) {
    displayRows = rows;
  }

  return (
    <div className="w-full rounded-xl border border-slate-800/80 bg-slate-950/80 shadow-inner overflow-hidden">
      {/* Scrollable Container with Max Height restricted to show exactly up to 10 rows (approx 380px) */}
      <div 
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent max-h-[380px] p-4 space-y-4"
        id="ask-me-about-scroll-container"
      >
        {displayRows.map((row, index) => (
          <div key={index} className="space-y-2">
            <div 
              onClick={() => onTopicClick?.(row.question)}
              className="group cursor-pointer text-left transition-all duration-150"
            >
              <h2 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400 flex items-start gap-1.5 transition-colors whitespace-normal break-words">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:bg-blue-400 shrink-0 mt-1" />
                ## {row.topic}
              </h2>
              <p className="pl-3 text-[11px] sm:text-xs text-slate-400 italic font-medium group-hover:text-slate-200 transition-colors whitespace-normal break-words">
                {row.question}
              </p>
            </div>
            {index < displayRows.length - 1 && (
              <div className="border-t border-slate-900/60 pt-1 text-slate-600 text-[10px] select-none tracking-widest pl-3">
                ---
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
