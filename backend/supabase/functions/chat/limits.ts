// How often `chat` may be called. Every message can cost a Claude call, and the people who may use
// it are not known in advance (judges), so the limits are tight and there are three layers:
//   user    one account            – stops one person (or one script) from using the budget
//   ip      one network address    – stops someone making many accounts from one place
//   global  everybody together     – the spending cap: the most Claude calls per window, whoever asks
// Only accepted messages count (see migration 20261017200000), so the global numbers are Claude calls.
//
// Change a number without a redeploy: `supabase secrets set CHAT_LIMIT_GLOBAL_DAY=100 --project-ref ...`
// (names below). 0 blocks that limit completely, so CHAT_LIMIT_GLOBAL_DAY=0 pauses the chat for everyone.
import { envInt, type Limit } from "../_shared/ratelimit.ts";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// [env var, window in seconds, default max]
export const USER_LIMITS: [string, number, number][] = [
  ["CHAT_LIMIT_USER_MIN", MINUTE, 5],
  ["CHAT_LIMIT_USER_HOUR", HOUR, 20],
  ["CHAT_LIMIT_USER_DAY", DAY, 60],
];
export const IP_LIMITS: [string, number, number][] = [
  ["CHAT_LIMIT_IP_MIN", MINUTE, 8],
  ["CHAT_LIMIT_IP_HOUR", HOUR, 40],
  ["CHAT_LIMIT_IP_DAY", DAY, 150],
];
export const GLOBAL_LIMITS: [string, number, number][] = [
  ["CHAT_LIMIT_GLOBAL_MIN", MINUTE, 15],
  ["CHAT_LIMIT_GLOBAL_HOUR", HOUR, 100],
  ["CHAT_LIMIT_GLOBAL_DAY", DAY, 400],
];

// In the order they are checked. A message that is turned away by one is not counted by any, so the
// order only decides which reason the patient hears when several are full.
export function chatLimits(
  userId: string,
  ipHash: string | null,
  getEnv: (name: string) => string | undefined,
): Limit[] {
  const build = (scope: string, key: string, rows: [string, number, number][]): Limit[] =>
    rows.map(([name, window, max]) => ({ scope, key, window, max: envInt(getEnv, name, max) }));
  return [
    ...build("user", `chat:user:${userId}`, USER_LIMITS),
    ...(ipHash ? build("ip", `chat:ip:${ipHash}`, IP_LIMITS) : []),
    ...build("global", "chat:global", GLOBAL_LIMITS),
  ];
}

const EMERGENCY = " If this is an emergency, call 911.";

export function limitMessage(scope: string, wait: string): string {
  switch (scope) {
    case "user":
      return `You've reached the message limit for your account. Please try again in ${wait}.${EMERGENCY}`;
    case "ip":
      return `There have been too many messages from your network. Please try again in ${wait}.${EMERGENCY}`;
    default:
      return `The assistant is at capacity right now. Please try again in ${wait}.${EMERGENCY}`;
  }
}
