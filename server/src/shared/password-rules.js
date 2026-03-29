import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "./constants.js";

/** Same complexity rules as registration (upper, lower, digit, special). */
export const passwordComplexitySchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(72, "Password is too long.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Password must include upper, lower, number, and special character."
  );
