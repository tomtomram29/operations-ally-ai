import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage, formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { Card, CardContent } from "@/components/ui/card";

const title = "Search — Northstar OS";
const description = "Search across customers and invoices in your workspace.";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (search: Record<string, unknown>) => ({ q: String(search["q"] ?? "") }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useI18n();
  const { q } = Route.useSearch();
  const { companyId, company } = useCompany();
  const currency = company?.currency ?? "EUR";

  const results = useQuery({
    queryKey: ["search", companyId, q],
    enabled: Boolean(companyId && q),
    queryFn: async () => {
      const like = `%${q}%`;
      const [customers, invoices] = await Promise.all([
        supabase
          .from("customers")
          .select("id, first_name, last_name, company_name, email")
          .eq("company_id", companyId as string)
          .or(`first_name.ilike.${like},last_name.ilike.${like},company_name.ilike.${like},email.ilike.${like}`)
          .limit(20),
        supabase
          .from("invoices")
          .select("id, invoice_number, total")
          .eq("company_id", companyId as string)
          .ilike("invoice_number", like)
          .limit(20),
      ]);
      if (customers.error) throw customers.error;
      if (invoices.error) throw invoices.error;
      return { customers: customers.data, invoices: invoices.data };
    },
  });

  const total = (results.data?.customers.length ?? 0) + (results.data?.invoices.length ?? 0);

  return (
    <AppShell>
      <PageHeader title={t("crm.search.title")} description={q ? t("crm.search.resultsFor").replace("{q}", q) : t("crm.search.typeToSearch")} />

      {results.isLoading ? (
        <LoadingRows />
      ) : results.error ? (
        <ErrorBlock message={errorMessage(results.error, t("crm.search.error"))} />
      ) : total === 0 ? (
        <EmptyState icon={SearchIcon} title={t("crm.search.empty.title")} description={t("crm.search.empty.description")} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardContent className="space-y-2 p-6">
              <h2 className="text-sm font-semibold text-foreground">{t("crm.search.customers")}</h2>
              {results.data?.customers.map((customer) => (
                <Link
                  key={customer.id}
                  to="/customers/$customerId"
                  params={{ customerId: customer.id }}
                  className="block rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface"
                >
                  {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.company_name || t("crm.search.unnamed")}
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardContent className="space-y-2 p-6">
              <h2 className="text-sm font-semibold text-foreground">{t("crm.search.invoices")}</h2>
              {results.data?.invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  to="/invoices/$invoiceId"
                  params={{ invoiceId: invoice.id }}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface"
                >
                  <span>{invoice.invoice_number}</span>
                  <span>{formatMoney(invoice.total, currency)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
