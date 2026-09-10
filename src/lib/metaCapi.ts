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
 * Sends the same "Lead" event to Meta's Conversions API, server-side. Paired
 * with the client-side pixel call using the same `eventId`, Meta deduplicates
 * the two into a single event — this is what keeps Lead tracking reliable
 * despite ad blockers and iOS App Tracking Transparency limiting the
 * browser-side pixel alone.
 *
 * No-ops silently if META_CONVERSIONS_API_ACCESS_TOKEN isn't configured, so
 * the form keeps working before that secret is set up.
 */
export async function sendMetaLeadEvent(params: LeadEventParams): Promise<void> {
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  if (!accessToken) return;

  const userData: Record<string, unknown> = {
    em: [hashForMeta(params.email)],
    ph: [hashForMeta(params.phoneDigits)],
    client_user_agent: params.userAgent,
  };
  if (params.clientIp !== "unknown") userData.client_ip_address = params.clientIp;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: {
          content_name: params.contentName,
          content_category: "inscription_serenite_2026",
        },
      },
    ],
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
    if (!res.ok) {
      console.error("Meta Conversions API error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Meta Conversions API request failed:", err);
  }
}
