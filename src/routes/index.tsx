import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, BarChart3, Users, FileText, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/common/language-switcher";

const title = "Northstar OS — The AI Operating System for Business";
const description =
  "Run customers, sales, invoices, inventory and people from one elegant workspace, with an AI executive assistant that briefs you every morning.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: LandingPage,
});

const pillars = [
  { icon: Users, key: "customers" },
  { icon: FileText, key: "invoices" },
  { icon: Package, key: "inventory" },
  { icon: BarChart3, key: "reports" },
];

function LandingPage() {
  const { user, loading } = useSession();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-ai)" }}
            >
              <Sparkles className="size-4.5" />
            </span>
            <span className="text-sm font-semibold text-foreground">Northstar OS</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            {loading ? null : user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">
                  {t("landing.open")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">{t("landing.signin")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth">{t("landing.getstarted")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center md:px-8 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {t("landing.badge")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-6xl">
            {t("landing.h1")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("landing.sub")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? t("landing.open") : t("landing.start")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6">
              <Link to="/auth">{t("landing.demo")}</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <div
                key={pillar.key}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                  <pillar.icon className="size-4.5" />
                </span>
                <h2 className="mt-4 text-sm font-semibold text-card-foreground">
                  {t(`nav.${pillar.key}`)}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.${pillar.key}`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-muted-foreground md:px-8">
          © {new Date().getFullYear()} Northstar OS. {t("landing.rights")}
        </div>
      </footer>
    </div>
  );
}