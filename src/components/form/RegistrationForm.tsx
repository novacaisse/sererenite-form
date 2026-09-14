"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EXPOSANT_QUALIFICATION_NOTE,
  NON_QUALIFYING_ROLE,
  QUALIFYING_ROLES,
  TYPE_INSCRIPTION_OPTIONS,
} from "@/lib/config";
import type { TypeInscription } from "@/types/database";
import {
  type FormErrors,
  type LeadFormValues,
  isFormValid,
  validateLeadForm,
} from "@/lib/validation";
import { trackLeadEvent } from "@/components/MetaPixel";
import { FormField } from "./FormField";
import { TypeCard } from "./TypeCard";

const INITIAL_VALUES: LeadFormValues = {
  nom_complet: "",
  entreprise: "",
  poste: "",
  telephone: "",
  email: "",
  type_inscription: "",
  site_web: "",
};

const POSTE_OPTIONS = [
  { value: "", label: "Sélectionnez votre poste" },
  ...QUALIFYING_ROLES.map((role) => ({ value: role, label: role })),
  { value: NON_QUALIFYING_ROLE, label: "Autre poste" },
];

export function RegistrationForm() {
  const router = useRouter();
  const [estEntreprise, setEstEntreprise] = useState<"" | "oui" | "non">("");
  const [values, setValues] = useState<LeadFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LeadFormValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof LeadFormValues>(field: K, value: LeadFormValues[K]) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (touched[field]) {
      setErrors(validateLeadForm(nextValues));
    }
  }

  function handleEstEntreprise(next: "oui" | "non") {
    if (next === estEntreprise) return;
    setEstEntreprise(next);
    if (next === "non") {
      // Individuals only ever register as Visiteur — no company details needed.
      setValues((prev) => ({ ...prev, type_inscription: "visiteur", entreprise: "", poste: "" }));
    } else if (estEntreprise === "non") {
      // Coming back from "non": don't keep the auto-picked Visiteur type, let
      // them choose explicitly among the three company-linked options.
      setValues((prev) => ({ ...prev, type_inscription: "" }));
    }
    setTouched((prev) => ({ ...prev, type_inscription: false }));
  }

  function handleTypeSelect(type: TypeInscription) {
    updateField("type_inscription", type);
    setTouched((prev) => ({ ...prev, type_inscription: true }));
  }

  function handleBlurField(field: keyof LeadFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateLeadForm(values));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateLeadForm(values);
    setErrors(validationErrors);
    setTouched({
      nom_complet: true,
      entreprise: true,
      poste: true,
      telephone: true,
      email: true,
      type_inscription: true,
    });

    if (!isFormValid(validationErrors)) {
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    const eventId = crypto.randomUUID();

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, event_id: eventId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error ?? "Une erreur est survenue. Merci de réessayer.");
        setSubmitting(false);
        return;
      }

      const [firstName, ...rest] = values.nom_complet.trim().split(" ");
      trackLeadEvent(values.type_inscription, eventId, {
        email: values.email.trim(),
        phone: values.telephone.trim(),
        firstName,
        lastName: rest.join(" ") || undefined,
      });
      router.push(`/merci?type=${values.type_inscription}&prenom=${encodeURIComponent(firstName || "")}`);
    } catch {
      setSubmitError("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.");
      setSubmitting(false);
    }
  }

  const showTypeError = touched.type_inscription && errors.type_inscription;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div aria-invalid={Boolean(showTypeError && estEntreprise === "")}>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Vous inscrivez-vous au nom d&apos;une entreprise ? <span className="text-fuchsia">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleEstEntreprise("oui")}
            aria-pressed={estEntreprise === "oui"}
            className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold transition-colors ${
              estEntreprise === "oui"
                ? "border-fuchsia bg-fuchsia text-white"
                : "border-slate-300 bg-white text-navy hover:border-navy/40 hover:bg-slate-50"
            }`}
          >
            Oui, une entreprise
          </button>
          <button
            type="button"
            onClick={() => handleEstEntreprise("non")}
            aria-pressed={estEntreprise === "non"}
            className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold transition-colors ${
              estEntreprise === "non"
                ? "border-fuchsia bg-fuchsia text-white"
                : "border-slate-300 bg-white text-navy hover:border-navy/40 hover:bg-slate-50"
            }`}
          >
            Non, à titre individuel
          </button>
        </div>
        {showTypeError && estEntreprise === "" && (
          <p className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
            Merci d&apos;indiquer si vous représentez une entreprise.
          </p>
        )}
      </div>

      {estEntreprise === "oui" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Type d&apos;inscription <span className="text-fuchsia">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_INSCRIPTION_OPTIONS.map((option) => (
              <TypeCard
                key={option.value}
                value={option.value}
                label={option.label}
                icon={option.icon}
                selected={values.type_inscription === option.value}
                onSelect={handleTypeSelect}
              />
            ))}
          </div>
          {showTypeError && (
            <p className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
              {errors.type_inscription}
            </p>
          )}
          {values.type_inscription === "exposant" && (
            <p className="mt-2 text-xs text-slate-500">{EXPOSANT_QUALIFICATION_NOTE}</p>
          )}
        </div>
      )}

      {estEntreprise === "non" && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-navy">
          Vous serez inscrit(e) en tant que <strong>Visiteur</strong>.
        </p>
      )}

      {estEntreprise === "oui" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            label="Entreprise / Organisation"
            name="entreprise"
            value={values.entreprise}
            placeholder="Ex : SecuriGroup SA"
            autoComplete="organization"
            required={values.type_inscription !== "visiteur"}
            error={touched.entreprise ? errors.entreprise : undefined}
            onChange={(v) => updateField("entreprise", v)}
            onBlur={() => handleBlurField("entreprise")}
          />
          {values.type_inscription === "exposant" && (
            <FormField
              label="Poste / Fonction"
              name="poste"
              value={values.poste}
              options={POSTE_OPTIONS}
              error={touched.poste ? errors.poste : undefined}
              onChange={(v) => updateField("poste", v)}
              onBlur={() => handleBlurField("poste")}
            />
          )}
          {values.type_inscription === "partenaire_officiel" && (
            <FormField
              label="Poste / Fonction"
              name="poste"
              value={values.poste}
              placeholder="Ex : Directrice commerciale"
              autoComplete="organization-title"
              error={touched.poste ? errors.poste : undefined}
              onChange={(v) => updateField("poste", v)}
              onBlur={() => handleBlurField("poste")}
            />
          )}
          {values.type_inscription === "visiteur" && (
            <FormField
              label="Poste / Fonction"
              name="poste"
              value={values.poste}
              placeholder="Ex : Directrice commerciale"
              autoComplete="organization-title"
              required={false}
              onChange={(v) => updateField("poste", v)}
            />
          )}
        </div>
      )}

      {values.type_inscription === "exposant" && values.poste === NON_QUALIFYING_ROLE && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Le stand Exposant est réservé aux personnes habilitées à engager l&apos;entreprise (Direction
          générale ou commerciale). Si ce n&apos;est pas votre cas, nous vous invitons à vous inscrire en
          tant que Visiteur.
          <button
            type="button"
            onClick={() => handleTypeSelect("visiteur")}
            className="mt-2 block font-semibold text-fuchsia hover:underline"
          >
            Continuer en tant que Visiteur →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          label="Nom complet"
          name="nom_complet"
          value={values.nom_complet}
          placeholder="Ex : Aïcha Koné"
          autoComplete="name"
          error={touched.nom_complet ? errors.nom_complet : undefined}
          onChange={(v) => updateField("nom_complet", v)}
          onBlur={() => handleBlurField("nom_complet")}
        />
        <FormField
          label="Téléphone"
          name="telephone"
          type="tel"
          value={values.telephone}
          placeholder="+225 07 08 87 49 87"
          autoComplete="tel"
          error={touched.telephone ? errors.telephone : undefined}
          onChange={(v) => updateField("telephone", v)}
          onBlur={() => handleBlurField("telephone")}
        />
        <div className="sm:col-span-2">
          <FormField
            label="Email"
            name="email"
            type="email"
            value={values.email}
            placeholder="vous@entreprise.com"
            autoComplete="email"
            error={touched.email ? errors.email : undefined}
            onChange={(v) => updateField("email", v)}
            onBlur={() => handleBlurField("email")}
          />
        </div>
      </div>

      {/* Honeypot — hidden from real users, only bots fill it in. */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="site_web">Site web</label>
        <input
          id="site_web"
          name="site_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.site_web}
          onChange={(e) => updateField("site_web", e.target.value)}
        />
      </div>

      {submitError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia px-6 py-4 text-base font-semibold text-white shadow-lg shadow-fuchsia/20 transition-all duration-150 hover:bg-fuchsia-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
              />
            </svg>
            Envoi en cours...
          </>
        ) : (
          "Je m'inscris"
        )}
      </button>
    </form>
  );
}
