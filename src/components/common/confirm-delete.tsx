import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";

type ConfirmDeleteProps = {
  trigger: ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
};

export function ConfirmDelete({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
}: ConfirmDeleteProps) {
  const { t } = useI18n();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t("ops.confirmDelete.title")}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? t("ops.confirmDelete.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("ops.confirmDelete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel ?? t("ops.confirmDelete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
