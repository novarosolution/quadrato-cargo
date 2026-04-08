/**
 * Removes `.next` with retries — avoids ENOTEMPTY / EBUSY when dev server or OS holds files briefly.
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("..", import.meta.url));
const nextDir = join(root, ".next");

async function main() {
  if (!existsSync(nextDir)) {
    console.log("[clean-next] no .next folder");
    return;
  }
  const opts = { recursive: true, force: true, maxRetries: 12, retryDelay: 150 };
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      rmSync(nextDir, opts);
      console.log("[clean-next] removed .next");
      return;
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      if (attempt < 5 && (code === "ENOTEMPTY" || code === "EBUSY" || code === "EPERM")) {
        await delay(250 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

await main();
