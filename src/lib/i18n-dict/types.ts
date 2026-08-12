import type { LanguageCode } from "@/lib/i18n";

export type PartialDict = Partial<Record<LanguageCode, Record<string, string>>>;
