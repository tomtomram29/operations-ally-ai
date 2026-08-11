import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage, formatDate, formatMoney } from "@/lib/format";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { InvoiceStatusBadge } from "@/components/business/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

const title = "Invoices — Northstar OS";
const description = "Create, track and settle invoices with live totals, due dates and payment status.";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const { companyId, company } = useCompany();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");

  const invoicesQuery = useQuery({
    queryKey: ["invoices", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(first_name, last_name, company_name)")
        .eq("company_id", companyId as string)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const due = new Date(today);
      due.setDate(due.getDate() + 30);
      const number = await nextInvoiceNumber(companyId as string);
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          company_id: companyId as string,
          invoice_number: number,
          issue_date: today.toISOString().slice(0, 10),
          due_date: due.toISOString().slice(0, 10),
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", companyId] });
      navigate({ to: "/invoices/$invoiceId", params: { invoiceId: id } });
    },
    onError: (error) => {
      console.error("[invoices.create]", error);
      toast.error(errorMessage(error, "Could not create the invoice."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice deleted");
      queryClient.invalidateQueries({ queryKey: ["invoices", companyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] });
    },
    onError: (error) => {
      console.error("[invoices.delete]", error);
      toast.error(errorMessage(error, "Could not delete this invoice."));
    },
  });

  const invoices = invoicesQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const overdue = invoice.status !== "paid" && invoice.status !== "cancelled" && (invoice.due_date ?? "9999-12-31") < today;
      const effective = overdue ? "overdue" : invoice.status;
      if (status !== "all" && effective !== status) return false;
      if (!needle) return true;
      const customer = invoice.customers as { first_name: string | null; last_name: string | null; company_name: string | null } | null;
      const name = [customer?.first_name, customer?.last_name, customer?.company_name].filter(Boolean).join(" ");
      return `${invoice.invoice_number} ${name}`.toLowerCase().includes(needle);
    });
  }, [invoices, term, status, today]);

  const newButton = (
    <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !companyId}>
      {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      New invoice
    </Button>
  );

  return (
    <AppShell>
      <PageHeader
        title="Invoices"
        description={`Billing and payment tracking${company ? ` for ${company.name}` : ""}.`}
        actions={newButton}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by number or customer..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {invoicesQuery.isLoading ? (
        <LoadingRows />
      ) : invoicesQuery.error ? (
        <ErrorBlock message={errorMessage(invoicesQuery.error, "Could not load invoices.")} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice, add line items and track when it gets paid."
          action={newButton}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="No invoice matches your search or filter." />
      ) : (
        <Card className="overflow-hidden border-border p-0 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Issued</TableHead>
                  <TableHead className="hidden sm:table-cell">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice) => {
                  const customer = invoice.customers as { first_name: string | null; last_name: string | null; company_name: string | null } | null;
                  const name =
                    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
                    customer?.company_name ||
                    "No customer";
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          to="/invoices/$invoiceId"
                          params={{ invoiceId: invoice.id }}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} dueDate={invoice.due_date} />
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatMoney(invoice.total, company?.currency ?? "EUR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDelete
                          title="Delete this invoice?"
                          description="The invoice and all its line items will be permanently removed."
                          onConfirm={() => deleteMutation.mutate(invoice.id)}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
