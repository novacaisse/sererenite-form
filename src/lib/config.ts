import type { StatutPipeline, TypeInscription } from "@/types/database";

/**
 * Central, easily-editable configuration for the campaign. Adjust these
 * values instead of hunting through components — nothing below is meant to
 * be "hardcoded logic".
 */

export const EVENT = {
  name: "Sérénité 2026 — Le Salon de la Sécurité Globale",
  dates: "12–14 novembre 2026",
  venue: "Immeuble Caistab, Plateau",
  city: "Abidjan",
};

export const CONTACT_PHONE_DISPLAY = "+225 07 08 87 49 87";
export const CONTACT_PHONE_TEL = "+2250708874987";
export const CONTACT_WHATSAPP_LINK =
  "https://chat.whatsapp.com/CgE0fMV45iYBGtTgopXeHb?s=cl&p=a&mlu=4&ilr=4";
export const PARTNERSHIP_DECK_LINK =
  "https://drive.google.com/file/d/1_Y4Q5Rv7o5W36fnOS4-o0QMpzKlidaJY/view?usp=drivesdk";

export const META_PIXEL_ID = "2452145495266477";

export const TYPE_INSCRIPTION_OPTIONS: {
  value: TypeInscription;
  label: string;
  description: string;
  icon: "building" | "handshake" | "ticket";
}[] = [
  {
    value: "exposant",
    label: "Exposant",
    description: "Je souhaite réserver un stand et présenter mes solutions.",
    icon: "building",
  },
  {
    value: "partenaire_officiel",
    label: "Partenaire officiel",
    description: "Je représente une organisation souhaitant s'associer à l'événement.",
    icon: "handshake",
  },
  {
    value: "visiteur",
    label: "Visiteur",
    description: "Je souhaite simplement assister au salon.",
    icon: "ticket",
  },
];

/**
 * Which "thank you" experience each registration type gets on /merci.
 * `showPartnershipDeck` is reserved for exhibitors / official partners.
 */
export const THANK_YOU_CONFIG: Record<
  TypeInscription,
  { title: string; showPartnershipDeck: boolean }
> = {
  exposant: {
    title: "en tant qu'Exposant",
    showPartnershipDeck: true,
  },
  partenaire_officiel: {
    title: "en tant que Partenaire officiel",
    showPartnershipDeck: true,
  },
  visiteur: {
    title: "en tant que Visiteur",
    showPartnershipDeck: false,
  },
};

/**
 * The pipeline board's columns, in display order. `urgent_a_contacter` is
 * never set manually — a scheduled job (see the `escalate-uncontacted-leads`
 * pg_cron job) flips a lead there automatically 3h after registration if
 * nobody has moved it out of "nouveau" yet.
 */
export const PIPELINE_STATUSES: {
  value: StatutPipeline;
  label: string;
  color: string;
  dotColor: string;
}[] = [
  { value: "nouveau", label: "Nouveau", color: "bg-slate-200 text-slate-700", dotColor: "bg-slate-400" },
  {
    value: "urgent_a_contacter",
    label: "Urgent à contacter",
    color: "bg-rose-100 text-rose-700",
    dotColor: "bg-rose-500",
  },
  { value: "contacte", label: "Contacté", color: "bg-sky-100 text-sky-700", dotColor: "bg-sky-500" },
  {
    value: "indisponible",
    label: "Indisponible",
    color: "bg-slate-200 text-slate-600",
    dotColor: "bg-slate-400",
  },
  { value: "relance", label: "Relance", color: "bg-amber-100 text-amber-700", dotColor: "bg-amber-500" },
  {
    value: "dossier_en_cours",
    label: "Dossier en cours",
    color: "bg-violet-100 text-violet-700",
    dotColor: "bg-violet-500",
  },
  {
    value: "rdv_programme",
    label: "RDV programmé",
    color: "bg-indigo-100 text-indigo-700",
    dotColor: "bg-indigo-500",
  },
  { value: "converti", label: "Converti", color: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-500" },
  { value: "perdu", label: "Perdu", color: "bg-rose-50 text-rose-400", dotColor: "bg-rose-300" },
];

export const INTERACTION_TYPES: { value: string; label: string }[] = [
  { value: "appel", label: "Appel" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "rdv", label: "Rendez-vous" },
  { value: "relance", label: "Relance" },
  { value: "note", label: "Note" },
];
