import type { Currency } from "@/features/ui/use-preferences";

const usdConversionRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  CZK: 23,
};

const currencyLocales: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  CZK: "cs-CZ",
};

export function formatCurrency(value: number, currency: Currency) {
  const convertedValue = value * usdConversionRates[currency];

  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(convertedValue);
}
