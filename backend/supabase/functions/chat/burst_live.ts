// Live check of the chat rate limits against a deployed function: signs in as a real account, fires a
// burst, and checks that exactly the per-minute allowance gets through. Run it yourself (it needs a login):
//
//   cd backend && set -a && source .env.local && set +a
//   EMAIL="$ADMIN_EMAIL" PASSWORD="$ADMIN_PASSWORD" \
//     deno run --allow-env --allow-net supabase/functions/chat/burst_live.ts [function-name]
//
// Only sends red-flag text ("I have chest pain"), which the function answers in code without a Claude
// call, so it costs nothing. It does leave about 10 rows (messages + bot replies) in that account's chat.
// Uses up that account's per-minute allowance and 5 of its 20 per hour, so don't repeat it more than a few
// times an hour. Expected numbers are the defaults in limits.ts; EXPECT_USER_MIN overrides the 5.
const BASE = Deno.env.get("SUPABASE_URL") ?? "https://repvtuxyszlqdjzciojx.supabase.co";
const KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "sb_publishable_igEs9JeKLT-n8_SAYRjkwg_wAMphe15";
const email = Deno.env.get("EMAIL");
const password = Deno.env.get("PASSWORD");
const fn = Deno.args[0] ?? "chat";
const allowed = Number(Deno.env.get("EXPECT_USER_MIN") ?? "5");
const BURST = allowed + 5;

if (!email || !password) {
  console.error("Set EMAIL and PASSWORD (a real account on the project).");
  Deno.exit(2);
}

const login = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.error(`Sign-in failed (${login.status}).`);
  Deno.exit(2);
}
const { access_token } = await login.json();
console.log(`Signed in as ${email}; testing function "${fn}".`);

const send = async (text: string) => {
  const res = await fetch(`${BASE}/functions/v1/${fn}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, retryHeader: res.headers.get("retry-after"), body };
};

// The limits are fixed one-minute windows, so start early in a minute to keep the whole burst inside one.
const second = new Date().getSeconds();
if (second > 35) {
  const wait = 62 - second;
  console.log(`Waiting ${wait}s for the next minute window...`);
  await new Promise((r) => setTimeout(r, wait * 1000));
}

const results = await Promise.all(
  Array.from({ length: BURST }, (_, i) => send(`RATELIMIT TEST ${i + 1}: I have chest pain`)),
);
const ok = results.filter((r) => r.status === 201);
const limited = results.filter((r) => r.status === 429);
const other = results.filter((r) => r.status !== 201 && r.status !== 429);
const after = await send("RATELIMIT TEST after the burst: I have chest pain");

const checks: [string, boolean][] = [
  [`${BURST} messages at once: exactly ${allowed} accepted (got ${ok.length})`, ok.length === allowed],
  [`the other ${BURST - allowed} are 429 (got ${limited.length}; other statuses: ${other.map((r) => r.status).join(",") || "none"})`,
    limited.length === BURST - allowed && other.length === 0],
  ["429s say rate_limited_user", limited.every((r) => r.body.code === "rate_limited_user")],
  ["429s carry a wait of 1-60 s in the body and in Retry-After",
    limited.every((r) => r.body.retry_after_seconds >= 1 && r.body.retry_after_seconds <= 60 &&
      r.retryHeader === String(r.body.retry_after_seconds))],
  ["429 text mentions how long to wait and 911", limited.every((r) => /try again in \d+ (second|minute|hour)/.test(r.body.error ?? "") && /911/.test(r.body.error ?? ""))],
  ["accepted messages got the emergency reply", ok.every((r) => r.body.action === "emergency")],
  ["a later message in the same minute is still refused", after.status === 429],
];
for (const [name, pass] of checks) console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
if (limited[0]) console.log("Example 429:", JSON.stringify(limited[0].body));
if (checks.some(([, pass]) => !pass)) Deno.exit(1);
console.log("All checks passed.");
