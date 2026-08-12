import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage, formatDate, formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { CustomerFormDialog } from "@/components/business/customer-form-dialog";
import { InvoiceStatusBadge } from "@/components/business/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const title = "Customer — Northstar OS";
const description = "Customer profile with contact details and invoice history.";

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { t } = useI18n();
  const { customerId } = Route.useParams();
  const { company } = useCompany();
  const currency = company?.currency ?? "EUR";

  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, invoices(id, invoice_number, issue_date, due_date, status, total)")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const customer = customerQuery.data;
  const invoices = customer?.invoices ?? [];
  const billed = invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);

  return (
    <AppShell>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("crm.customerDetail.back")}
      </Link>

      {customerQuery.isLoading ? (
        <LoadingRows />
      ) : customerQuery.error || !customer ? (
        <ErrorBlock message={errorMessage(customerQuery.error, t("crm.customerDetail.error"))} />
      ) : (
        <>
          <PageHeader
            title={
              [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
              customer.company_name ||
              t("crm.customerDetail.fallbackTitle")
            }
            description={customer.company_name ?? t("crm.customerDetail.fallbackDescription")}
            actions={<CustomerFormDialog customer={customer} trigger={<Button variant="outline">{t("crm.customerDetail.edit")}</Button>} />}
          />

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="h-fit border-border shadow-[var(--shadow-card)]">
              <CardContent className="space-y-3 p-6 text-sm">
                <Detail label={t("crm.customerDetail.email")} value={customer.email} />
                <Detail label={t("crm.customerDetail.phone")} value={customer.phone} />
                <Detail label={t("crm.customerDetail.address")} value={[customer.address, customer.city, customer.country].filter(Boolean).join(", ")} />
                <Detail label={t("crm.customerDetail.vat")} value={customer.vat_number} />
                <Detail label={t("crm.customerDetail.since")} value={formatDate(customer.created_at)} />
                <Detail label={t("crm.customerDetail.totalBilled")} value={formatMoney(billed, currency)} />
                {customer.notes ? <Detail label={t("crm.customerDetail.notes")} value={customer.notes} /> : null}
              </CardContent>
            </Card>

            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardContent className="space-y-2 p-6">
                <h2 className="text-sm font-semibold text-foreground">{t("crm.customerDetail.invoices")}</h2>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("crm.customerDetail.noInvoices")}</p>
                ) : (
                  invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      to="/invoices/$invoiceId"
                      params={{ invoiceId: invoice.id }}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2 hover:bg-surface"
                    >
                      <span className="text-sm font-medium text-foreground">{invoice.invoice_number}</span>
                      <span className="flex items-center gap-3">
                        <InvoiceStatusBadge status={invoice.status} dueDate={invoice.due_date} />
                        <span className="text-sm text-foreground">{formatMoney(invoice.total, currency)}</span>
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-foreground">{value || "\u2014"}</p>
    </div>
  );
}
