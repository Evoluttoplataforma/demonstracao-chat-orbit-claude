/**
 * Paid-ad click-ID tracking for GTM conversion attribution.
 *
 * Captured: Meta (fbclid / _fbc cookie), Google (gclid, gbraid, wbraid, gad_source),
 * TikTok (ttclid), Microsoft/Bing (msclkid), LinkedIn (li_fat_id), Taboola (tblci),
 * plus the internal `sck` parameter.
 *
 * NOTE: these IDs are captured and forwarded to GTM to enable enhanced/offline
 * conversion APIs (Meta CAPI, Google Enhanced Conversions, LinkedIn CAPI, etc.).
 * They are NOT used to gate the `form_submit_success` event — that event fires
 * for every completed form regardless of traffic source, and GTM decides which
 * platform-specific tag to route it to.
 */
const PAID_CLICK_PARAMS = [
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "ttclid",
  "msclkid",
  "li_fat_id",
  "tblci",
  "sck",
] as const;

const STORAGE_KEY = "apex_paid_click_ids";
const FIRED_KEY = "apex_form_submit_fired";

type PaidClickIds = Partial<Record<(typeof PAID_CLICK_PARAMS)[number], string>> & {
  fbc?: string;
  captured_at?: number;
};

function readStorage(): PaidClickIds | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PaidClickIds) : null;
  } catch {
    return null;
  }
}

function writeStorage(ids: PaidClickIds): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be blocked (private mode, quota). Silently ignore.
  }
}

function readFbcCookie(): string | undefined {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Captures paid-ad click IDs from the current URL (and the Meta `_fbc` cookie)
 * and persists them in sessionStorage so they survive SPA navigation, refreshes,
 * and redirects that strip the query string.
 *
 * Call on every app boot — new values merge over old ones, empty captures never
 * overwrite a previously captured ID.
 */
export function capturePaidClickIds(): PaidClickIds {
  const existing = readStorage() || {};
  const merged: PaidClickIds = { ...existing };

  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of PAID_CLICK_PARAMS) {
      const value = params.get(key);
      if (value) merged[key] = value;
    }
  } catch {
    // URL parsing failed — fall through to cookie capture.
  }

  const fbc = readFbcCookie();
  if (fbc) merged.fbc = fbc;

  const changed = Object.keys(merged).some(
    (k) => merged[k as keyof PaidClickIds] !== existing[k as keyof PaidClickIds],
  );
  if (changed) {
    merged.captured_at = Date.now();
    writeStorage(merged);
  }

  return merged;
}

/**
 * Returns the paid click IDs captured during this session (from URL, cookie or
 * storage). Use this to enrich the form_submit_success payload so GTM can
 * forward them to Meta CAPI, Google Enhanced Conversions, etc.
 */
export function getPaidClickIds(): PaidClickIds {
  const stored = readStorage() || {};
  const merged: PaidClickIds = { ...stored };

  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of PAID_CLICK_PARAMS) {
      const value = params.get(key);
      if (value) merged[key] = value;
    }
  } catch {
    // ignore
  }

  const fbc = readFbcCookie();
  if (fbc) merged.fbc = fbc;

  return merged;
}

/**
 * Pushes a `form_submit_success` event to the dataLayer on the first completed
 * form of the session. GTM decides which platform tags (Google Ads, Meta,
 * LinkedIn, TikTok, etc.) fire from this single trigger.
 *
 * Captured click IDs are merged into the payload automatically so downstream
 * tags can forward them to server-side APIs.
 *
 * Dedup: fires at most once per browser session (sessionStorage guard) so
 * re-edits or navigation across funnels never produce duplicate conversions.
 *
 * Returns `true` if the event was pushed, `false` if skipped (already fired).
 */
export function pushFormSubmitSuccess(payload: Record<string, unknown>): boolean {
  try {
    if (sessionStorage.getItem(FIRED_KEY)) {
      console.log("[dataLayer] Skipped form_submit_success — already fired this session.");
      return false;
    }
  } catch {
    // sessionStorage blocked — fall through and fire (better to double-count than miss).
  }

  const clickIds = getPaidClickIds();

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "form_submit_success",
    ...clickIds,
    ...payload,
  });

  try {
    sessionStorage.setItem(FIRED_KEY, "1");
  } catch {
    // ignore storage errors
  }

  return true;
}

/**
 * @deprecated Use `pushFormSubmitSuccess` instead. This alias is kept temporarily
 * for backwards compatibility but no longer gates on paid traffic — the event
 * fires for every completed form.
 */
export const pushFormSubmitIfPaid = pushFormSubmitSuccess;

/**
 * @deprecated Kept for backwards compatibility. Returns true if any paid click
 * ID has been captured (URL, cookie, or storage). Do not use for conversion
 * gating — the conversion event fires regardless of traffic source.
 */
export function hasPaidClickId(): boolean {
  const ids = getPaidClickIds();
  return PAID_CLICK_PARAMS.some((p) => Boolean(ids[p])) || Boolean(ids.fbc);
}
