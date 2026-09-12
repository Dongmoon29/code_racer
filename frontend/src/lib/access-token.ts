// Access tokens intentionally live only in memory. The persistent credential
// is an HttpOnly refresh-token cookie that browser JavaScript cannot read.
let accessToken: string | null = null;

export const getAccessToken = () =>
  typeof window === "undefined" ? null : accessToken;

export const setAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  accessToken = token;
};

export const clearAccessToken = () => {
  if (typeof window === "undefined") return;
  accessToken = null;
};

export const hasUsableAccessToken = (minimumValiditySeconds = 60) => {
  if (!accessToken) return false;
  try {
    const payloadPart = accessToken.split(".")[1];
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    return (
      typeof payload.exp === "number" &&
      payload.exp > Date.now() / 1000 + minimumValiditySeconds
    );
  } catch {
    return false;
  }
};
