import { NextResponse } from "next/server";

const channels = [
  { id: "general", name: "General", type: "public", participants: 1, unread: 0 },
  { id: "ops", name: "Operations", type: "encrypted", participants: 0, unread: 0 },
  { id: "intel", name: "Intelligence", type: "encrypted", participants: 0, unread: 0 },
  { id: "logistics", name: "Logistics", type: "direct", participants: 0, unread: 0 },
];

export async function GET() {
  return NextResponse.json({ channels, timestamp: new Date().toISOString() });
}
