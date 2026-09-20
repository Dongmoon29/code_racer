import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  detectSupportedLocale,
  getLocaleCookie,
  setLocaleCookie,
} from "@/lib/locale-detection";

export default function BrowserLocaleSync() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    // An explicit Korean URL is a user choice and takes precedence over both
    // the stored preference and the browser language.
    if (
      window.location.pathname === "/ko" ||
      window.location.pathname.startsWith("/ko/")
    ) {
      if (getLocaleCookie(document.cookie) !== "ko") {
        setLocaleCookie("ko");
      }
      return;
    }

    // Keep a language the user has already selected in the switcher.
    if (getLocaleCookie(document.cookie)) return;

    const browserLocale = detectSupportedLocale(
      navigator.languages?.length
        ? navigator.languages
        : [navigator.language || "en"],
    );
    setLocaleCookie(browserLocale);

    if (router.locale !== browserLocale) {
      void router.replace(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale: browserLocale },
      );
    }
  }, [router]);

  return null;
}
