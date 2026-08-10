import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { navSections } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type AppSidebarProps = {
  onNavigate?: () => void;
};

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar px-4 py-6">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <span
          className="flex size-9 items-center justify-center rounded-xl text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-ai)" }}
        >
          <Sparkles className="size-4.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-sidebar-foreground">Northstar OS</span>
          <span className="block text-xs text-muted-foreground">{t("brand.tagline")}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`nav.section.${section.title}`)}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {t(`nav.${item.to.replace("/", "")}`)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rounded-xl border border-sidebar-border bg-card p-3 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold text-card-foreground">{t("shell.workspace")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("shell.workspaceNote")}</p>
      </div>
    </div>
  );
}