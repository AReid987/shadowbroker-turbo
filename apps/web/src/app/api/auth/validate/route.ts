import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientId(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") || "unknown";
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attempts.get(clientId);
  if (!record || now > record.resetAt) {
    attempts.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const clientId = getClientId(req);
    const rateLimit = checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    // Proxy to backend invite-code validator
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://shadowbroker-api.onrender.com";
    const backendRes = await fetch(`${API_URL}/api/auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
      next: { revalidate: 0 },
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Validation failed", remainingAttempts: rateLimit.remaining },
        { status: 401 }
      );
    }

    const data = await backendRes.json();
    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Invalid code", remainingAttempts: rateLimit.remaining },
        { status: 401 }
      );
    }

    // Create local session on success
    const session = await createSession(key);
    if (!session.success) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("blacktivism_session", session.token || "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
