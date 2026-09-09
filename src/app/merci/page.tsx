import Link from "next/link";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_LINK,
  EVENT,
  PARTNERSHIP_DECK_LINK,
  THANK_YOU_CONFIG,
} from "@/lib/config";
import type { TypeInscription } from "@/types/database";

const VALID_TYPES: TypeInscription[] = ["exposant", "partenaire_officiel", "visiteur"];

function isValidType(value: string | undefined): value is TypeInscription {
  return Boolean(value) && VALID_TYPES.includes(value as TypeInscription);
}

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; prenom?: string }>;
}) {
  const params = await searchParams;
  // We don't trust the URL blindly: if `type` is missing or not one of the
  // three known values, we fall back to the generic "visiteur" experience
  // rather than guessing or showing a broken page.
  const type: TypeInscription = isValidType(params.type) ? params.type : "visiteur";
  const prenom = params.prenom?.trim();
  const config = THANK_YOU_CONFIG[type];

  return (
    <main className="flex min-h-screen flex-col bg-navy text-white">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia/15">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="#E91E8C" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-balance text-2xl font-bold sm:text-3xl">
          Merci {prenom || ""}, votre demande {config.title} a bien été reçue.
        </h1>

        <p className="mt-4 text-white/70">
          Rendez-vous du {EVENT.dates} — {EVENT.venue}, {EVENT.city}. Notre équipe reviendra vers
          vous très rapidement.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:max-w-sm">
          {config.showPartnershipDeck && (
            <a
              href={PARTNERSHIP_DECK_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia px-6 py-4 text-base font-semibold text-white shadow-lg shadow-fuchsia/20 transition-colors hover:bg-fuchsia-dark"
            >
              Télécharger le dossier de partenariat
            </a>
          )}

          <a
            href={CONTACT_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            Rejoindre le groupe WhatsApp
          </a>

          <p className="mt-2 text-sm text-white/60">
            Urgent ? Appelez-nous directement :{" "}
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="font-semibold text-white underline underline-offset-2">
              {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
        </div>

        <Link href="/" className="mt-12 text-sm text-white/50 underline underline-offset-4 hover:text-white/80">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
