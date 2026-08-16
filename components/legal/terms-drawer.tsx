"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useLanguage } from "@/context/LanguageContext";
import { termsAndConditions } from "@/lib/legal/terms-and-conditions";
import { CURRENT_LEGAL_UPDATE, currentTermsAddendum } from "@/lib/legal/current-legal-addendum";

type TermsDrawerProps = {
  trigger: React.ReactNode;
};

export function TermsDrawer({ trigger }: TermsDrawerProps) {
  const { locale, t } = useLanguage();
  const terms = termsAndConditions[locale];
  const updatedTerms = {
    ...terms,
    lastUpdated: locale === "pt" ? CURRENT_LEGAL_UPDATE : "August 16, 2026",
    sections: [...terms.sections, currentTermsAddendum[locale]],
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="mx-auto max-h-[85vh] max-w-lg rounded-t-2xl border-white/10 bg-zinc-950 text-zinc-50">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-lg">
            {t("legal.termsTitle", { defaultValue: "Terms & Conditions" })}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-zinc-400">
            {t("legal.termsLastUpdated", {
              defaultValue: "Last updated: {date}",
              date: updatedTerms.lastUpdated,
            })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="scrollbar-thin max-h-[min(60vh,32rem)] space-y-5 overflow-y-auto px-5 pb-8 text-xs leading-relaxed text-zinc-400">
          <p>{updatedTerms.intro}</p>

          {updatedTerms.sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-200">
                {section.title}
              </h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
