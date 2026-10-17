/** What the app calls a signed-in account: its display name, else the part of its email before `@`. */
export function displayName(user: { name: string; email: string }): string {
  return user.name.trim() || user.email.split('@')[0] || '';
}

export function firstName(user: { name: string; email: string }): string {
  return displayName(user).split(/\s+/)[0] ?? '';
}
