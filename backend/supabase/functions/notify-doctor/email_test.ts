// deno test backend/supabase/functions/notify-doctor/
import { assertEquals, assertMatch, assertNotEquals } from "jsr:@std/assert@1";
import { doctorEmail, escapeHtml, firstName, LIMIT_STATUS, messageLink } from "./email.ts";
import { isToken, newToken, sha256Hex } from "./token.ts";

Deno.test("tokens: 43 url-safe characters, never repeat, validated strictly", () => {
  const a = newToken();
  const b = newToken();
  assertMatch(a, /^[A-Za-z0-9_-]{43}$/);
  assertNotEquals(a, b);
  assertEquals(isToken(a), true);
  assertEquals(isToken(a + "x"), false);
  assertEquals(isToken("short"), false);
  assertEquals(isToken(a.slice(0, 42) + "/"), false);
  assertEquals(isToken(null), false);
});

Deno.test("sha256Hex matches the known digest", async () => {
  assertEquals(await sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

Deno.test("firstName: first word, max 40 chars, no markup", () => {
  assertEquals(firstName("Alex Rivera"), "Alex");
  assertEquals(firstName("  sam  "), "sam");
  assertEquals(firstName("<script>alert(1)</script> Bob"), "script");
  assertEquals(firstName("x".repeat(60))?.length, 40);
  assertEquals(firstName(""), null);
  assertEquals(firstName(null), null);
});

Deno.test("link keeps the token in the fragment", () => {
  assertEquals(messageLink("https://app.example.com/", "TOKEN"), "https://app.example.com/doctor-message#TOKEN");
});

Deno.test("email carries no message content, only the notice and link", () => {
  const link = "https://app.example.com/doctor-message#TOKEN";
  const email = doctorEmail("Alex", link);
  assertEquals(email.text.includes("Your patient Alex sent you a message"), true);
  assertEquals(email.text.includes(link), true);
  assertEquals(email.text.includes("911"), true);
  assertEquals(email.subject.includes("Alex"), false);
  assertEquals(doctorEmail(null, link).text.startsWith("One of your patients"), true);
});

Deno.test("html is escaped", () => {
  assertEquals(escapeHtml(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  assertEquals(doctorEmail("A&B", "https://x/doctor-message#T").html.includes("A&amp;B"), true);
});

Deno.test("every trigger hint maps to a 4xx", () => {
  for (const hint of ["guest_must_sign_up", "doctor_has_no_email", "patient_rate_limited", "recipient_rate_limited"]) {
    assertEquals(LIMIT_STATUS[hint] >= 400 && LIMIT_STATUS[hint] < 500, true);
  }
});
