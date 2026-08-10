import { Globe } from "lucide-react";

import { LANGUAGES, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} aria-label={t("lang.switch")} className="gap-2">
          <Globe className="size-4" />
          {!compact && <span className="text-sm">{current.code.toUpperCase()}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLanguage(item.code)}>
            <span aria-hidden="true">{item.flag}</span>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
