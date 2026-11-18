const TOKEN_KEY = "phauseAuthToken";

export const AUTH_CHANGE_EVENT = "phause-auth-change";

/**
 * Store authentication token persistently.
 */
export function storeToken(token: string): void {
    if (typeof window === "undefined" || !token) return;

    try {
        localStorage.setItem(TOKEN_KEY, token);

        // Keep compatibility with any existing code using sessionStorage.
        sessionStorage.setItem(TOKEN_KEY, token);

        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    } catch (error) {
        console.error("Failed to store authentication token:", error);
    }
}

/**
 * Retrieve authentication token.
 */
export function getToken(): string | null {
    if (typeof window === "undefined") return null;

    try {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY)
        );
    } catch {
        return null;
    }
}

/**
 * Remove authentication token.
 */
export function clearToken(): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);

        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    } catch (error) {
        console.error("Failed to clear authentication token:", error);
    }
}

/**
 * Check whether the website has an authenticated session.
 */
export function isAuthenticated(): boolean {
    return Boolean(getToken());
}