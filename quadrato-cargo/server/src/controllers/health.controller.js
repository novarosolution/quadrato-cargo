import { sendOk } from "../components/api-response.js";

export function getHealth(_req, res) {
  return sendOk(res, {
    service: "quadrato-cargo-server",
    time: new Date().toISOString()
  });
}
