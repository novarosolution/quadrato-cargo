import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendError, sendOk, sendValidationError } from "../components/api-response.js";
import { toPublicUser } from "../models/user.model.js";
import { env } from "../config/env.js";
import {
  clearAuthCookie,
  setAuthCookie,
  signAuthToken,
  verifyAuthToken
} from "../modules/auth/token.js";
import {
  createUser,
  findUserByEmail,
  findUserById
} from "../modules/users/user-repo.js";
import { MIN_PASSWORD_LENGTH } from "../shared/constants.js";

const registerSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  confirmPassword: z.string().min(MIN_PASSWORD_LENGTH)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      return sendValidationError(res, {
        name: f.name?.[0],
        email: f.email?.[0],
        password: f.password?.[0],
        confirmPassword: f.confirmPassword?.[0]
      });
    }

    const { name, email, password, confirmPassword } = parsed.data;
    if (password !== confirmPassword) {
      return sendValidationError(res, { confirmPassword: "Passwords do not match." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendError(
        res,
        "Please fix the highlighted fields.",
        409,
        { fieldErrors: { email: "An account with this email already exists." } }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userDoc = await createUser({ email, name, passwordHash, role: "customer" });
    const user = toPublicUser(userDoc);

    setAuthCookie(res, signAuthToken(user));
    return sendOk(res, { message: "Account created successfully.", user }, 201);
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(
        res,
        "Please fix the highlighted fields.",
        409,
        { fieldErrors: { email: "An account with this email already exists." } }
      );
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      return sendValidationError(res, {
        email: f.email?.[0],
        password: f.password?.[0]
      });
    }

    const { email, password } = parsed.data;
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return sendError(res, "Invalid email or password.", 401, { fieldErrors: {} });
    }

    const isMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!isMatch) {
      return sendError(res, "Invalid email or password.", 401, { fieldErrors: {} });
    }

    const user = toPublicUser(userDoc);
    setAuthCookie(res, signAuthToken(user));
    return sendOk(res, { message: "Logged in successfully.", user });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  clearAuthCookie(res);
  return sendOk(res, { message: "Logged out." });
}

export async function me(req, res, next) {
  try {
    const token = req.cookies?.[env.authCookieName];
    if (!token) return sendOk(res, { user: null });

    let payload = null;
    try {
      payload = verifyAuthToken(token);
    } catch {
      return sendOk(res, { user: null });
    }

    const userId = String(payload?.sub || "");
    if (!userId) return sendOk(res, { user: null });

    const userDoc = await findUserById(userId);
    return sendOk(res, { user: toPublicUser(userDoc) });
  } catch (error) {
    return next(error);
  }
}
