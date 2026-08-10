import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Sparkles, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/common/language-switcher";

const title = "Sign in — Northstar OS";
const description =
  "Access your Northstar OS workspace: customers, sales, invoices, inventory and your AI executive assistant.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function goToApp() {
    await router.invalidate();
    navigate({ to: "/dashboard", replace: true });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, company_name: company },
          },
        });
        if (signUpError) throw signUpError;
      }
      await goToApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(t("auth.googleError"));
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    await goToApp();
  }

  return (
    <main className="flex min-h-screen w-full bg-surface">
      <div className="hidden flex-1 flex-col justify-between p-12 lg:flex" style={{ backgroundImage: "var(--gradient-ai)" }}>
        <Link to="/" className="flex items-center gap-3 text-primary-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="size-4.5" />
          </span>
          <span className="text-sm font-semibold">Northstar OS</span>
        </Link>
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            {t("auth.heroTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            {t("auth.heroCopy")}
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">{t("auth.heroFoot")}</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-xl text-primary-foreground lg:hidden"
                style={{ backgroundImage: "var(--gradient-ai)" }}
              >
                <Sparkles className="size-4.5" />
              </span>
              <span className="text-sm font-semibold text-foreground lg:hidden">Northstar OS</span>
            </Link>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "signin" ? t("auth.welcome") : t("auth.create")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.welcomeSub") : t("auth.createSub")}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 w-full gap-2"
            onClick={onGoogle}
            disabled={loading}
          >
            <GoogleMark />
            {t("auth.google")}
          </Button>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.or")}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marco Rossi"
                    autoComplete="name"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t("auth.company")}</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Srl"
                    autoComplete="organization"
                    className="h-11"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.new") : t("auth.have")}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
            >
              {mode === "signin" ? t("auth.createLink") : t("auth.signin")}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}