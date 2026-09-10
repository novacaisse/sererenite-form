import "server-only";
import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "@/lib/config";

const GRAPH_API_VERSION = "v21.0";

function hashForMeta(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface LeadEventParams {
  eventId: string;
  email: string;
  /** Digits only, country code included, no leading "+" — e.g. "2250708874987". */
  phoneDigits: string;
  contentName: string;
  eventSourceUrl: string;
  clientIp: string;
  userAgent: string;
  fbp?: string;
  fbc?: string;
}

/**
 * Mirrors the same events the browser pixel fires (see trackLeadEvent in
 * MetaPixel.tsx) to Meta's Conversions API, server-side: the standard "Lead"
 * event plus custom "Inscription" (all registrations) and "Prospect"
 * (exhibitors/official partners). Matching event_id values on both sides
 * let Meta deduplicate each pair into a single event instead of double
 * counting. This is what keeps tracking reliable despite ad blockers and
 * iOS App Tracking Transparency limiting the browser-side pixel alone.
 *
 * No-ops silently if META_CONVERSIONS_API_ACCESS_TOKEN isn't configured, so
 * the form keeps working before that secret is set up. Logs a one-line
 * summary either way so this is diagnosable from Vercel's runtime logs
 * instead of failing invisibly.
 */
export async function sendMetaLeadEvent(params: LeadEventParams): Promise<void> {
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("Meta CAPI skipped: META_CONVERSIONS_API_ACCESS_TOKEN is not set.");
    return;
  }

  const userData: Record<string, unknown> = {
    em: [hashForMeta(params.email)],
    ph: [hashForMeta(params.phoneDigits)],
    client_user_agent: params.userAgent,
  };
  if (params.clientIp !== "unknown") userData.client_ip_address = params.clientIp;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const customData = {
    content_name: params.contentName,
    content_category: "inscription_serenite_2026",
  };
  const eventTime = Math.floor(Date.now() / 1000);

  const buildEvent = (eventName: string, eventId: string) => ({
    event_name: eventName,
    event_time: eventTime,
    event_id: eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: customData,
  });

  const events = [buildEvent("Lead", params.eventId), buildEvent("Inscription", `${params.eventId}-inscription`)];
  if (params.contentName === "exposant" || params.contentName === "partenaire_officiel") {
    events.push(buildEvent("Prospect", `${params.eventId}-prospect`));
  }

  const payload = {
    data: events,
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const responseBody = await res.text();
    if (!res.ok) {
      console.error("Meta CAPI error:", res.status, responseBody);
    } else {
      console.log("Meta CAPI ok:", events.map((e) => e.event_name).join(", "), responseBody);
    }
  } catch (err) {
    console.error("Meta CAPI request failed:", err);
  }
}
