const LOCALES: Record<string, string> = {
  en: "en-GB",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR",
};

let activeLocale = "it-IT";

/** Keeps number/date formatting aligned with the language the user picked. */
export function setFormatLocale(code: string) {
  activeLocale = LOCALES[code] ?? "en-GB";
}

export function formatMoney(value: number | string | null | undefined, currency = "EUR") {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(activeLocale, { dateStyle: "medium" }).format(date);
}

export function toNumber(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Human-safe error text. Never leaks stack traces or internals. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message && message.length < 200) return message;
  }
  return fallback;
}
