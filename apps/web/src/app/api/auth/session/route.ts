import { NextRequest, NextResponse } from "next/server";
import { isSessionValid } from "@shadowbroker/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("shadow_session")?.value;
  if (!token || !isSessionValid(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
