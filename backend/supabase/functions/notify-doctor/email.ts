// The doctor's email: a fixed notice plus the link. No medical details, ever: the message itself
// stays in Supabase and is only shown by view-doctor-message to someone holding the link.

const APP_NAME = "Care companion";

// First word of the patient's display name, at most 40 characters, or null.
export function firstName(displayName: unknown): string | null {
  if (typeof displayName !== "string") return null;
  // Drop control characters and angle brackets; HTML escaping happens again below.
  // deno-lint-ignore no-control-regex
  const first = displayName.replace(/[\u0000-\u001f\u007f<>]/g, " ").trim().split(/\s+/)[0] ?? "";
  return first ? first.slice(0, 40) : null;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function messageLink(appUrl: string, token: string): string {
  // Token after "#": browsers never send the fragment to a server, so it stays out of logs.
  return `${appUrl.replace(/\/+$/, "")}/doctor-message#${token}`;
}

export function doctorEmail(name: string | null, link: string) {
  const who = name ? `Your patient ${name}` : "One of your patients";
  const subject = "A patient sent you a message";
  const text = [
    `${who} sent you a message through ${APP_NAME}.`,
    "",
    "Read it here (secure link, expires in 7 days):",
    link,
    "",
    "For privacy, the message isn't included in this email. Anyone with this link can read it, so please don't forward it.",
    "",
    "Not for emergencies: patients are told to call 911 or your clinic.",
  ].join("\n");
  const html = `<p>${escapeHtml(who)} sent you a message through ${APP_NAME}.</p>
<p><a href="${escapeHtml(link)}">Read the message</a> (secure link, expires in 7 days)</p>
<p>For privacy, the message isn't included in this email. Anyone with this link can read it, so please don't forward it.</p>
<p>Not for emergencies: patients are told to call 911 or your clinic.</p>`;
  return { subject, text, html };
}

// Errors the doctor_messages insert trigger raises, by hint → HTTP status for the UI.
export const LIMIT_STATUS: Record<string, number> = {
  guest_must_sign_up: 403,
  doctor_has_no_email: 400,
  patient_rate_limited: 429,
  recipient_rate_limited: 429,
};
