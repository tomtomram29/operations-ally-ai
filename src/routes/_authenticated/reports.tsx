import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Download, PackageSearch, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { useI18n } from "@/lib/i18n";
import { errorMessage, formatMoney, toNumber } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChartRevenue, type RevenuePoint } from "@/components/business/chart-revenue";

const title = "Reports — Northstar OS";
const description =
  "Revenue trends, top customers and products, and invoice aging built live from your business data, with CSV export.";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ReportsPage,
});

type RangeKey = "thisMonth" | "last3Months" | "thisYear" | "last12Months";

function rangeBounds(range: RangeKey) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (range === "thisMonth") {
    start.setDate(1);
  } else if (range === "last3Months") {
    start.setMonth(start.getMonth() - 2);
    start.setDate(1);
  } else if (range === "thisYear") {
    start.setMonth(0, 1);
  } else {
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
  }
  return { start: start.toISOString().slice(0, 10), end };
}

function bucketKey(dateStr: string, granularity: "day" | "month") {
  return granularity === "day" ? dateStr.slice(0, 10) : dateStr.slice(0, 7);
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const { t } = useI18n();
  const { companyId, company } = useCompany();
  const currency = company?.currency ?? "EUR";
  const [range, setRange] = useState<RangeKey>("last12Months");
  const { start, end } = useMemo(() => rangeBounds(range), [range]);
  const today = new Date().toISOString().slice(0, 10);

  const reportsQuery = useQuery({
    queryKey: ["reports", companyId, start, end],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const [invoicesRes, salesRes, saleItemsRes, invoiceItemsRes, allInvoicesRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, status, issue_date, due_date, total, customer_id, customers(first_name, last_name, company_name)")
          .eq("company_id", companyId as string)
          .gte("issue_date", start)
          .lte("issue_date", end),
        supabase
          .from("sales")
          .select("id, sale_date, total, customer_id, customers(first_name, last_name, company_name)")
          .eq("company_id", companyId as string)
          .gte("sale_date", start)
          .lte("sale_date", end),
        supabase
          .from("sale_items")
          .select("quantity, product_id, products(name), sales!inner(sale_date, company_id)")
          .eq("company_id", companyId as string)
          .gte("sales.sale_date", start)
          .lte("sales.sale_date", end),
        supabase
          .from("invoice_items")
          .select("quantity, product_id, products(name), invoices!inner(issue_date, company_id)")
          .eq("company_id", companyId as string)
          .gte("invoices.issue_date", start)
          .lte("invoices.issue_date", end),
        supabase
          .from("invoices")
          .select("id, status, due_date, total")
          .eq("company_id", companyId as string)
          .neq("status", "paid")
          .neq("status", "cancelled"),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (salesRes.error) throw salesRes.error;
      if (saleItemsRes.error) throw saleItemsRes.error;
      if (invoiceItemsRes.error) throw invoiceItemsRes.error;
      if (allInvoicesRes.error) throw allInvoicesRes.error;

      return {
        invoices: invoicesRes.data ?? [],
        sales: salesRes.data ?? [],
        saleItems: saleItemsRes.data ?? [],
        invoiceItems: invoiceItemsRes.data ?? [],
        openInvoices: allInvoicesRes.data ?? [],
      };
    },
  });

  const derived = useMemo(() => {
    if (!reportsQuery.data) return null;
    const { invoices, sales, saleItems, invoiceItems, openInvoices } = reportsQuery.data;

    const granularity: "day" | "month" = range === "thisMonth" ? "day" : "month";

    const buckets = new Map<string, number>();
    for (const invoice of invoices) {
      if (invoice.status !== "paid") continue;
      const key = bucketKey(invoice.issue_date, granularity);
      buckets.set(key, (buckets.get(key) ?? 0) + toNumber(invoice.total));
    }
    for (const sale of sales) {
      const key = bucketKey(sale.sale_date, granularity);
      buckets.set(key, (buckets.get(key) ?? 0) + toNumber(sale.total));
    }
    const revenueSeries: RevenuePoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => ({
        label:
          granularity === "day"
            ? new Date(key).toLocaleDateString(undefined, { day: "2-digit", month: "short" })
            : new Date(`${key}-01`).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        value,
      }));

    const customerTotals = new Map<string, { name: string; total: number }>();
    const addCustomerAmount = (
      customerId: string | null,
      customer: { first_name: string | null; last_name: string | null; company_name: string | null } | null,
      amount: number,
    ) => {
      if (!customerId) return;
      const name =
        [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
        customer?.company_name ||
        t("ops.invoices.noCustomer");
      const existing = customerTotals.get(customerId);
      customerTotals.set(customerId, { name, total: (existing?.total ?? 0) + amount });
    };
    for (const invoice of invoices) {
      if (invoice.status !== "paid") continue;
      addCustomerAmount(invoice.customer_id, invoice.customers as never, toNumber(invoice.total));
    }
    for (const sale of sales) {
      addCustomerAmount(sale.customer_id, sale.customers as never, toNumber(sale.total));
    }
    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const productTotals = new Map<string, { name: string; quantity: number }>();
    const addProductQuantity = (productId: string | null, product: { name: string } | null, quantity: number) => {
      if (!productId) return;
      const name = product?.name ?? t("insights.reports.unknownProduct");
      const existing = productTotals.get(productId);
      productTotals.set(productId, { name, quantity: (existing?.quantity ?? 0) + quantity });
    };
    for (const item of saleItems) {
      addProductQuantity(item.product_id, item.products as never, toNumber(item.quantity));
    }
    for (const item of invoiceItems) {
      addProductQuantity(item.product_id, item.products as never, toNumber(item.quantity));
    }
    const topProducts = Array.from(productTotals.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    const aging = { current: 0, days1to30: 0, days31to60: 0, days60plus: 0 };
    for (const invoice of openInvoices) {
      const due = invoice.due_date ?? today;
      const diffDays = Math.floor((new Date(today).getTime() - new Date(due).getTime()) / (1000 * 60 * 60 * 24));
      const amount = toNumber(invoice.total);
      if (diffDays <= 0) aging.current += amount;
      else if (diffDays <= 30) aging.days1to30 += amount;
      else if (diffDays <= 60) aging.days31to60 += amount;
      else aging.days60plus += amount;
    }

    return { revenueSeries, topCustomers, topProducts, aging };
  }, [reportsQuery.data, range, t, today]);

  const exportCsv = () => {
    if (!derived) return;
    const rows: string[][] = [[t("insights.reports.csv.date"), t("insights.reports.csv.amount")]];
    for (const point of derived.revenueSeries) {
      rows.push([point.label, point.value.toFixed(2)]);
    }
    downloadCsv(`revenue-${range}.csv`, rows);
  };

  const rangeOptions: { value: RangeKey; label: string }[] = [
    { value: "thisMonth", label: t("insights.reports.range.thisMonth") },
    { value: "last3Months", label: t("insights.reports.range.last3Months") },
    { value: "thisYear", label: t("insights.reports.range.thisYear") },
    { value: "last12Months", label: t("insights.reports.range.last12Months") },
  ];

  const agingBuckets: { key: string; label: string; value: number }[] = derived
    ? [
        { key: "current", label: t("insights.reports.aging.current"), value: derived.aging.current },
        { key: "1-30", label: t("insights.reports.aging.days1to30"), value: derived.aging.days1to30 },
        { key: "31-60", label: t("insights.reports.aging.days31to60"), value: derived.aging.days31to60 },
        { key: "60+", label: t("insights.reports.aging.days60plus"), value: derived.aging.days60plus },
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        title={t("mod.reports.title")}
        description={t("mod.reports.desc")}
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(value) => setRange(value as RangeKey)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {rangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} disabled={!derived}>
              <Download className="size-4" /> {t("insights.reports.export")}
            </Button>
          </div>
        }
      />

      {reportsQuery.isLoading ? (
        <LoadingRows rows={6} />
      ) : reportsQuery.error ? (
        <ErrorBlock message={errorMessage(reportsQuery.error, t("insights.reports.error.load"))} />
      ) : !derived ? null : (
        <div className="flex flex-col gap-6">
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">{t("insights.reports.chart.revenueTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartRevenue data={derived.revenueSeries} currency={currency} emptyLabel={t("insights.reports.chart.empty")} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">{t("insights.reports.topCustomers.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {derived.topCustomers.length === 0 ? (
                  <div className="px-6 pb-6">
                    <EmptyState
                      icon={Users}
                      title={t("insights.reports.topCustomers.emptyTitle")}
                      description={t("insights.reports.topCustomers.emptyDescription")}
                    />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("insights.reports.topCustomers.name")}</TableHead>
                        <TableHead className="text-right">{t("insights.reports.topCustomers.billed")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {derived.topCustomers.map((customer) => (
                        <TableRow key={customer.name}>
                          <TableCell className="text-foreground">{customer.name}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {formatMoney(customer.total, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">{t("insights.reports.topProducts.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {derived.topProducts.length === 0 ? (
                  <div className="px-6 pb-6">
                    <EmptyState
                      icon={PackageSearch}
                      title={t("insights.reports.topProducts.emptyTitle")}
                      description={t("insights.reports.topProducts.emptyDescription")}
                    />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("insights.reports.topProducts.name")}</TableHead>
                        <TableHead className="text-right">{t("insights.reports.topProducts.quantity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {derived.topProducts.map((product) => (
                        <TableRow key={product.name}>
                          <TableCell className="text-foreground">{product.name}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">{product.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">{t("insights.reports.aging.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {agingBuckets.every((bucket) => bucket.value === 0) ? (
                <EmptyState
                  icon={Clock3}
                  title={t("insights.reports.aging.emptyTitle")}
                  description={t("insights.reports.aging.emptyDescription")}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {agingBuckets.map((bucket) => (
                    <div key={bucket.key} className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">{bucket.label}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {formatMoney(bucket.value, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
