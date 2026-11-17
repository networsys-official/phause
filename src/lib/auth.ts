// Authentication token utilities
// Store, retrieve, and clear the auth token in sessionStorage.

const TOKEN_KEY = "phauseAuthToken";

/** Store the token for the current session */
export function storeToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    // ignore storage errors in non-browser environments
    console.error("Failed to store auth token", e);
  }
}

/** Retrieve the stored token, or null if not present */
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored auth token */
export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error("Failed to clear auth token", e);
  }
}
