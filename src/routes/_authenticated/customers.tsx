import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage, formatDate } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { CustomerFormDialog } from "@/components/business/customer-form-dialog";
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

const title = "Customers — Northstar OS";
const description = "Your CRM: create, search and manage every customer, stored securely in your workspace.";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const customersQuery = useQuery({
    queryKey: ["customers", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", companyId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["customers", companyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] });
    },
    onError: (error) => {
      console.error("[customers.delete]", error);
      toast.error(errorMessage(error, "Could not delete this customer."));
    },
  });

  const customers = customersQuery.data ?? [];

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return customers.filter((customer) => {
      if (typeFilter === "business" && !customer.company_name) return false;
      if (typeFilter === "individual" && customer.company_name) return false;
      if (!needle) return true;
      return [
        customer.first_name,
        customer.last_name,
        customer.company_name,
        customer.email,
        customer.phone,
        customer.city,
        customer.vat_number,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [customers, term, typeFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        description="Every customer in your company workspace, stored in your database."
        actions={<CustomerFormDialog trigger={<Button><Plus className="size-4" /> New customer</Button>} />}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search customers..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            <SelectItem value="business">Businesses</SelectItem>
            <SelectItem value="individual">Individuals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {customersQuery.isLoading ? (
        <LoadingRows />
      ) : customersQuery.error ? (
        <ErrorBlock message={errorMessage(customersQuery.error, "Could not load customers.")} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start tracking invoices, sales and revenue."
          action={<CustomerFormDialog trigger={<Button><Plus className="size-4" /> Add your first customer</Button>} />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="No customer matches your search or filter." />
      ) : (
        <Card className="overflow-hidden border-border p-0 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => {
                  const name =
                    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
                    customer.company_name ||
                    "Unnamed";
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Link
                          to="/customers/$customerId"
                          params={{ customerId: customer.id }}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {name}
                        </Link>
                        {customer.company_name && name !== customer.company_name ? (
                          <span className="block text-xs text-muted-foreground">{customer.company_name}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {customer.email || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {customer.phone || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {customer.city || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <CustomerFormDialog
                            customer={customer}
                            trigger={<Button variant="ghost" size="sm">Edit</Button>}
                          />
                          <ConfirmDelete
                            title="Delete this customer?"
                            description="This action cannot be undone. Invoices and sales will keep their history but lose the customer link."
                            onConfirm={() => deleteMutation.mutate(customer.id)}
                            disabled={deleteMutation.isPending}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                {deleteMutation.isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            }
                          />
                        </div>
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
