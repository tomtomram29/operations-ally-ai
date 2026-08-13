import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { EmployeeFormDialog } from "@/components/business/employee-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const title = "Employees — Northstar OS";
const description = "Manage your team: contacts, roles, departments and status, stored securely in your workspace.";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const { t } = useI18n();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const employeesQuery = useQuery({
    queryKey: ["employees", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("staff.employees.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
    },
    onError: (error) => {
      console.error("[employees.delete]", error);
      toast.error(errorMessage(error, t("staff.employees.toast.deleteError")));
    },
  });

  const employees = employeesQuery.data ?? [];

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((employee) => {
      if (employee.department) set.add(employee.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return employees.filter((employee) => {
      if (statusFilter !== "all" && employee.status !== statusFilter) return false;
      if (departmentFilter !== "all" && employee.department !== departmentFilter) return false;
      if (!needle) return true;
      return [
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.phone,
        employee.role,
        employee.department,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [employees, term, statusFilter, departmentFilter]);

  const activeCount = employees.filter((employee) => employee.status === "active").length;

  return (
    <AppShell>
      <PageHeader
        title={t("staff.employees.title")}
        description={t("staff.employees.description")}
        actions={<EmployeeFormDialog trigger={<Button><Plus className="size-4" /> {t("staff.employees.new")}</Button>} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("staff.employees.kpi.total")}</p>
            <p className="mt-1 text-2xl font-semibold text-card-foreground">{employees.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("staff.employees.kpi.active")}</p>
            <p className="mt-1 text-2xl font-semibold text-card-foreground">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("staff.employees.kpi.departments")}</p>
            <p className="mt-1 text-2xl font-semibold text-card-foreground">{departments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("staff.employees.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("staff.employees.filter.allStatus")}</SelectItem>
            <SelectItem value="active">{t("staff.employees.status.active")}</SelectItem>
            <SelectItem value="inactive">{t("staff.employees.status.inactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("staff.employees.filter.allDepartments")}</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>{department}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {employeesQuery.isLoading ? (
        <LoadingRows />
      ) : employeesQuery.error ? (
        <ErrorBlock message={errorMessage(employeesQuery.error, t("staff.employees.error.load"))} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("staff.employees.empty.title")}
          description={t("staff.employees.empty.description")}
          action={<EmployeeFormDialog trigger={<Button><Plus className="size-4" /> {t("staff.employees.empty.action")}</Button>} />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("staff.employees.noMatches.title")} description={t("staff.employees.noMatches.description")} />
      ) : (
        <Card className="overflow-hidden border-border p-0 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("staff.employees.table.name")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("staff.employees.table.email")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("staff.employees.table.phone")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("staff.employees.table.role")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("staff.employees.table.department")}</TableHead>
                  <TableHead>{t("staff.employees.table.status")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("staff.employees.table.created")}</TableHead>
                  <TableHead className="text-right">{t("staff.employees.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((employee) => {
                  const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ");
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium text-foreground">{name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{employee.email || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{employee.phone || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{employee.role || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{employee.department || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                          {employee.status === "active" ? t("staff.employees.status.active") : t("staff.employees.status.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(employee.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <EmployeeFormDialog
                            employee={employee}
                            trigger={<Button variant="ghost" size="sm">{t("staff.employees.edit")}</Button>}
                          />
                          <ConfirmDelete
                            title={t("staff.employees.deleteTitle")}
                            description={t("staff.employees.deleteDescription")}
                            onConfirm={() => deleteMutation.mutate(employee.id)}
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
