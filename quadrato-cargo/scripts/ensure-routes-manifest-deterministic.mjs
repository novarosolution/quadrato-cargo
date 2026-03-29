/**
 * Vercel's Next.js builder may lstat `.next/routes-manifest-deterministic.json`
 * (Next 16.2.x + Turbopack) even when only `routes-manifest.json` is written.
 * Mirror the standard manifest so deploy can proceed. Safe no-op if dest exists.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");
const src = path.join(nextDir, "routes-manifest.json");
const dest = path.join(nextDir, "routes-manifest-deterministic.json");

if (!fs.existsSync(src)) {
  console.warn(
    "[ensure-routes-manifest-deterministic] skip: .next/routes-manifest.json not found",
  );
  process.exit(0);
}

fs.copyFileSync(src, dest);
console.log("[ensure-routes-manifest-deterministic] wrote", path.relative(root, dest));
