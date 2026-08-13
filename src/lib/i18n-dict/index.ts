import type { LanguageCode } from "@/lib/i18n";
import type { PartialDict } from "./types";

import { modules } from "./modules";
import { crm } from "./crm";
import { ops } from "./ops";
import { trade } from "./trade";
import { staff } from "./staff";
import { insights } from "./insights";

const packs: PartialDict[] = [modules, crm, ops, trade, staff, insights];

export function extraDict(code: LanguageCode): Record<string, string> {
  return packs.reduce<Record<string, string>>((acc, pack) => ({ ...acc, ...(pack[code] ?? {}) }), {});
}
