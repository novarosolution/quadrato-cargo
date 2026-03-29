import { isValidEmail } from "@/lib/auth-validation";

export type ContactRow = {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
};

export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "phone" | "message" | "service", string>
>;

function phoneDigits(value: string) {
  return String(value || "").trim();
}

export function validateContact(row: ContactRow): {
  ok: true;
} | {
  ok: false;
  fieldErrors: ContactFieldErrors;
} {
  const fieldErrors: ContactFieldErrors = {};

  if (!row.name) fieldErrors.name = "Please enter your name.";
  else if (row.name.length < 2) fieldErrors.name = "Name is too short.";
  if (!row.email) fieldErrors.email = "Please enter your email.";
  else if (!isValidEmail(row.email))
    fieldErrors.email = "Enter a valid email address.";
  if (row.phone) {
    const digits = phoneDigits(row.phone);
    if (!/^\d{7,15}$/.test(digits)) {
      fieldErrors.phone = "Phone must contain only numbers (7 to 15 digits).";
    }
  }
  if (!row.message) fieldErrors.message = "Please enter a message.";
  else if (row.message.length < 10)
    fieldErrors.message = "Message is too short.";
  if (!row.service) fieldErrors.service = "Select a service interest.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true };
}
