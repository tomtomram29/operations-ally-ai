import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorBlock } from "@/components/common/loading-block";

const title = "Set up your workspace — Northstar OS";
const description = "Create your company workspace: profile, country and currency, in three quick steps.";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const COUNTRIES = [
  { code: "IT", label: "Italia" },
  { code: "ES", label: "España" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Deutschland" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "CH", label: "Schweiz" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

const COMPANY_TYPES = [
  "Services",
  "Retail",
  "Wholesale",
  "Manufacturing",
  "Construction",
  "Hospitality",
  "Technology",
  "Other",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company, isLoading } = useCompany();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("Services");
  const [country, setCountry] = useState("IT");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && company) navigate({ to: "/dashboard", replace: true });
  }, [company, isLoading, navigate]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setEmail((current) => current || user.email || "");
      const full = (user.user_metadata?.["full_name"] as string | undefined) ?? "";
      const [first, ...rest] = full.split(" ");
      setFirstName((current) => current || first || "");
      setLastName((current) => current || rest.join(" "));
      setCompanyName(
        (current) => current || ((user.user_metadata?.["company_name"] as string | undefined) ?? ""),
      );
    });
  }, []);

  const step1Valid = firstName.trim().length > 1 && /.+@.+\..+/.test(email);
  const step2Valid = companyName.trim().length > 1 && country && currency;

  async function handleFinish() {
    setError(null);
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Session expired. Please sign in again.");

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const { data: created, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName.trim(),
          company_type: companyType,
          country,
          currency,
          owner_id: user.id,
        })
        .select("id")
        .single();
      if (companyError) throw companyError;

      const { error: memberError } = await supabase
        .from("company_members")
        .insert({ company_id: created.id, user_id: user.id, role: "owner" });
      if (memberError) throw memberError;

      await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName, company_name: companyName.trim() });

      await queryClient.invalidateQueries();
      toast.success("Workspace ready");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      console.error("[onboarding]", err);
      setError(errorMessage(err, "We couldn't create your workspace. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4.5" />
          </span>
          <span className="text-base font-semibold text-foreground">Northstar OS</span>
        </div>

        <Card className="border-border bg-card shadow-[var(--shadow-card)]">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 flex items-center gap-2">
              {[1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step {step} of 3
            </p>

            {step === 1 && (
              <div className="mt-4 space-y-4">
                <div>
                  <h1 className="text-xl font-semibold text-card-foreground">About you</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We use this on invoices and documents.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-4 space-y-4">
                <div>
                  <h1 className="text-xl font-semibold text-card-foreground">Your company</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You can change all of this later in Settings.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Company type</Label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMPANY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((item) => (
                          <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-4 space-y-4">
                <div>
                  <h1 className="text-xl font-semibold text-card-foreground">Confirm</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review and enter your dashboard.
                  </p>
                </div>
                <dl className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                  {[
                    ["Name", `${firstName} ${lastName}`.trim()],
                    ["Email", email],
                    ["Company", companyName],
                    ["Type", companyType],
                    ["Country", COUNTRIES.find((c) => c.code === country)?.label ?? country],
                    ["Currency", currency],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {error ? <div className="mt-4"><ErrorBlock message={error} /></div> : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || saving}
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                >
                  Continue <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleFinish} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {saving ? "Creating workspace..." : "Enter dashboard"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
