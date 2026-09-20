import { useEffect } from "react";
import { useRouter } from "next/router";
import { getLocaleCookie, setLocaleCookie } from "@/lib/locale-detection";

export default function LocalePreferenceSync() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    // An explicit Korean URL is a user choice and updates the saved preference.
    if (
      window.location.pathname === "/ko" ||
      window.location.pathname.startsWith("/ko/")
    ) {
      if (getLocaleCookie(document.cookie) !== "ko") {
        setLocaleCookie("ko");
      }
      return;
    }

    // New visitors stay on English. Only a previously saved Korean preference
    // changes an unprefixed route to Korean.
    if (getLocaleCookie(document.cookie) === "ko" && router.locale !== "ko") {
      void router.replace(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale: "ko" },
      );
    }
  }, [router]);

  return null;
}
