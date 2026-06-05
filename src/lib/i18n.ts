export const translations: Record<string, Record<string, string>> = {
  en: {
    "sign_in": "Sign In",
    "required_consent": "I agree to the terms and consent to communication.",
    "name_label": "Full Name",
    "email_label": "Email",
    "phone_label": "Phone Number",
    "address_label": "Current Address",
    "bra_label": "Working with a Real Estate Agent?",
    "yes_bra": "Yes (Already represented)",
    "no_bra": "No (Unrepresented)",
    "agent_name": "Agent Name",
    "brokerage_name": "Brokerage Name",
    "consent_header": "Consent for Communication",
    "kiosk_tablet": "Tablet Kiosk",
    "kiosk_touchless": "Touchless QR",
  },
  fr: {
    "sign_in": "Connexion",
    "required_consent": "J'accepte les conditions et je consens à la communication.",
    "name_label": "Nom complet",
    "email_label": "Courriel",
    "phone_label": "Numéro de téléphone",
    "address_label": "Adresse actuelle",
    "bra_label": "Travaillez-vous avec un agent immobilier ?",
    "yes_bra": "Oui (déjà représenté)",
    "no_bra": "Non (non représenté)",
    "agent_name": "Nom de l'agent",
    "brokerage_name": "Nom de l'agence",
    "consent_header": "Consentement à la communication",
    "kiosk_tablet": "Borne tablette",
    "kiosk_touchless": "QR code sans contact",
  }
};

export type Language = "en" | "fr";
