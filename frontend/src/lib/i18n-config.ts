import type { UserConfig } from "next-i18next/pages";
import enCommon from "@/locales/en/common.json";
import koCommon from "@/locales/ko/common.json";

export const supportedLocales = ["en", "ko"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const i18nConfig: UserConfig = {
  i18n: {
    defaultLocale: "en",
    locales: [...supportedLocales],
  },
  defaultNS: "common",
  ns: ["common"],
  fallbackLng: "en",
  supportedLngs: [...supportedLocales],
  interpolation: { escapeValue: false },
  resources: {
    en: { common: enCommon },
    ko: { common: koCommon },
  },
};
