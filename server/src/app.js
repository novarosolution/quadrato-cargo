import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import adminRoutes from "./routes/admin.routes.js";
import adminAuthRoutes from "./routes/admin-auth.routes.js";
import agencyRoutes from "./routes/agency.routes.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import publicRoutes from "./routes/public.routes.js";
import courierRoutes from "./routes/courier.routes.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  const allowList = new Set(env.corsOrigins);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts:
        env.nodeEnv === "production"
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false
    })
  );
  app.use(compression());
  if (env.nodeEnv === "production") {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.path === "/api/health"
      })
    );
  }
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const normalized = String(origin).replace(/\/+$/, "");
        if (allowList.has(normalized)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api", healthRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin/auth", adminAuthRoutes);
  app.use("/api/users", profileRoutes);
  app.use("/api/courier", courierRoutes);
  app.use("/api/agency", agencyRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
