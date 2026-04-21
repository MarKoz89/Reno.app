"use client";

import { useSyncExternalStore } from "react";

export type Language = "en" | "cs";
export type Currency = "USD" | "EUR" | "CZK";

type Preferences = {
  language: Language;
  currency: Currency;
};

const preferencesKey = "reno-app:preferences";
const preferencesEvent = "reno-app:preferences-changed";
const defaultPreferences: Preferences = {
  language: "en",
  currency: "USD",
};

let cachedRawPreferences: string | null | undefined;
let cachedPreferences = defaultPreferences;

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "cs";
}

function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "EUR" || value === "CZK";
}

function normalizePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object") {
    return defaultPreferences;
  }

  const candidate = value as Partial<Preferences>;

  return {
    language: isLanguage(candidate.language)
      ? candidate.language
      : defaultPreferences.language,
    currency: isCurrency(candidate.currency)
      ? candidate.currency
      : defaultPreferences.currency,
  };
}

function readPreferences() {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  const rawPreferences = window.localStorage.getItem(preferencesKey);

  if (rawPreferences === cachedRawPreferences) {
    return cachedPreferences;
  }

  cachedRawPreferences = rawPreferences;

  if (!rawPreferences) {
    cachedPreferences = defaultPreferences;
    return cachedPreferences;
  }

  try {
    cachedPreferences = normalizePreferences(JSON.parse(rawPreferences));
  } catch {
    cachedPreferences = defaultPreferences;
  }

  return cachedPreferences;
}

function writePreferences(preferences: Preferences) {
  if (typeof window === "undefined") {
    return;
  }

  cachedPreferences = preferences;
  cachedRawPreferences = JSON.stringify(preferences);
  window.localStorage.setItem(preferencesKey, cachedRawPreferences);
  window.dispatchEvent(new Event(preferencesEvent));
}

function subscribeToPreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferencesEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferencesEvent, onStoreChange);
  };
}

export function usePreferences() {
  const preferences = useSyncExternalStore(
    subscribeToPreferences,
    readPreferences,
    () => defaultPreferences,
  );

  return {
    ...preferences,
    setLanguage(language: Language) {
      writePreferences({ ...readPreferences(), language });
    },
    setCurrency(currency: Currency) {
      writePreferences({ ...readPreferences(), currency });
    },
  };
}
