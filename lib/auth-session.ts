export const AUTH_STORAGE_KEY = "fixora-auth";

export type AuthSession = {
  userId: number;
  role: number;
  username: string;
  displayName: string;
};

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "role" in parsed &&
      "userId" in parsed &&
      typeof (parsed as { role: unknown }).role === "number"
    ) {
      return parsed as AuthSession;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
