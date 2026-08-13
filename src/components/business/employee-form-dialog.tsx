import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Employee = Tables<"employees">;

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  department: "",
  status: "active",
};

export function EmployeeFormDialog({
  trigger,
  employee,
}: {
  trigger: ReactNode;
  employee?: Employee;
}) {
  const { t } = useI18n();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      employee
        ? {
            first_name: employee.first_name ?? "",
            last_name: employee.last_name ?? "",
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            role: employee.role ?? "",
            department: employee.department ?? "",
            status: employee.status ?? "active",
          }
        : { ...EMPTY },
    );
  }, [open, employee]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        role: form.role.trim() || null,
        department: form.department.trim() || null,
        status: form.status,
      };
      if (employee) {
        const { error } = await supabase.from("employees").update(payload).eq("id", employee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employees")
          .insert({ ...payload, company_id: companyId as string });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(employee ? t("staff.employees.form.toast.updated") : t("staff.employees.form.toast.created"));
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("[employee.save]", error);
      toast.error(errorMessage(error, t("staff.employees.form.toast.saveError")));
    },
  });

  function validate() {
    const next: Record<string, string> = {};
    if (!form.first_name.trim()) {
      next["first_name"] = t("staff.employees.form.error.firstNameRequired");
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next["email"] = t("staff.employees.form.error.invalidEmail");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function field(key: keyof typeof EMPTY, label: string, type = "text") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type={type}
          value={form[key]}
          onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
        />
        {errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{employee ? t("staff.employees.form.editTitle") : t("staff.employees.form.newTitle")}</DialogTitle>
          <DialogDescription>{t("staff.employees.form.description")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            if (validate()) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {field("first_name", t("staff.employees.form.firstName"))}
            {field("last_name", t("staff.employees.form.lastName"))}
            {field("email", t("staff.employees.form.email"), "email")}
            {field("phone", t("staff.employees.form.phone"))}
            {field("role", t("staff.employees.form.role"))}
            {field("department", t("staff.employees.form.department"))}
          </div>
          <div className="space-y-1.5">
            <Label>{t("staff.employees.form.status")}</Label>
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("staff.employees.status.active")}</SelectItem>
                <SelectItem value="inactive">{t("staff.employees.status.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("staff.employees.form.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? t("staff.employees.form.saving") : employee ? t("staff.employees.form.save") : t("staff.employees.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
