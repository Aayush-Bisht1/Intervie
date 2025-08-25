import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
];

const DEFAULT_ALLOWED_METHODS = ["GET", "POST", "OPTIONS"];

function getAllowedOrigin(request: NextRequest): string {
    const origin = request.headers.get("origin") || "";
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL || "";

    // Allow exact frontend origin; in dev also allow localhost:3000 if set
    const devFallback = "http://localhost:3000";

    if (envOrigin && origin === envOrigin) return envOrigin;
    if (origin === devFallback) return devFallback;

    // Fallback to env origin if present, otherwise echo origin (use with caution)
    return envOrigin || origin;
}

export function buildCorsHeaders(request: NextRequest): HeadersInit {
    const allowedOrigin = getAllowedOrigin(request);

    return {
        "Access-Control-Allow-Origin": allowedOrigin || "*",
        "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS.join(", "),
        "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS.join(", "),
        "Access-Control-Max-Age": "86400",
    };
}

export function withCorsJson<T>(request: NextRequest, body: T, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    const cors = buildCorsHeaders(request);
    Object.entries(cors).forEach(([k, v]) => headers.set(k, v as string));
    return NextResponse.json(body, { ...init, headers });
}

export function handleCorsOptions(request: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: buildCorsHeaders(request),
    });
}

