export type PaymentProvider = "stripe" | "razorpay" | "paypal";

export interface CreateCheckoutRequest {
    planId: string;
    provider: PaymentProvider;
}

export interface CreateCheckoutResponse {
    checkoutUrl: string;
}

async function post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
    });

    let result: unknown;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            `Checkout returned an invalid response (HTTP ${response.status}).`
        );
    }

    if (!response.ok) {
        const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
                ? result.message
                : `Checkout failed with status ${response.status}.`;

        throw new Error(message);
    }

    return result as T;
}

/**
 * Extract the hosted checkout URL from the API response.
 *
 * The exact success-response structure was not included
 * in the API details shared so far, so this supports
 * several common response property names.
 */
function extractCheckoutUrl(result: unknown): string {
    if (typeof result !== "object" || result === null) {
        throw new Error("Invalid checkout response from server.");
    }

    const response = result as Record<string, unknown>;

    const data =
        typeof response.data === "object" && response.data !== null
            ? (response.data as Record<string, unknown>)
            : response;

    const possibleUrls = [
        data.checkoutUrl,
        data.checkout_url,
        data.paymentUrl,
        data.payment_url,
        data.url,
    ];

    const checkoutUrl = possibleUrls.find(
        (value): value is string =>
            typeof value === "string" && value.length > 0
    );

    if (!checkoutUrl) {
        throw new Error(
            "The checkout API did not return a recognized payment URL. Please verify its response format."
        );
    }

    return checkoutUrl;
}

export const subscriptionService = {
    createCheckout: async (
        payload: CreateCheckoutRequest
    ): Promise<CreateCheckoutResponse> => {
        const result = await post<unknown>(
            "/api/subscriptions/checkout",
            payload
        );

        return {
            checkoutUrl: extractCheckoutUrl(result),
        };
    },
};