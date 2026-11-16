import { NextResponse } from "next/server";

const PLANS_API_URL =
    "https://phishingsimulation.webandappdevelopmenttech.com/api/plans";

export async function GET() {
    let response: Response;

    try {
        response = await fetch(PLANS_API_URL, { cache: "no-store" });
    } catch (error) {
        console.error("Failed to connect to the subscription plans API:", error);
        return NextResponse.json(
            { message: "The subscription plans service is unavailable." },
            { status: 502 },
        );
    }

    let result: unknown;

    try {
        result = await response.json();
    } catch (error) {
        console.error("The subscription plans API returned invalid JSON:", error);
        return NextResponse.json(
            { message: "The subscription plans service returned an invalid response." },
            { status: 502 },
        );
    }

    if (!response.ok) {
        const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
                ? result.message
                : "The subscription plans service rejected the request.";

        return NextResponse.json({ message }, { status: response.status });
    }

    return NextResponse.json(result);
}
