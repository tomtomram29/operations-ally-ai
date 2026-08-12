import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function LoadingInline({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label ?? t("ops.loading")}
    </p>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </p>
  );
}
