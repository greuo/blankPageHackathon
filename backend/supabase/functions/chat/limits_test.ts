// deno test --config backend/supabase/functions/chat/deno.json backend/supabase/functions/chat/
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { chatLimits, limitMessage } from "./limits.ts";

const none = () => undefined;
const summary = (l: ReturnType<typeof chatLimits>) => l.map((x) => `${x.scope}/${x.window}/${x.max}`);

Deno.test("defaults: three windows each for the account, the address and everybody", () => {
  assertEquals(summary(chatLimits("u1", "ip1", none)), [
    "user/60/5", "user/3600/20", "user/86400/60",
    "ip/60/8", "ip/3600/40", "ip/86400/150",
    "global/60/15", "global/3600/100", "global/86400/400",
  ]);
});

Deno.test("counters are keyed per account, per address and one shared global", () => {
  const keys = new Set(chatLimits("u1", "ip1", none).map((l) => l.key));
  assertEquals([...keys].sort(), ["chat:global", "chat:ip:ip1", "chat:user:u1"]);
  // Two different accounts never share a counter, but they share the global one.
  const other = new Set(chatLimits("u2", "ip1", none).map((l) => l.key));
  assertEquals(other.has("chat:user:u1"), false);
  assertEquals(other.has("chat:global"), true);
});

Deno.test("the account is checked first, so its own limit is what a heavy user hears about", () => {
  assertEquals(chatLimits("u1", "ip1", none).map((l) => l.scope), [
    "user", "user", "user", "ip", "ip", "ip", "global", "global", "global",
  ]);
});

Deno.test("no address: the per-address limit is skipped, the others stay", () => {
  const scopes = new Set(chatLimits("u1", null, none).map((l) => l.scope));
  assertEquals([...scopes], ["user", "global"]);
});

Deno.test("limits can be changed with secrets; a bad value keeps the default; 0 blocks everything", () => {
  const env = (name: string) => ({ CHAT_LIMIT_GLOBAL_DAY: "0", CHAT_LIMIT_USER_MIN: "2", CHAT_LIMIT_IP_DAY: "lots" })[name];
  const got = Object.fromEntries(chatLimits("u1", "ip1", env).map((l) => [`${l.scope}/${l.window}`, l.max]));
  assertEquals(got["global/86400"], 0);
  assertEquals(got["user/60"], 2);
  assertEquals(got["ip/86400"], 150);
  assertEquals(got["user/3600"], 20);
});

Deno.test("the answer names the reason and always keeps the 911 line", () => {
  for (const scope of ["user", "ip", "global"]) {
    const text = limitMessage(scope, "5 minutes");
    assertStringIncludes(text, "5 minutes");
    assertStringIncludes(text, "911");
  }
  assertStringIncludes(limitMessage("user", "1 second"), "account");
  assertStringIncludes(limitMessage("ip", "1 second"), "network");
  assertStringIncludes(limitMessage("global", "1 second"), "capacity");
});
