export function sendOk(res, payload = {}, status = 200) {
  return res.status(status).json({ ok: true, ...payload });
}

export function sendError(res, message, status = 400, extras = {}) {
  return res.status(status).json({ ok: false, message, ...extras });
}

export function sendValidationError(res, fieldErrors = {}, message = "Please fix the highlighted fields.") {
  return sendError(res, message, 400, { fieldErrors });
}

export function sendNotFound(res, message = "Resource not found.") {
  return sendError(res, message, 404);
}
