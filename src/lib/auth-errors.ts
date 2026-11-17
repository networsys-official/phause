export function normalizeAuthErrorKey(error: string | null | undefined): string {
  const raw = error ?? "";
  const rawLower = String(raw).trim().toLowerCase();
  const normalized = rawLower.replace(/[^a-z0-9]+/g, "");

  if (!normalized) {
    return "";
  }

  const isSessionRequired = normalized === "sessionrequired" || rawLower.includes("session required");
  const isAccessDenied = normalized === "accessdenied" || rawLower.includes("access denied");
  const isCredentialFailure = [
    "invalidcredentials",
    "credentialssignin",
    "callbackrouteerrorinvalidcredentials",
    "invalidemail",
    "invalidpassword",
  ].includes(normalized) || rawLower.includes("invalid credentials") || rawLower.includes("invalid email") || rawLower.includes("invalid password") || (rawLower.includes("callbackrouteerror") && rawLower.includes("invalid credentials"));

  const isAccountLocked = normalized.includes("accountlocked") || rawLower.includes("account locked");
  const isAccountDisabled = normalized.includes("accountdisabled") || rawLower.includes("account disabled");
  const isSystemFailure = [
    "configuration",
    "adaptererror",
    "databaseerror",
  ].includes(normalized) || rawLower.includes("configuration") || rawLower.includes("adapter error") || rawLower.includes("database error");

  const resolvedKey = isSessionRequired
    ? "session_required"
    : isAccessDenied
      ? "access_denied"
      : isCredentialFailure
        ? "invalid_credentials"
        : isAccountLocked
          ? "account_locked"
          : isAccountDisabled
            ? "account_disabled"
            : isSystemFailure
              ? "service_unavailable"
              : "";

  console.log("ERROR_PIPELINE", {
    rawError: raw,
    normalizedError: normalized,
    resolvedKey,
    mappedMessage: "pending",
  });

  return resolvedKey;
}

export function mapAuthError(error: string | null | undefined): string {
  const raw = error ?? "";
  const normalized = String(raw).trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const key = normalizeAuthErrorKey(raw);
  const message = (() => {
    switch (key) {
      case "session_required":
        return "Please sign in to continue.";
      case "access_denied":
        return "Access denied. Your account does not have permission to access this resource.";
      case "invalid_credentials":
        return "Invalid email or password.\n\nPlease check your credentials and try again.";
      case "account_locked":
        return "Your account is temporarily locked.\n\nPlease try again later.";
      case "account_disabled":
        return "Your account has been disabled.\n\nPlease contact your administrator.";
      case "service_unavailable":
        return "Authentication service unavailable.\n\nPlease try again later.";
      default:
        return "";
    }
  })();

  console.log("ERROR_PIPELINE", {
    rawError: raw,
    normalizedError: normalized,
    resolvedKey: key,
    mappedMessage: message,
  });

  return message;
}
