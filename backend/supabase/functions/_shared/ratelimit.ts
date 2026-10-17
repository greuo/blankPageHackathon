// Rate limits for edge functions, backed by public.hit_rate_limits (migration 20261017200000).
// The database does the counting atomically, so parallel requests can't slip past a limit and every
// edge function instance shares the same counters. Only the service role may call it.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

// scope: who the limit is for ("user" | "ip" | "global"), used to word the answer.
// key: identifies the counter (the window length is added by the database, so one key can carry several).
export type Limit = { scope: string; key: string; window: number; max: number };
export type Blocked = { scope: string; window: number; retryAfter: number };

// Checks the limits in order. Returns null when every one has room (and counts the call against all of
// them), or the first limit that is full (and counts the call against none). Throws if the limiter can't
// be reached; callers must treat that as "no" (fail closed), because an unreachable limiter is no limit.
export async function checkLimits(admin: SupabaseClient, limits: Limit[]): Promise<Blocked | null> {
  const { data, error } = await admin.rpc("hit_rate_limits", {
    p_keys: limits.map((l) => l.key),
    p_windows: limits.map((l) => l.window),
    p_maxes: limits.map((l) => l.max),
  });
  if (error) throw new Error(`hit_rate_limits failed: ${error.message}`);
  if (!Array.isArray(data)) throw new Error("hit_rate_limits returned an unexpected result");
  if (data.length === 0) return null;

  const { blocked, retry_after } = data[0] as { blocked: unknown; retry_after: unknown };
  const limit = Number.isInteger(blocked) ? limits[(blocked as number) - 1] : undefined;
  if (!limit || !Number.isInteger(retry_after)) throw new Error("hit_rate_limits returned an unexpected row");
  return { scope: limit.scope, window: limit.window, retryAfter: retry_after as number };
}

// A whole number >= 0 from the environment. Anything else (unset, empty, "abc", "-1", "2.5") keeps the
// default, so a typo can't loosen a limit; 0 is allowed and blocks everything for that limit.
export function envInt(getEnv: (name: string) => string | undefined, name: string, fallback: number): number {
  const raw = getEnv(name)?.trim();
  return raw && /^\d{1,9}$/.test(raw) ? Number(raw) : fallback;
}

// The caller's address as seen by Supabase's edge. cf-connecting-ip is set by Cloudflare and a client
// can't choose it; x-real-ip is the next best. null when neither is there: the per-IP limit is then
// skipped (not lumped into one shared bucket), and the account and global limits still apply.
// x-forwarded-for is deliberately not used: its first entry is whatever the client wrote.
export function clientIp(headers: Headers): string | null {
  for (const name of ["cf-connecting-ip", "x-real-ip"]) {
    const value = headers.get(name)?.trim();
    if (value && value.length <= 64) return value;
  }
  return null;
}

// Counters hold this instead of the raw address.
export async function hashKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

// "45 seconds", "1 minute", "3 hours": rounded up, for messages to the patient.
export function waitText(seconds: number): string {
  const s = Math.max(1, Math.ceil(seconds));
  if (s < 90) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.ceil(s / 60);
  if (m < 90) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.ceil(m / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}
