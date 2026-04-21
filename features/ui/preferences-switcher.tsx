"use client";

import { usePreferences } from "@/features/ui/use-preferences";
import type { Currency, Language } from "@/features/ui/use-preferences";

const languageOptions: Array<{ label: string; value: Language }> = [
  { label: "EN", value: "en" },
  { label: "CZ", value: "cs" },
];

const currencyOptions: Array<{ label: string; value: Currency }> = [
  { label: "$", value: "USD" },
  { label: "€", value: "EUR" },
  { label: "Kč", value: "CZK" },
];

export function PreferencesSwitcher() {
  const { language, currency, setLanguage, setCurrency } = usePreferences();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
      <div className="flex rounded-md border border-zinc-200">
        {languageOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={`px-3 py-1.5 font-medium ${
              language === option.value
                ? "bg-zinc-950 text-white"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex rounded-md border border-zinc-200">
        {currencyOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => setCurrency(option.value)}
            className={`px-3 py-1.5 font-medium ${
              currency === option.value
                ? "bg-zinc-950 text-white"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
