import { hash } from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}
