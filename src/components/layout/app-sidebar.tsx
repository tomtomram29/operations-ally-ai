import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { navSections } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  onNavigate?: () => void;
};

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar px-4 py-6">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <span
          className="flex size-9 items-center justify-center rounded-xl text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-ai)" }}
        >
          <Sparkles className="size-4.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-sidebar-foreground">Northstar OS</span>
          <span className="block text-xs text-muted-foreground">Business Operating System</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
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
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rounded-xl border border-sidebar-border bg-card p-3 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold text-card-foreground">Workspace</p>
        <p className="mt-1 text-xs text-muted-foreground">Architecture preview — modules unlock as we build.</p>
      </div>
    </div>
  );
}