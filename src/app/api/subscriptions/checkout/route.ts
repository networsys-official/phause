import { NextResponse } from "next/server";

const ALLOWED_PROVIDERS = ["stripe", "razorpay", "paypal"] as const;
type PaymentProvider = (typeof ALLOWED_PROVIDERS)[number];

interface CheckoutRequest {
    planId?: string;
    provider?: PaymentProvider;
}

export async function POST(request: Request) {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return NextResponse.json(
            { message: "Authentication required. Please sign in again." },
            { status: 401 },
        );
    }

    const payload = (await request.json().catch(() => null)) as CheckoutRequest | null;

    if (!payload || typeof payload.planId !== "string" || !payload.planId.trim()) {
        return NextResponse.json(
            { message: "A valid planId is required." },
            { status: 400 },
        );
    }

    if (!payload.provider || !ALLOWED_PROVIDERS.includes(payload.provider)) {
        return NextResponse.json(
            { message: "Please select a valid payment provider." },
            { status: 400 },
        );
    }

    const baseUrl = process.env.ADMIN_PLANS_API_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
        return NextResponse.json(
            { message: "The payment service is not configured. Please try again later." },
            { status: 503 },
        );
    }

    try {
        const backendResponse = await fetch(`${baseUrl}/api/subscriptions/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authorization,
            },
            body: JSON.stringify({ planId: payload.planId, provider: payload.provider }),
            cache: "no-store",
        });

        const result: unknown = await backendResponse.json().catch(() => null);

        if (!backendResponse.ok) {
            const message =
                typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
                    ? result.message
                    : "Unable to create the checkout session.";

            return NextResponse.json({ message }, { status: backendResponse.status });
        }

        return NextResponse.json(result, { status: backendResponse.status });
    } catch {
        return NextResponse.json(
            { message: "The payment service is temporarily unavailable. Please try again." },
            { status: 502 },
        );
    }
}