import { isValidEmail } from "@/lib/auth-validation";

export type ContactRow = {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
};

export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "message" | "service", string>
>;

export function validateContact(row: ContactRow): {
  ok: true;
} | {
  ok: false;
  fieldErrors: ContactFieldErrors;
} {
  const fieldErrors: ContactFieldErrors = {};

  if (!row.name) fieldErrors.name = "Please enter your name.";
  if (!row.email) fieldErrors.email = "Please enter your email.";
  else if (!isValidEmail(row.email))
    fieldErrors.email = "Enter a valid email address.";
  if (!row.message) fieldErrors.message = "Please enter a message.";
  if (!row.service) fieldErrors.service = "Select a service interest.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true };
}
