import type { SupportedLocale } from "@/lib/i18n-config";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function detectSupportedLocale(
  languageTags: readonly string[],
): SupportedLocale {
  for (const languageTag of languageTags) {
    const language = languageTag.toLowerCase().split("-")[0];
    if (language === "ko") return "ko";
    if (language === "en") return "en";
  }

  return "en";
}

export function getLocaleCookie(cookieHeader: string): SupportedLocale | null {
  const value = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];

  return value === "ko" || value === "en" ? value : null;
}

export function setLocaleCookie(locale: SupportedLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
