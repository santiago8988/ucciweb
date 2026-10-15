"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Native share sheet on phones (WhatsApp, Instagram, etc.); copies the link
// where the Web Share API isn't available.
export function ShareButton({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        // User closed the share sheet: nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá el link de la propiedad:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-5 text-sm font-medium text-ink transition-all hover:border-ink/30 hover:bg-ink/5 active:scale-95",
        className
      )}
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4 text-ink/70" />}
      <span aria-live="polite">{copied ? "Link copiado" : "Compartir"}</span>
    </button>
  );
}
