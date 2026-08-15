
import { db } from "./src/lib/firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

const hamiltonData = [
  {
    company: "Michael St. Jean Realty",
    address: "88 Wilson Street West, 2nd Floor, Ancaster, ON L9G 1N2",
    url: "https://www.stjeanrealty.com",
    agents: [
      { name: "Ericka Chuli", email: "info@stjeanrealty.com", phone: "(289) 239-8866" },
      { name: "Julien Vincent", email: "info@stjeanrealty.com", phone: "(289) 239-8866" },
      { name: "Michael St. Jean", email: "michael@stjeanrealty.com", phone: "(289) 239-8866 / 1-844-484-7653" },
      { name: "Robin St. Jean", email: "robin@stjeanrealty.com", phone: "(289) 239-8866 / 1-844-484-7653" },
      { name: "Teresa St. Jean", email: "teresa@stjeanrealty.com", phone: "(289) 239-8866 / 1-844-484-7653" },
    ]
  },
  {
    company: "Milestones Real Estate Group (Reisha Dass & Associates)",
    address: "1070 Stone Church Rd E, Units 42 & 43, Hamilton, ON L8W 3K8",
    url: "https://reishadass.com/",
    agents: [
      { name: "Leah Gerrard", email: "info@reishadass.com", phone: "(905) 573-1188 / (905) 389-6734" },
      { name: "Reisha Dass", email: "reisha@reishadass.com", phone: "(905) 520-4319 / (905) 389-6734" },
      { name: "Tiera Dass", email: "info@reishadass.com", phone: "(905) 389-6734" },
    ]
  },
  {
    company: "Team Mark Woehrle (RE/MAX Escarpment)",
    address: "325 Winterberry Dr Unit 102, Stoney Creek / Hamilton, ON L8J 0B6",
    url: "https://markwoehrle.com/",
    agents: [
      { name: "Alex Woehrle", email: "info@markwoehrle.com", phone: "(905) 512-1846 / (905) 573-1188" },
      { name: "Hailey Woehrle", email: "info@markwoehrle.com", phone: "(905) 512-1846 / (905) 573-1188" },
      { name: "Mark Woehrle", email: "mark@markwoehrle.com", phone: "(905) 512-1846 / (905) 573-1188" },
      { name: "Tanya Woehrle", email: "info@markwoehrle.com", phone: "(905) 512-1846 / (905) 573-1188" },
    ]
  },
  {
    company: "The Golfi Team (RE/MAX Escarpment)",
    address: "1 Markland Street, Hamilton, ON L8P 2J5",
    url: "https://www.robgolfi.com/",
    agents: [
      { name: "Abhir Garg", email: "questions@golfiteam.com", phone: "(226) 784-2099 / (905) 575-7700" },
      { name: "Afrodite Chatzimalis", email: "questions@golfiteam.com", phone: "(289) 768-7796 / (905) 575-7700" },
      { name: "Amber Switzer", email: "questions@golfiteam.com", phone: "(289) 203-1847 / (905) 575-7700" },
      { name: "Daniel Golfi", email: "questions@golfiteam.com", phone: "(289) 778-3045 / (905) 575-7700" },
      { name: "Daniela Biagi", email: "questions@golfiteam.com", phone: "(289) 302-7898 / (905) 575-7700" },
      { name: "Darren Quinn", email: "questions@golfiteam.com", phone: "(289) 302-5701 / (905) 575-7700" },
      { name: "Diana Winger", email: "questions@golfiteam.com", phone: "(289) 816-3599 / (905) 575-7700" },
      { name: "Jeff Golfi", email: "questions@golfiteam.com", phone: "(289) 216-5885 / (905) 575-7700" },
      { name: "Phil Golfi", email: "questions@golfiteam.com", phone: "(289) 778-3105 / (905) 575-7700" },
      { name: "Rob Golfi", email: "questions@golfiteam.com", phone: "(905) 575-7700" },
    ]
  },
  {
    company: "Woolcott Real Estate",
    address: "493 Dundas Street East, Waterdown, ON L8B 0G7",
    url: "https://woolcott.ca/",
    agents: [
      { name: "Drew Woolcott", email: "drewandjayne@woolcott.ca", phone: "(905) 332-9223" },
      { name: "Jayne Woolcott", email: "drewandjayne@woolcott.ca", phone: "(905) 332-9223" },
      { name: "Paul Robertson", email: "info@woolcott.ca", phone: "(905) 332-9223" },
      { name: "Rob McKichan", email: "info@woolcott.ca", phone: "(905) 332-9223" },
      { name: "Sylvia Groff", email: "info@woolcott.ca", phone: "(289) 780-9223 / (905) 332-9223" },
    ]
  }
];

async function seedHamiltonData() {
  console.log("Starting Hamilton data seeding...");
  
  for (const companyData of hamiltonData) {
    // Add company as a team/brokerage
    const teamRef = await addDoc(collection(db, "teams"), {
      name: companyData.company,
      address: companyData.address,
      website: companyData.url,
      type: "brokerage",
      createdAt: new Date()
    });

    // Add agents for this team
    for (const agent of companyData.agents) {
      await addDoc(collection(db, "agents"), {
        ...agent,
        teamId: teamRef.id,
        teamName: companyData.company,
        createdAt: new Date()
      });
    }
    console.log(`Seeded ${companyData.company} and ${companyData.agents.length} agents.`);
  }
  console.log("Hamilton data seeding completed.");
}

seedHamiltonData().catch(console.error);
