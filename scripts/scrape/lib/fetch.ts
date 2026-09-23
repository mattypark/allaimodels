/**
 * Polite fetching, and the one rule the whole refresh depends on: a source
 * that fails returns a failure. It never returns a plausible-looking blank.
 */

// ASCII only. HTTP header values are ByteStrings, so a stray em dash here
// throws before a single request leaves the process.
export const UA = 'allaimodels-bot/0.1 (+https://github.com/mattypark/allaimodels)';

export type Fetched =
  | { ok: true; url: string; body: string; fetchedAt: string }
  | { ok: false; url: string; reason: string };

const DELAY_MS = 1200;
let lastCall = 0;

async function throttle() {
  const wait = DELAY_MS - (Date.now() - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

export async function get(url: string, timeoutMs = 20_000): Promise<Fetched> {
  await throttle();
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'text/markdown, text/html, application/json' },
      signal: control.signal,
      redirect: 'follow',
    });

    if (!res.ok) {
      return { ok: false, url, reason: `HTTP ${res.status} ${res.statusText}` };
    }
    return {
      ok: true,
      url,
      body: await res.text(),
      fetchedAt: new Date().toISOString().slice(0, 10),
    };
  } catch (err) {
    const e = err as Error;
    // A TLS mismatch here usually means a network filter, not a dead site.
    return { ok: false, url, reason: e.name === 'AbortError' ? `timed out after ${timeoutMs}ms` : e.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function getJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; reason: string }> {
  const res = await get(url);
  if (!res.ok) return { ok: false, reason: res.reason };
  try {
    return { ok: true, data: JSON.parse(res.body) as T };
  } catch {
    return { ok: false, reason: 'response was not valid JSON' };
  }
}
