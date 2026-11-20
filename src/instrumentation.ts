export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const baseUrl = process.env.ADMIN_PLANS_API_URL?.trim();
  if (!baseUrl) {
    const message = "STARTUP CONFIG ERROR: ADMIN_PLANS_API_URL is required for the subscription plans API.";
    console.error(message);
    if (process.env.NODE_ENV === "production") throw new Error(message);
  }
}
