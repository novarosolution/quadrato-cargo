function stripWrappingQuotes(value) {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function decodeUserInfo(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isAtlasHost(hostAndRest) {
  return /(^|@)[^/?#]*\.mongodb\.net(?=[:/?#]|$)/i.test(`@${hostAndRest}`);
}

/**
 * Atlas returns "bad auth" (code 8000) when the password contains reserved
 * characters that were not percent-encoded, or when the URI names an app
 * database and omits authSource=admin (Atlas users live in admin).
 */
export function normalizeMongoUri(raw) {
  const uri = stripWrappingQuotes(raw);
  if (!uri) return uri;

  if (/<(?:db_)?password>/i.test(uri)) {
    throw new Error(
      "MONGODB_URI still contains the Atlas <db_password> placeholder. Replace it with the database user's real password.",
    );
  }

  const schemeMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)([\s\S]+)$/i);
  if (!schemeMatch) return uri;

  const scheme = schemeMatch[1];
  const rest = schemeMatch[2];
  const at = rest.lastIndexOf("@");
  if (at <= 0) return uri;

  const userInfo = rest.slice(0, at);
  const hostAndRest = rest.slice(at + 1);
  const colon = userInfo.indexOf(":");
  if (colon <= 0) return uri;

  const username = encodeURIComponent(decodeUserInfo(userInfo.slice(0, colon)));
  const password = encodeURIComponent(decodeUserInfo(userInfo.slice(colon + 1)));
  let normalized = `${scheme}${username}:${password}@${hostAndRest}`;

  if (isAtlasHost(hostAndRest) && !/[?&]authSource=/i.test(normalized)) {
    normalized += `${normalized.includes("?") ? "&" : "?"}authSource=admin`;
  }

  return normalized;
}
