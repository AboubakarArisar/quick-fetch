import { NextRequest } from "next/server";

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOW_ORIGINS?.trim();
  if (!raw) return ["*"];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveAllowedOrigin(request: NextRequest): string {
  const requestOrigin = request.headers.get("origin") ?? "";
  const allowedOrigins = parseAllowedOrigins();

  if (allowedOrigins.includes("*")) return "*";
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;

  return allowedOrigins[0] ?? "*";
}

export function applyCorsHeaders(request: NextRequest, headers: Headers): Headers {
  const allowedOrigin = resolveAllowedOrigin(request);
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");
  return headers;
}

export function corsPreflightResponse(request: NextRequest): Response {
  const headers = applyCorsHeaders(request, new Headers());
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}
