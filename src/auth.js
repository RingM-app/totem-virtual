import { BACKEND_URL } from "./config";

const STORAGE_KEY = 'totem_auth';
export { STORAGE_KEY };

export function getStoredTokens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

export function storeTokens(tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

// JWT payloads are base64url: plain atob() threw on "-"/"_" and the role came back
// empty, so an admin could randomly land on the guard view.
export function parseJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=")));
  } catch {
    return {};
  }
}

let inFlight = null;

/**
 * Refreshes the session. Returns the new access token, null if the session is gone
 * (refresh rejected), or throws on network/server errors (caller keeps the session).
 *
 * Single-flight: the refresh token is one-time use, so several 401s at once (one per
 * camera card) must share ONE refresh — a second request with the same token is
 * rejected and used to log the guard out. Another tab may also have rotated it
 * first: on a rejection, a different token already in storage is adopted instead.
 */
export function refreshSession() {
  if (!inFlight) {
    inFlight = doRefresh().finally(() => { inFlight = null; });
  }
  return inFlight;
}

async function doRefresh() {
  const stored = getStoredTokens();
  if (!stored?.refresh_token) return null;
  const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: stored.refresh_token }),
  });
  if (res.ok) {
    const data = await res.json();
    storeTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? stored.refresh_token,
    });
    return data.access_token;
  }
  if (res.status === 401) {
    const now = getStoredTokens();
    if (now?.refresh_token && now.refresh_token !== stored.refresh_token) return now.access_token;
    return null;
  }
  throw new Error(`refresh ${res.status}`);
}
