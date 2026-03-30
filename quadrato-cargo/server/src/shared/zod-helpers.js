import { ObjectId } from "mongodb";
import { z } from "zod";

/** Validates MongoDB ObjectId hex strings from route params. */
export const objectIdStringSchema = z
  .string()
  .trim()
  .refine((id) => ObjectId.isValid(id), { message: "Invalid booking id." });
