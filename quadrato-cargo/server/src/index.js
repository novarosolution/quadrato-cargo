import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { getDb } from "./db/mongo.js";
import { backfillPublicBarcodeCodes } from "./modules/bookings/booking-repo.js";

function listenOnPort(app, port) {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => resolve({ server, port }))
      .on("error", (error) => reject(error));
  });
}

async function start() {
  await getDb();
  await backfillPublicBarcodeCodes().catch((err) => {
    console.warn("[bookings] publicBarcodeCode backfill skipped or failed:", err?.message || err);
  });
  const app = createApp();
  const basePort = Number.isInteger(env.port) ? env.port : 4000;
  const tryPorts = [basePort, basePort + 1, basePort + 2];

  for (const port of tryPorts) {
    try {
      await listenOnPort(app, port);
      if (port !== basePort) {
        console.warn(
          `Port ${basePort} is busy. Server started on http://localhost:${port}`,
        );
      } else {
        console.log(`Server listening on http://localhost:${port}`);
      }
      return;
    } catch (error) {
      if (error?.code !== "EADDRINUSE") {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to start server: ports ${tryPorts.join(", ")} are all in use.`,
  );
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
