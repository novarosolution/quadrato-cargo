/**
 * Predev hygiene for Next.js 16 + webpack.
 *
 * Do NOT copy production `.next` manifests into `.next/dev` — that leaves a hybrid tree
 * (routes-manifest present but `server/app/.../page.js` missing) → Internal Server Error / ENOENT.
 *
 * A **corrupt** `.next/dev` (e.g. missing or empty `routes-manifest.json` after a crash or cache
 * rename error) surfaces as `Internal Server Error` / ENOENT on `routes-manifest.json`. This script
 * wipes `.next/dev` so the next `next dev` boot does a clean compile.
 *
 * - Removes `.next/dev/lock`
 * - `--repair`: deletes entire `.next/dev`
 * - Otherwise: if `.next/dev` exists but output is incomplete or manifests are invalid, delete it
 * - Does **not** delete `.next/dev/cache` when the rest of `.next/dev` is kept — wiping only cache
 *   while `server/` still references old webpack packs causes ENOENT on `*.pack.gz`, unhandledRejection,
 *   and Internal Server Error. Use `npm run dev:repair` to remove all of `.next/dev` if cache acts up.
 * - Drops stray `.next/types/*.ts` files with spaces
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repair = process.argv.includes("--repair");
const root = fileURLToPath(new URL("..", import.meta.url));
const nextDir = join(root, ".next");
const devDir = join(nextDir, "dev");
const lock = join(devDir, "lock");

try {
  unlinkSync(lock);
} catch {
  /* no lock — ok */
}

function routesManifestLooksValid(filePath) {
  if (!existsSync(filePath)) return false;
  try {
    const st = statSync(filePath);
    if (!st.isFile() || st.size < 8) return false;
    const raw = readFileSync(filePath, "utf8").trim();
    if (!raw.startsWith("{")) return false;
    const j = JSON.parse(raw);
    return (
      j &&
      typeof j === "object" &&
      (("version" in j && j.version != null) || ("appType" in j && j.appType != null))
    );
  } catch {
    return false;
  }
}

function fileNonEmpty(filePath) {
  try {
    if (!existsSync(filePath)) return false;
    const st = statSync(filePath);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

function devBuildIncomplete() {
  if (!existsSync(devDir)) return false;
  const routes = join(devDir, "routes-manifest.json");
  const fallback = join(devDir, "fallback-build-manifest.json");
  const serverDir = join(devDir, "server");
  /** Sanity check: main public marketing route from this app */
  const publicPage = join(devDir, "server", "app", "public", "page.js");
  /** Webpack dev expects this; missing → ENOENT / Internal Server Error mid-session */
  const vendorNext = join(devDir, "server", "vendor-chunks", "next.js");

  const baseIncomplete =
    !routesManifestLooksValid(routes) ||
    !fileNonEmpty(fallback) ||
    !existsSync(serverDir) ||
    !existsSync(publicPage);

  if (baseIncomplete) return true;

  if (existsSync(serverDir) && !existsSync(vendorNext)) {
    return true;
  }

  return false;
}

if (repair && existsSync(devDir)) {
  try {
    rmSync(devDir, { recursive: true, force: true });
    console.log("[clear-next-dev-lock] repair: removed .next/dev");
  } catch {
    /* ignore */
  }
} else if (existsSync(devDir) && devBuildIncomplete()) {
  try {
    rmSync(devDir, { recursive: true, force: true });
    console.log(
      "[clear-next-dev-lock] removed incomplete .next/dev (will recompile on dev start)",
    );
  } catch {
    /* ignore */
  }
}

const typesDir = join(root, ".next", "types");
try {
  for (const name of readdirSync(typesDir)) {
    if (name.endsWith(".ts") && /\s/.test(name)) {
      unlinkSync(join(typesDir, name));
    }
  }
} catch {
  /* no .next/types yet — ok */
}
