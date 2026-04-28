import { NextResponse } from "next/server";

const messages: Record<string, any[]> = {
  general: [
    { id: "msg_1", channelId: "general", sender: "system", content: "Mesh network initialized. All channels secure.", timestamp: new Date().toISOString(), encrypted: false },
  ],
  ops: [],
  intel: [],
  logistics: [],
};

const validChannels = new Set(["general", "ops", "intel", "logistics"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  if (!channel || !validChannels.has(channel)) {
    return NextResponse.json({ messages: [], timestamp: new Date().toISOString() });
  }
  return NextResponse.json({ messages: messages[channel] || [], timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, sender, content } = body;
    if (!channel || !sender || !content || !validChannels.has(channel)) {
      return NextResponse.json({ error: "Invalid channel or missing fields" }, { status: 400 });
    }
    const msg = {
      id: `msg_${Date.now()}`,
      channelId: channel,
      sender,
      content,
      timestamp: new Date().toISOString(),
      encrypted: channel !== "general",
    };
    messages.setdefault = messages.setdefault || function(key: string, val: any[]) {
      if (!messages[key]) messages[key] = val;
      return messages[key];
    };
    if (!messages[channel]) messages[channel] = [];
    messages[channel].push(msg);
    if (messages[channel].length > 500) messages[channel] = messages[channel].slice(-500);
    return NextResponse.json({ message: msg, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
