import { CredentialsSignin } from "next-auth";

/**
 * Thrown from credentials `authorize` when Prisma/MongoDB is unreachable.
 * `code` is used by server actions to show a service message (not "wrong password").
 */
export class DatabaseUnavailableSignin extends CredentialsSignin {
  constructor() {
    super("Database unavailable");
    this.code = "ServiceUnavailable";
  }
}
