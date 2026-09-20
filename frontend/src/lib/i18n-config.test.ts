import { describe, expect, it } from "vitest";
import en from "@/locales/en/common.json";
import ko from "@/locales/ko/common.json";
import { i18nConfig, supportedLocales } from "./i18n-config";
import { detectSupportedLocale, getLocaleCookie } from "./locale-detection";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n configuration", () => {
  it("registers English and Korean with English as the fallback", () => {
    expect(supportedLocales).toEqual(["en", "ko"]);
    expect(i18nConfig.i18n.defaultLocale).toBe("en");
    expect(i18nConfig.fallbackLng).toBe("en");
  });

  it("keeps both locale dictionaries structurally aligned", () => {
    expect(flattenKeys(ko).sort()).toEqual(flattenKeys(en).sort());
  });

  it("detects supported browser languages in preference order", () => {
    expect(detectSupportedLocale(["ko-KR", "en-US"])).toBe("ko");
    expect(detectSupportedLocale(["ja-JP", "en-GB"])).toBe("en");
    expect(detectSupportedLocale(["ja-JP"])).toBe("en");
  });

  it("reads only supported locale preferences from cookies", () => {
    expect(getLocaleCookie("theme=dark; NEXT_LOCALE=ko; session=abc")).toBe(
      "ko",
    );
    expect(getLocaleCookie("NEXT_LOCALE=ja")).toBeNull();
  });
});
