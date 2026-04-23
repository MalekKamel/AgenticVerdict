import { getStorageItem, setStorageItem } from "./core";
import { storageKeys } from "./keys";

export function getPreferredLocale(): string | null {
  return getStorageItem(storageKeys.preferredLocale);
}

export function setPreferredLocale(locale: string): boolean {
  return setStorageItem(storageKeys.preferredLocale, locale);
}
