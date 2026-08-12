import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCompany } from "@/lib/company";
import { errorMessage, formatMoney, toNumber } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { InvoiceStatusBadge } from "@/components/business/invoice-status-badge";
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

const title = "Invoice — Northstar OS";
const description = "Edit invoice details, line items and payment status.";

export const Route = createFileRoute("/_authenticated/invoices/$invoiceId")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { t } = useI18n();
  const { invoiceId } = Route.useParams();
  const { companyId, company } = useCompany();
  const queryClient = useQueryClient();
  const [item, setItem] = useState({ description: "", quantity: "1", unit_price: "0", tax_rate: "22" });

  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*), customers(id, first_name, last_name, company_name)")
        .eq("id", invoiceId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const customersQuery = useQuery({
    queryKey: ["customers", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name, company_name")
        .eq("company_id", companyId as string);
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    queryClient.invalidateQueries({ queryKey: ["invoices", companyId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] });
  };

  const updateInvoice = useMutation({
    mutationFn: async (patch: { customer_id?: string | null; status?: string; issue_date?: string; due_date?: string }) => {
      const { error } = await supabase.from("invoices").update(patch).eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error) => {
      console.error("[invoice.update]", error);
      toast.error(errorMessage(error, t("ops.invoiceDetail.error.update")));
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoice_items").insert({
        company_id: companyId as string,
        invoice_id: invoiceId,
        description: item.description.trim(),
        quantity: toNumber(item.quantity, 1),
        unit_price: toNumber(item.unit_price, 0),
        tax_rate: toNumber(item.tax_rate, 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setItem({ description: "", quantity: "1", unit_price: "0", tax_rate: "22" });
      toast.success(t("ops.invoiceDetail.toast.itemAdded"));
      refresh();
    },
    onError: (error) => {
      console.error("[invoice.addItem]", error);
      toast.error(errorMessage(error, t("ops.invoiceDetail.error.addItem")));
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoice_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error) => {
      console.error("[invoice.removeItem]", error);
      toast.error(errorMessage(error, t("ops.invoiceDetail.error.removeItem")));
    },
  });

  const invoice = invoiceQuery.data;
  const currency = company?.currency ?? "EUR";

  return (
    <AppShell>
      <Link to="/invoices" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("ops.invoiceDetail.back")}
      </Link>

      {invoiceQuery.isLoading ? (
        <LoadingRows />
      ) : invoiceQuery.error || !invoice ? (
        <ErrorBlock message={errorMessage(invoiceQuery.error, t("ops.invoiceDetail.error.load"))} />
      ) : (
        <>
          <PageHeader
            title={t("ops.invoiceDetail.pageTitle").replace("{number}", invoice.invoice_number)}
            description={t("ops.invoiceDetail.pageDescription")}
            actions={<InvoiceStatusBadge status={invoice.status} dueDate={invoice.due_date} />}
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-sm font-semibold text-foreground">{t("ops.invoiceDetail.lineItems")}</h2>
                <div className="space-y-2">
                  {(invoice.invoice_items ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("ops.invoiceDetail.noLineItems")}</p>
                  ) : (
                    (invoice.invoice_items ?? []).map((line) => (
                      <div key={line.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{line.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {toNumber(line.quantity)} × {formatMoney(line.unit_price, currency)} · {t("ops.invoiceDetail.vat")} {toNumber(line.tax_rate)}%
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {formatMoney(toNumber(line.quantity) * toNumber(line.unit_price), currency)}
                        </span>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem.mutate(line.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <form
                  className="grid gap-2 sm:grid-cols-[1fr_80px_110px_90px_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!item.description.trim()) {
                      toast.error(t("ops.invoiceDetail.error.descriptionRequired"));
                      return;
                    }
                    addItem.mutate();
                  }}
                >
                  <Input
                    placeholder={t("ops.invoiceDetail.placeholder.description")}
                    value={item.description}
                    onChange={(event) => setItem((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <Input
                    type="number" min="0" step="1" placeholder={t("ops.invoiceDetail.placeholder.quantity")}
                    value={item.quantity}
                    onChange={(event) => setItem((prev) => ({ ...prev, quantity: event.target.value }))}
                  />
                  <Input
                    type="number" min="0" step="0.01" placeholder={t("ops.invoiceDetail.placeholder.price")}
                    value={item.unit_price}
                    onChange={(event) => setItem((prev) => ({ ...prev, unit_price: event.target.value }))}
                  />
                  <Input
                    type="number" min="0" step="0.5" placeholder={t("ops.invoiceDetail.placeholder.vat")}
                    value={item.tax_rate}
                    onChange={(event) => setItem((prev) => ({ ...prev, tax_rate: event.target.value }))}
                  />
                  <Button type="submit" disabled={addItem.isPending}>
                    {addItem.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  </Button>
                </form>

                <div className="space-y-1 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("ops.invoiceDetail.subtotal")}</span><span>{formatMoney(invoice.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("ops.invoiceDetail.vat")}</span><span>{formatMoney(invoice.tax_total, currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-foreground">
                    <span>{t("ops.invoiceDetail.total")}</span><span>{formatMoney(invoice.total, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit border-border shadow-[var(--shadow-card)]">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <Label>{t("ops.invoiceDetail.customer")}</Label>
                  <Select
                    value={invoice.customer_id ?? "none"}
                    onValueChange={(value) => updateInvoice.mutate({ customer_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger><SelectValue placeholder={t("ops.invoiceDetail.selectCustomer")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("ops.invoices.noCustomer")}</SelectItem>
                      {(customersQuery.data ?? []).map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.company_name || t("ops.invoiceDetail.unnamed")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("ops.invoiceDetail.status")}</Label>
                  <Select value={invoice.status} onValueChange={(value) => updateInvoice.mutate({ status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t("ops.invoices.status.draft")}</SelectItem>
                      <SelectItem value="sent">{t("ops.invoices.status.sent")}</SelectItem>
                      <SelectItem value="paid">{t("ops.invoices.status.paid")}</SelectItem>
                      <SelectItem value="cancelled">{t("ops.invoices.status.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="issue">{t("ops.invoiceDetail.issueDate")}</Label>
                  <Input
                    id="issue" type="date" defaultValue={invoice.issue_date}
                    onBlur={(event) => updateInvoice.mutate({ issue_date: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due">{t("ops.invoiceDetail.dueDate")}</Label>
                  <Input
                    id="due" type="date" defaultValue={invoice.due_date ?? ""}
                    onBlur={(event) => updateInvoice.mutate({ due_date: event.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
