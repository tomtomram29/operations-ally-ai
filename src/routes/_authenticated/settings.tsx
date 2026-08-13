import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = "Settings — Northstar OS";
const description = "Manage your profile, company details, preferences and team access.";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SettingsPage,
});

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

function SettingsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("staff.settings.title")} description={t("staff.settings.description")} />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("staff.settings.tabs.profile")}</TabsTrigger>
          <TabsTrigger value="company">{t("staff.settings.tabs.company")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("staff.settings.tabs.preferences")}</TabsTrigger>
          <TabsTrigger value="team">{t("staff.settings.tabs.team")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileSection /></TabsContent>
        <TabsContent value="company"><CompanySection /></TabsContent>
        <TabsContent value="preferences"><PreferencesSection /></TabsContent>
        <TabsContent value="team"><TeamSection /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ProfileSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const profileQuery = useQuery({
    queryKey: ["own-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error(t("staff.settings.error.session"));
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return { profile: data, email: user.email ?? "" };
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.profile?.full_name ?? "");
    setJobTitle(profileQuery.data.profile?.job_title ?? "");
  }, [profileQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error(t("staff.settings.error.session"));
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName.trim() || null, job_title: jobTitle.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("staff.settings.profile.toast.saved"));
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-company"] });
    },
    onError: (error) => {
      console.error("[settings.profile.save]", error);
      toast.error(errorMessage(error, t("staff.settings.profile.toast.saveError")));
    },
  });

  if (profileQuery.isLoading) return <LoadingRows />;
  if (profileQuery.error) return <ErrorBlock message={errorMessage(profileQuery.error, t("staff.settings.error.load"))} />;

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>{t("staff.settings.profile.title")}</CardTitle>
        <CardDescription>{t("staff.settings.profile.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!mutation.isPending) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">{t("staff.settings.profile.fullName")}</Label>
              <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">{t("staff.settings.profile.jobTitle")}</Label>
              <Input id="jobTitle" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountEmail">{t("staff.settings.profile.email")}</Label>
            <Input id="accountEmail" value={profileQuery.data?.email ?? ""} disabled readOnly />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? t("staff.settings.saving") : t("staff.settings.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const COMPANY_EMPTY = {
  name: "",
  company_type: "",
  vat_number: "",
  address: "",
  city: "",
  postal_code: "",
  country: "",
  currency: "EUR",
  phone: "",
  email: "",
};

function CompanySection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { company, role, isLoading, error } = useCompany();
  const [form, setForm] = useState({ ...COMPANY_EMPTY });
  const canEdit = role === "owner" || role === "admin";

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name ?? "",
      company_type: company.company_type ?? "",
      vat_number: company.vat_number ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      postal_code: company.postal_code ?? "",
      country: company.country ?? "",
      currency: company.currency ?? "EUR",
      phone: company.phone ?? "",
      email: company.email ?? "",
    });
  }, [company]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error(t("staff.settings.error.noCompany"));
      const payload = {
        name: form.name.trim(),
        company_type: form.company_type.trim() || null,
        vat_number: form.vat_number.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
        country: form.country.trim(),
        currency: form.currency,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      };
      const { error: updateError } = await supabase.from("companies").update(payload).eq("id", company.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success(t("staff.settings.company.toast.saved"));
      queryClient.invalidateQueries({ queryKey: ["current-company"] });
    },
    onError: (err) => {
      console.error("[settings.company.save]", err);
      toast.error(errorMessage(err, t("staff.settings.company.toast.saveError")));
    },
  });

  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorBlock message={errorMessage(error, t("staff.settings.error.load"))} />;

  function field(key: keyof typeof COMPANY_EMPTY, label: string) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          value={form[key]}
          disabled={!canEdit}
          onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
        />
      </div>
    );
  }

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>{t("staff.settings.company.title")}</CardTitle>
        <CardDescription>{t("staff.settings.company.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!canEdit ? (
          <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t("staff.settings.company.readOnlyNote")}
          </p>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canEdit && !mutation.isPending) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", t("staff.settings.company.name"))}
            {field("company_type", t("staff.settings.company.type"))}
            {field("vat_number", t("staff.settings.company.vatNumber"))}
            {field("phone", t("staff.settings.company.phone"))}
            {field("email", t("staff.settings.company.email"))}
            {field("address", t("staff.settings.company.address"))}
            {field("city", t("staff.settings.company.city"))}
            {field("postal_code", t("staff.settings.company.postalCode"))}
            {field("country", t("staff.settings.company.country"))}
            <div className="space-y-1.5">
              <Label>{t("staff.settings.company.currency")}</Label>
              <Select
                value={form.currency}
                disabled={!canEdit}
                onValueChange={(value) => setForm((prev) => ({ ...prev, currency: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {canEdit ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {mutation.isPending ? t("staff.settings.saving") : t("staff.settings.save")}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  const { t } = useI18n();
  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>{t("staff.settings.preferences.title")}</CardTitle>
        <CardDescription>{t("staff.settings.preferences.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t("staff.settings.preferences.language")}</p>
            <p className="text-xs text-muted-foreground">{t("staff.settings.preferences.languageNote")}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSection() {
  const { t } = useI18n();
  const { companyId } = useCompany();

  const membersQuery = useQuery({
    queryKey: ["company-members", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_members")
        .select("*")
        .eq("company_id", companyId as string)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const members = membersQuery.data ?? [];

  return (
    <Card className="overflow-hidden border-border p-0 shadow-[var(--shadow-card)]">
      <CardHeader className="p-6 pb-0">
        <CardTitle>{t("staff.settings.team.title")}</CardTitle>
        <CardDescription>{t("staff.settings.team.description")}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {membersQuery.isLoading ? (
          <LoadingRows />
        ) : membersQuery.error ? (
          <ErrorBlock message={errorMessage(membersQuery.error, t("staff.settings.error.load"))} />
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("staff.settings.team.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("staff.settings.team.table.member")}</TableHead>
                  <TableHead>{t("staff.settings.team.table.role")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-foreground">{member.user_id}</TableCell>
                    <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
