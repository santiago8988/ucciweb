"use client";

import { useEffect } from "react";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Gtag = (...args: unknown[]) => void;

function track(event: string, params: Record<string, string>) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("event", event, params);
}

// Conversion tracking: every WhatsApp / phone link on the site is a lead.
// A single delegated listener covers server-rendered links too; links can add
// data-track="whatsapp|call" and data-property-code="<code>" for attribution.
function useContactClickTracking() {
  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute("href") ?? "";
      const kind =
        link.dataset.track ??
        (href.startsWith("https://wa.me/") ? "whatsapp" : href.startsWith("tel:") ? "call" : null);
      if (kind !== "whatsapp" && kind !== "call") return;
      track(kind === "whatsapp" ? "whatsapp_click" : "call_click", {
        page_path: window.location.pathname,
        property_code: link.dataset.propertyCode ?? "",
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
}

export function Analytics() {
  useContactClickTracking();
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
