const DEFAULT_LOCALE = "en-US";

/** Formats a numeric(10,2) amount as currency, honoring the currency's own decimal convention. */
export function formatMoney(amount: number, currency: string, locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
