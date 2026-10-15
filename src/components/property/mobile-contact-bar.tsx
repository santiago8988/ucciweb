import { MessageCircle, Phone } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

// Fixed bottom bar on phones/tablets so WhatsApp and call stay reachable while
// scrolling the listing (on desktop the sidebar card is sticky instead).
export function MobileContactBar({
  whatsappHref,
  telHref,
  price,
  propertyCode,
}: {
  whatsappHref: string | null;
  telHref: string | null;
  price: string;
  propertyCode: string;
}) {
  if (!whatsappHref && !telHref) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur-md lg:hidden">
      <div className="content-wrap flex items-center gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="min-w-0 flex-1 truncate text-base font-bold text-ink">{price}</p>
        {telHref && (
          <a
            href={telHref}
            data-track="call"
            data-property-code={propertyCode}
            aria-label="Llamar"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-11 shrink-0 p-0 border-ink/15")}
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-property-code={propertyCode}
            className={cn(
              buttonVariants(),
              "h-11 shrink-0 bg-brand px-5 font-semibold text-black hover:bg-brand-dark hover:text-white"
            )}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
