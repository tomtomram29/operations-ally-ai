import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, Search, Loader2 } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useCompany } from "@/lib/company";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { t } = useI18n();
  const navigate = useNavigate();
  const { company, isLoading } = useCompany();

  useEffect(() => {
    if (!isLoading && !company) navigate({ to: "/onboarding", replace: true });
  }, [company, isLoading, navigate]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    navigate({ to: "/search", search: { q: term.trim() } });
  }

  return (
    <div className="flex min-h-screen w-full bg-surface">
      <aside className="hidden w-[264px] shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <form onSubmit={onSearch} className="relative hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("shell.search")}
              className="h-9 rounded-lg border-border bg-surface pl-9 text-sm"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            {company ? (
              <span className="hidden max-w-[160px] truncate rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground sm:block">
                {company.name}
              </span>
            ) : null}
            <LanguageSwitcher />
            <NotificationsBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {isLoading ? (
              <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading workspace...
              </div>
            ) : company ? (
              children
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
