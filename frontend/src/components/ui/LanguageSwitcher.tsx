import { Languages } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import type { SupportedLocale } from "@/lib/i18n-config";
import { setLocaleCookie } from "@/lib/locale-detection";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const locale = router.locale === "ko" ? "ko" : "en";

  const changeLanguage = async (nextLocale: SupportedLocale) => {
    if (nextLocale === locale) return;
    setLocaleCookie(nextLocale);
    await router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: nextLocale },
    );
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-[var(--gray-6)] bg-[var(--color-panel)] p-1",
        className,
      )}
      role="group"
      aria-label={t("language.label")}
    >
      {!compact && <Languages className="mx-1 h-4 w-4 text-[var(--gray-10)]" />}
      {(["en", "ko"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => void changeLanguage(item)}
          aria-pressed={locale === item}
          className={cn(
            "cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors",
            locale === item
              ? "bg-[var(--accent-4)] text-[var(--accent-11)]"
              : "text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--color-text)]",
          )}
        >
          {item === "en" ? "EN" : "한국어"}
        </button>
      ))}
    </div>
  );
}
