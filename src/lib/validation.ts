import type { TypeInscription } from "@/types/database";

export interface LeadFormValues {
  nom_complet: string;
  entreprise: string;
  poste: string;
  telephone: string;
  email: string;
  type_inscription: TypeInscription | "";
  /** Honeypot — must stay empty. Real users never see or fill this field. */
  site_web: string;
}

export type FormErrors = Partial<Record<keyof LeadFormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts international format, defaults to Côte d'Ivoire (+225) shape but
// allows any country code: optional "+", 8 to 15 digits, spaces/dots/dashes allowed.
const PHONE_REGEX = /^\+?[0-9](?:[0-9 .-]{6,17})[0-9]$/;

const VALID_TYPES: TypeInscription[] = ["exposant", "partenaire_officiel", "visiteur"];

export function validateLeadForm(values: LeadFormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.nom_complet.trim().length < 3) {
    errors.nom_complet = "Le nom complet doit contenir au moins 3 caractères.";
  }

  if (values.entreprise.trim().length < 2) {
    errors.entreprise = "L'entreprise / organisation doit contenir au moins 2 caractères.";
  }

  if (!values.poste.trim()) {
    errors.poste = "Merci d'indiquer votre poste ou fonction.";
  }

  const phone = values.telephone.trim();
  if (!phone) {
    errors.telephone = "Le numéro de téléphone est requis.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.telephone = "Format invalide. Exemple : +225 07 08 87 49 87";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "L'adresse email est requise.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Adresse email invalide.";
  }

  if (!values.type_inscription || !VALID_TYPES.includes(values.type_inscription)) {
    errors.type_inscription = "Merci de sélectionner un type d'inscription.";
  }

  return errors;
}

export function isFormValid(errors: FormErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) return `+225${trimmed.slice(1)}`;
  return `+225${trimmed}`;
}

export { VALID_TYPES };
