export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  return emailPattern.test(value.trim());
}
