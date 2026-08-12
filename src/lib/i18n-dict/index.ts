import type { LanguageCode } from "@/lib/i18n";
import type { PartialDict } from "./types";

import { modules } from "./modules";
import { crm } from "./crm";
import { ops } from "./ops";

const packs: PartialDict[] = [modules, crm, ops];

export function extraDict(code: LanguageCode): Record<string, string> {
  return packs.reduce<Record<string, string>>((acc, pack) => ({ ...acc, ...(pack[code] ?? {}) }), {});
}
