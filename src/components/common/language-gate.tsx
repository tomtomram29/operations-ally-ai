import { Sparkles, Check } from "lucide-react";

import { LANGUAGES, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** First-visit language chooser. Shown once, then remembered. */
export function LanguageGate() {
  const { language, setLanguage, chosen, ready, t } = useI18n();

  if (!ready || chosen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
        <span
          className="flex size-10 items-center justify-center rounded-xl text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-ai)" }}
        >
          <Sparkles className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-card-foreground">
          {t("lang.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("lang.subtitle")}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {LANGUAGES.map((item) => {
            const active = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary-soft text-primary-strong"
                    : "border-border bg-surface text-foreground hover:bg-accent",
                )}
              >
                <span aria-hidden="true" className="text-base">
                  {item.flag}
                </span>
                {item.label}
                {active && <Check className="ml-auto size-4" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
