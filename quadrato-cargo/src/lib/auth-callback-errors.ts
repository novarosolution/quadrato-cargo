/** Map Auth.js `?error=` / `?code=` from the sign-in redirect URL to user-facing copy. */
export function formatAuthCallbackError(
  error?: string | string[] | null,
): string | undefined {
  const err = Array.isArray(error) ? error[0] : error;
  if (!err) return undefined;
  switch (err) {
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "Configuration":
      return "Sign-in is temporarily unavailable. Check server configuration (AUTH_SECRET) and try again.";
    case "MissingSecret":
      return "Sign-in is not configured. Add AUTH_SECRET (or NEXTAUTH_SECRET) to .env and restart the server.";
    case "MissingCSRF":
      return "Session expired or invalid. Close this tab, open Log in again, and try once more.";
    case "AccessDenied":
      return "Access was denied. Contact support if this continues.";
    default:
      return `Sign-in failed (${err}). Please try again.`;
  }
}
