import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rateLimit";
import { normalizePhone, validateLeadForm, type LeadFormValues } from "@/lib/validation";

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

  let body: Partial<LeadFormValues>;
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

  const { error } = await supabase.from("leads").insert({
    nom_complet: values.nom_complet.trim(),
    entreprise: values.entreprise.trim(),
    poste: values.poste.trim(),
    telephone: normalizePhone(values.telephone),
    email: values.email.trim().toLowerCase(),
    type_inscription: values.type_inscription as "exposant" | "partenaire_officiel" | "visiteur",
  });

  if (error) {
    console.error("Failed to insert lead:", error.message);
    return NextResponse.json(
      { error: "Une erreur est survenue. Merci de réessayer." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
