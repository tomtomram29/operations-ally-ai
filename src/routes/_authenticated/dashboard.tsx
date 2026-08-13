import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageX,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { useI18n } from "@/lib/i18n";
import { errorMessage, formatDate, formatMoney, toNumber } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/business/invoice-status-badge";
import { KpiCard, type KpiTrend } from "@/components/business/kpi-card";
import { ChartRevenue, type RevenuePoint } from "@/components/business/chart-revenue";
import { ChartInvoiceStatus, type InvoiceStatusSlice } from "@/components/business/chart-invoice-status";

const title = "Dashboard — Northstar OS";
const description =
  "Live KPIs, revenue trends, invoice health and today's briefing, built directly from your business data.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DashboardPage,
});

type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  total: number;
  customer_id: string | null;
  customers: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
};

type SaleRow = { id: string; sale_date: string; total: number };
type ProductRow = { id: string; current_stock: number; minimum_stock: number };
type TaskRow = { id: string; title: string; due_date: string | null; completed: boolean; priority: string };

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function trendFrom(current: number, previous: number): KpiTrend {
  if (previous <= 0 && current <= 0) return "flat";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function changeLabel(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? "+100%" : undefined;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function DashboardPage() {
  const { t } = useI18n();
  const { companyId, company } = useCompany();
  const currency = company?.currency ?? "EUR";
  const today = new Date().toISOString().slice(0, 10);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const [invoicesRes, salesRes, customersRes, productsRes, tasksRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, invoice_number, status, issue_date, due_date, total, customer_id, customers(first_name, last_name, company_name)")
          .eq("company_id", companyId as string)
          .order("issue_date", { ascending: false }),
        supabase
          .from("sales")
          .select("id, sale_date, total")
          .eq("company_id", companyId as string),
        supabase
          .from("customers")
          .select("id, created_at", { count: "exact" })
          .eq("company_id", companyId as string),
        supabase
          .from("products")
          .select("id, current_stock, minimum_stock")
          .eq("company_id", companyId as string),
        supabase
          .from("tasks")
          .select("id, title, due_date, completed, priority")
          .eq("company_id", companyId as string)
          .eq("completed", false)
          .order("due_date", { ascending: true })
          .limit(6),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (salesRes.error) throw salesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      return {
        invoices: (invoicesRes.data ?? []) as unknown as InvoiceRow[],
        sales: (salesRes.data ?? []) as SaleRow[],
        customersCount: customersRes.count ?? (customersRes.data ?? []).length,
        customersCreated: (customersRes.data ?? []).map((row) => row.created_at as string),
        products: (productsRes.data ?? []) as ProductRow[],
        tasks: (tasksRes.data ?? []) as TaskRow[],
      };
    },
  });

  const stats = useMemo(() => {
    if (!dashboardQuery.data) return null;
    const { invoices, sales, customersCount, customersCreated, products, tasks } = dashboardQuery.data;

    const nowMonth = today.slice(0, 7);
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);

    const revenueForMonth = (key: string) => {
      const invoiceRevenue = invoices
        .filter((invoice) => invoice.status === "paid" && monthKey(invoice.issue_date) === key)
        .reduce((sum, invoice) => sum + toNumber(invoice.total), 0);
      const salesRevenue = sales
        .filter((sale) => monthKey(sale.sale_date) === key)
        .reduce((sum, sale) => sum + toNumber(sale.total), 0);
      return invoiceRevenue + salesRevenue;
    };

    const revenueThisMonth = revenueForMonth(nowMonth);
    const revenuePrevMonth = revenueForMonth(prevMonth);

    const outstandingInvoices = invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "overdue");
    const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => sum + toNumber(invoice.total), 0);

    const customersThisMonth = customersCreated.filter((date) => monthKey(date) === nowMonth).length;
    const customersPrevMonth = customersCreated.filter((date) => monthKey(date) === prevMonth).length;

    const lowStockProducts = products.filter((product) => product.current_stock <= product.minimum_stock);

    const revenueSeries: RevenuePoint[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      revenueSeries.push({
        label: d.toLocaleDateString(undefined, { month: "short" }),
        value: revenueForMonth(key),
      });
    }

    const statusCounts: Record<string, number> = {};
    for (const invoice of invoices) {
      const effective =
        invoice.status !== "paid" && invoice.status !== "cancelled" && (invoice.due_date ?? "9999-12-31") < today
          ? "overdue"
          : invoice.status;
      statusCounts[effective] = (statusCounts[effective] ?? 0) + 1;
    }

    const recentInvoices = invoices.slice(0, 5);
    const overdueTasks = tasks.filter((task) => task.due_date && task.due_date < today);
    const upcomingTasks = tasks.filter((task) => !task.due_date || task.due_date >= today);

    return {
      revenueThisMonth,
      revenuePrevMonth,
      outstandingTotal,
      outstandingCount: outstandingInvoices.length,
      customersCount,
      customersThisMonth,
      customersPrevMonth,
      lowStockCount: lowStockProducts.length,
      revenueSeries,
      statusCounts,
      recentInvoices,
      overdueTasks,
      upcomingTasks,
      totalPaidInvoicesThisMonth: invoices.filter(
        (invoice) => invoice.status === "paid" && monthKey(invoice.issue_date) === nowMonth,
      ).length,
    };
  }, [dashboardQuery.data, today]);

  const statusOrder = ["draft", "sent", "overdue", "paid", "cancelled"];
  const statusSlices: InvoiceStatusSlice[] = stats
    ? statusOrder
        .filter((key) => stats.statusCounts[key])
        .map((key) => ({
          key,
          label: t(`ops.invoices.status.${key}`),
          value: stats.statusCounts[key] ?? 0,
        }))
    : [];

  const briefing = useMemo(() => {
    if (!stats) return "";
    if (
      stats.revenueThisMonth === 0 &&
      stats.outstandingCount === 0 &&
      stats.customersCount === 0 &&
      stats.lowStockCount === 0 &&
      stats.overdueTasks.length === 0
    ) {
      return t("insights.dashboard.briefing.empty");
    }
    const parts: string[] = [];
    parts.push(
      t("insights.dashboard.briefing.revenue")
        .replace("{amount}", formatMoney(stats.revenueThisMonth, currency)),
    );
    if (stats.outstandingCount > 0) {
      parts.push(
        t("insights.dashboard.briefing.outstanding")
          .replace("{count}", String(stats.outstandingCount))
          .replace("{amount}", formatMoney(stats.outstandingTotal, currency)),
      );
    }
    if (stats.lowStockCount > 0) {
      parts.push(t("insights.dashboard.briefing.lowStock").replace("{count}", String(stats.lowStockCount)));
    }
    if (stats.overdueTasks.length > 0) {
      parts.push(t("insights.dashboard.briefing.overdueTasks").replace("{count}", String(stats.overdueTasks.length)));
    } else {
      parts.push(t("insights.dashboard.briefing.allCaughtUp"));
    }
    return parts.join(" ");
  }, [stats, t, currency]);

  return (
    <AppShell>
      <PageHeader title={t("mod.dashboard.title")} description={t("mod.dashboard.desc")} />

      {dashboardQuery.isLoading ? (
        <LoadingRows rows={6} />
      ) : dashboardQuery.error ? (
        <ErrorBlock message={errorMessage(dashboardQuery.error, t("insights.dashboard.error.load"))} />
      ) : !stats ? null : (
        <div className="flex flex-col gap-6">
          <Card className="border-border bg-gradient-to-br from-primary-soft to-transparent shadow-[var(--shadow-card)]">
            <CardContent className="flex items-start gap-3 py-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("insights.dashboard.briefing.title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{briefing}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Wallet}
              label={t("insights.dashboard.kpi.revenue")}
              value={formatMoney(stats.revenueThisMonth, currency)}
              hint={t("insights.dashboard.kpi.revenueHint")}
              trend={trendFrom(stats.revenueThisMonth, stats.revenuePrevMonth)}
              changeLabel={changeLabel(stats.revenueThisMonth, stats.revenuePrevMonth)}
            />
            <KpiCard
              icon={Receipt}
              label={t("insights.dashboard.kpi.outstanding")}
              value={formatMoney(stats.outstandingTotal, currency)}
              hint={t("insights.dashboard.kpi.outstandingHint").replace("{count}", String(stats.outstandingCount))}
              trend={stats.outstandingTotal > 0 ? "down" : "flat"}
            />
            <KpiCard
              icon={Users}
              label={t("insights.dashboard.kpi.customers")}
              value={String(stats.customersCount)}
              hint={t("insights.dashboard.kpi.customersHint")}
              trend={trendFrom(stats.customersThisMonth, stats.customersPrevMonth)}
              changeLabel={
                stats.customersThisMonth > 0 || stats.customersPrevMonth > 0
                  ? `${stats.customersThisMonth > 0 ? "+" : ""}${stats.customersThisMonth}`
                  : undefined
              }
            />
            <KpiCard
              icon={PackageX}
              label={t("insights.dashboard.kpi.lowStock")}
              value={String(stats.lowStockCount)}
              hint={t("insights.dashboard.kpi.lowStockHint")}
              trend={stats.lowStockCount > 0 ? "down" : "up"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="border-border shadow-[var(--shadow-card)] xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t("insights.dashboard.chart.revenueTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartRevenue
                  data={stats.revenueSeries}
                  currency={currency}
                  emptyLabel={t("insights.dashboard.chart.empty")}
                />
              </CardContent>
            </Card>

            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">{t("insights.dashboard.chart.statusTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartInvoiceStatus data={statusSlices} emptyLabel={t("insights.dashboard.chart.empty")} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">{t("insights.dashboard.recentInvoices.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentInvoices.length === 0 ? (
                  <div className="px-6 pb-6">
                    <EmptyState
                      icon={FileText}
                      title={t("insights.dashboard.recentInvoices.emptyTitle")}
                      description={t("insights.dashboard.recentInvoices.emptyDescription")}
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {stats.recentInvoices.map((invoice) => {
                      const customer = invoice.customers;
                      const name =
                        [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
                        customer?.company_name ||
                        t("ops.invoices.noCustomer");
                      return (
                        <li key={invoice.id} className="flex items-center justify-between gap-3 px-6 py-3">
                          <div className="min-w-0">
                            <Link
                              to="/invoices/$invoiceId"
                              params={{ invoiceId: invoice.id }}
                              className="block truncate text-sm font-medium text-foreground hover:text-primary"
                            >
                              {invoice.invoice_number}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{name}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-sm font-medium text-foreground">
                              {formatMoney(invoice.total, currency)}
                            </span>
                            <InvoiceStatusBadge status={invoice.status} dueDate={invoice.due_date} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">{t("insights.dashboard.tasks.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stats.overdueTasks.length === 0 && stats.upcomingTasks.length === 0 ? (
                  <div className="px-6 pb-6">
                    <EmptyState
                      icon={CheckCircle2}
                      title={t("insights.dashboard.tasks.emptyTitle")}
                      description={t("insights.dashboard.tasks.emptyDescription")}
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {[...stats.overdueTasks, ...stats.upcomingTasks].slice(0, 6).map((task) => {
                      const overdue = Boolean(task.due_date && task.due_date < today);
                      return (
                        <li key={task.id} className="flex items-center justify-between gap-3 px-6 py-3">
                          <div className="flex min-w-0 items-center gap-2">
                            {overdue ? (
                              <AlertTriangle className="size-4 shrink-0 text-destructive" />
                            ) : (
                              <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate text-sm text-foreground">{task.title}</span>
                          </div>
                          <span className={overdue ? "shrink-0 text-xs font-medium text-destructive" : "shrink-0 text-xs text-muted-foreground"}>
                            {task.due_date ? formatDate(task.due_date) : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
