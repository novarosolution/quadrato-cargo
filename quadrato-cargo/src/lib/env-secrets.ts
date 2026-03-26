/**
 * Trimmed secrets from `.env` (avoids invisible trailing newlines breaking auth).
 */

export function getAuthSecret(): string | undefined {
  const s =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return s && s.length > 0 ? s : undefined;
}

/** Raw trimmed ADMIN_SECRET (may be short — callers validate length). */
export function getAdminSecretRaw(): string | undefined {
  const s = process.env.ADMIN_SECRET?.trim();
  return s && s.length > 0 ? s : undefined;
}

export function isAdminSecretConfigured(): boolean {
  const s = getAdminSecretRaw();
  return Boolean(s && s.length >= 16);
}
