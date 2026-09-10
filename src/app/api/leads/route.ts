import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMetaLeadEvent } from "@/lib/metaCapi";
import { isRateLimited } from "@/lib/rateLimit";
import { normalizePhone, validateLeadForm, type LeadFormValues } from "@/lib/validation";

interface LeadRequestBody extends Partial<LeadFormValues> {
  /** Client-generated id, shared with the browser-side fbq('track', 'Lead', ...) call for dedup. */
  event_id?: string;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Merci de réessayer dans une minute." },
      { status: 429 },
    );
  }

  let body: LeadRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field. Silently pretend
  // success so bots don't learn to avoid it.
  if (typeof body.site_web === "string" && body.site_web.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const values: LeadFormValues = {
    nom_complet: body.nom_complet ?? "",
    entreprise: body.entreprise ?? "",
    poste: body.poste ?? "",
    telephone: body.telephone ?? "",
    email: body.email ?? "",
    type_inscription: body.type_inscription ?? "",
    site_web: "",
  };

  const errors = validateLeadForm(values);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Données invalides.", fieldErrors: errors }, { status: 400 });
  }

  const supabase = createAdminClient();
  const normalizedPhone = normalizePhone(values.telephone);
  const normalizedEmail = values.email.trim().toLowerCase();

  const { error } = await supabase.from("leads").insert({
    nom_complet: values.nom_complet.trim(),
    entreprise: values.entreprise.trim(),
    poste: values.poste.trim(),
    telephone: normalizedPhone,
    email: normalizedEmail,
    type_inscription: values.type_inscription as "exposant" | "partenaire_officiel" | "visiteur",
  });

  if (error) {
    console.error("Failed to insert lead:", error.message);
    return NextResponse.json(
      { error: "Une erreur est survenue. Merci de réessayer." },
      { status: 500 },
    );
  }

  // Best-effort server-side mirror of the client pixel's Lead event (same
  // event_id => Meta dedups them). Never blocks or fails the form response.
  if (body.event_id) {
    void sendMetaLeadEvent({
      eventId: body.event_id,
      email: normalizedEmail,
      phoneDigits: normalizedPhone.replace(/[^\d]/g, ""),
      contentName: values.type_inscription,
      eventSourceUrl: request.headers.get("referer") ?? new URL(request.url).origin,
      clientIp: ip,
      userAgent: request.headers.get("user-agent") ?? "",
      fbp: request.cookies.get("_fbp")?.value,
      fbc: request.cookies.get("_fbc")?.value,
    });
  }

  return NextResponse.json({ success: true });
}
