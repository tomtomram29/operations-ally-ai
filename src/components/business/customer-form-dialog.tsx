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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Customer = Tables<"customers">;

const EMPTY = {
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "IT",
  vat_number: "",
  notes: "",
};

export function CustomerFormDialog({
  trigger,
  customer,
}: {
  trigger: ReactNode;
  customer?: Customer;
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
      customer
        ? {
            first_name: customer.first_name ?? "",
            last_name: customer.last_name ?? "",
            company_name: customer.company_name ?? "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            country: customer.country ?? "IT",
            vat_number: customer.vat_number ?? "",
            notes: customer.notes ?? "",
          }
        : { ...EMPTY },
    );
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        company_name: form.company_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        vat_number: form.vat_number.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (customer) {
        const { error } = await supabase.from("customers").update(payload).eq("id", customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...payload, company_id: companyId as string });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(customer ? t("crm.form.toast.updated") : t("crm.form.toast.created"));
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customer?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("[customer.save]", error);
      toast.error(errorMessage(error, t("crm.form.toast.saveError")));
    },
  });

  function validate() {
    const next: Record<string, string> = {};
    if (!form.first_name.trim() && !form.last_name.trim() && !form.company_name.trim()) {
      next["first_name"] = t("crm.form.error.nameRequired");
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next["email"] = t("crm.form.error.invalidEmail");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? t("crm.form.editTitle") : t("crm.form.newTitle")}</DialogTitle>
          <DialogDescription>{t("crm.form.description")}</DialogDescription>
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
            {field("first_name", t("crm.form.firstName"))}
            {field("last_name", t("crm.form.lastName"))}
            {field("company_name", t("crm.form.companyName"))}
            {field("vat_number", t("crm.form.vatNumber"))}
            {field("email", t("crm.form.email"), "email")}
            {field("phone", t("crm.form.phone"))}
            {field("address", t("crm.form.address"))}
            {field("city", t("crm.form.city"))}
            {field("country", t("crm.form.country"))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("crm.form.notes")}</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("crm.form.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? t("crm.form.saving") : customer ? t("crm.form.save") : t("crm.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
