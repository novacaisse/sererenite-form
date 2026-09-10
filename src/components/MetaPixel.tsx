import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/config";

export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface AdvancedMatchingData {
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Fires the browser-side Lead event. `eventId` must match the id sent to
 * POST /api/leads so Meta dedupes this against the server-side Conversions
 * API event instead of double-counting the same lead.
 *
 * Re-calling fbq('init', ...) with em/ph/fn/ln right before the track call
 * is Meta's documented pattern for Advanced Matching once user data becomes
 * known mid-session — the pixel hashes these client-side before sending,
 * nothing plaintext leaves the browser. This materially improves how many
 * leads Meta can match back to a Facebook/Instagram account, which is what
 * the ad campaign's optimization and audience-building actually rely on.
 */
export function trackLeadEvent(
  contentName: string,
  eventId: string,
  advancedMatching?: AdvancedMatchingData,
) {
  if (typeof window === "undefined" || !window.fbq) return;

  if (advancedMatching) {
    window.fbq("init", META_PIXEL_ID, {
      em: advancedMatching.email,
      ph: advancedMatching.phone,
      fn: advancedMatching.firstName,
      ln: advancedMatching.lastName,
    });
  }

  window.fbq(
    "track",
    "Lead",
    {
      content_name: contentName,
      content_category: "inscription_serenite_2026",
    },
    { eventID: eventId },
  );
}
