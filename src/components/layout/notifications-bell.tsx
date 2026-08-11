import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAlerts } from "@/lib/data/alerts";
import { useCompany } from "@/lib/company";

export function NotificationsBell() {
  const { companyId } = useCompany();
  const { data: alerts = [], isLoading } = useAlerts(companyId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4.5" />
          {alerts.length > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {alerts.length > 9 ? "9+" : alerts.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="text-xs text-muted-foreground">Generated from your live business data</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading notifications...</p>
          ) : alerts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            alerts.map((alert) => (
              <Link
                key={alert.id}
                to={alert.to}
                className="block border-b border-border px-4 py-3 last:border-0 hover:bg-surface"
              >
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.body}</p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
