// deno test backend/supabase/functions/_shared/
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { checkLimits, clientIp, envInt, hashKey, type Limit, waitText } from "./ratelimit.ts";

const limits: Limit[] = [
  { scope: "user", key: "chat:user:u1", window: 60, max: 5 },
  { scope: "ip", key: "chat:ip:abc", window: 3600, max: 40 },
  { scope: "global", key: "chat:global", window: 86400, max: 400 },
];

// A stand-in for the service-role client: records what rpc was called with, answers with `result`.
function fakeAdmin(result: { data?: unknown; error?: { message: string } | null }) {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const admin = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args });
      return Promise.resolve({ data: result.data ?? null, error: result.error ?? null });
    },
  } as unknown as SupabaseClient;
  return { admin, calls };
}

Deno.test("checkLimits sends the keys, windows and maxes in order", async () => {
  const { admin, calls } = fakeAdmin({ data: [] });
  assertEquals(await checkLimits(admin, limits), null);
  assertEquals(calls, [{
    fn: "hit_rate_limits",
    args: {
      p_keys: ["chat:user:u1", "chat:ip:abc", "chat:global"],
      p_windows: [60, 3600, 86400],
      p_maxes: [5, 40, 400],
    },
  }]);
});

Deno.test("checkLimits names the limit that is full, from its 1-based position", async () => {
  const { admin } = fakeAdmin({ data: [{ blocked: 2, retry_after: 1234 }] });
  assertEquals(await checkLimits(admin, limits), { scope: "ip", window: 3600, retryAfter: 1234 });
});

Deno.test("checkLimits fails closed when the limiter can't be used", async () => {
  await assertRejects(() => checkLimits(fakeAdmin({ error: { message: "function not found" } }).admin, limits));
  await assertRejects(() => checkLimits(fakeAdmin({ data: "nope" }).admin, limits));
  await assertRejects(() => checkLimits(fakeAdmin({ data: [{ blocked: 9, retry_after: 5 }] }).admin, limits));
  await assertRejects(() => checkLimits(fakeAdmin({ data: [{ blocked: 0, retry_after: 5 }] }).admin, limits));
  await assertRejects(() => checkLimits(fakeAdmin({ data: [{ blocked: 1, retry_after: null }] }).admin, limits));
});

Deno.test("envInt takes whole numbers only, so a typo can't loosen a limit", () => {
  const env = (v: string | undefined) => () => v;
  assertEquals(envInt(env("25"), "X", 7), 25);
  assertEquals(envInt(env(" 25 "), "X", 7), 25);
  assertEquals(envInt(env("0"), "X", 7), 0);
  for (const bad of [undefined, "", "abc", "-1", "2.5", "1e3", "10 requests", "1234567890"]) {
    assertEquals(envInt(env(bad), "X", 7), 7, `${bad}`);
  }
});

Deno.test("clientIp trusts only headers the client can't choose", () => {
  const h = (init: Record<string, string>) => new Headers(init);
  assertEquals(clientIp(h({ "cf-connecting-ip": "203.0.113.9", "x-real-ip": "10.0.0.1" })), "203.0.113.9");
  assertEquals(clientIp(h({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
  // x-forwarded-for starts with whatever the client sent, so it is never used.
  assertEquals(clientIp(h({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), null);
  assertEquals(clientIp(h({})), null);
  assertEquals(clientIp(h({ "cf-connecting-ip": "x".repeat(65) })), null);
});

Deno.test("hashKey is stable, short and doesn't contain the address", async () => {
  const a = await hashKey("203.0.113.9");
  assertEquals(a, await hashKey("203.0.113.9"));
  assertEquals(a === await hashKey("203.0.113.10"), false);
  assertEquals(/^[0-9a-f]{32}$/.test(a), true);
});

Deno.test("waitText rounds up to a readable time", () => {
  assertEquals(waitText(1), "1 second");
  assertEquals(waitText(0), "1 second");
  assertEquals(waitText(0.2), "1 second");
  assertEquals(waitText(45), "45 seconds");
  assertEquals(waitText(90), "2 minutes");
  assertEquals(waitText(61 * 60), "61 minutes");
  assertEquals(waitText(5 * 3600), "5 hours");
  assertEquals(waitText(86400), "24 hours");
});
