"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TYPE_INSCRIPTION_OPTIONS } from "@/lib/config";
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

export function RegistrationForm() {
  const router = useRouter();
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

  function handleBlur(field: keyof LeadFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateLeadForm(values));
  }

  function handleTypeSelect(type: TypeInscription) {
    updateField("type_inscription", type);
    setTouched((prev) => ({ ...prev, type_inscription: true }));
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
        {touched.type_inscription && errors.type_inscription && (
          <p className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
            {errors.type_inscription}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          label="Nom complet"
          name="nom_complet"
          value={values.nom_complet}
          placeholder="Ex : Aïcha Koné"
          autoComplete="name"
          error={touched.nom_complet ? errors.nom_complet : undefined}
          onChange={(v) => updateField("nom_complet", v)}
          onBlur={() => handleBlur("nom_complet")}
        />
        <FormField
          label="Entreprise / Organisation"
          name="entreprise"
          value={values.entreprise}
          placeholder="Ex : SecuriGroup SA"
          autoComplete="organization"
          error={touched.entreprise ? errors.entreprise : undefined}
          onChange={(v) => updateField("entreprise", v)}
          onBlur={() => handleBlur("entreprise")}
        />
        <FormField
          label="Poste / Fonction"
          name="poste"
          value={values.poste}
          placeholder="Ex : Directrice commerciale"
          autoComplete="organization-title"
          error={touched.poste ? errors.poste : undefined}
          onChange={(v) => updateField("poste", v)}
          onBlur={() => handleBlur("poste")}
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
          onBlur={() => handleBlur("telephone")}
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
            onBlur={() => handleBlur("email")}
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
