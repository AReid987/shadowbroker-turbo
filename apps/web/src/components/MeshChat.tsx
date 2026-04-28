"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Users, Send, Shield } from "lucide-react";
import { Panel, Input } from "@/components/ui";
import { useDashboardStore } from "@/lib/store";

export function MeshChat() {
  const { meshChannels, meshMessages, activeChannel, setActiveChannel, sendMessage } = useDashboardStore();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelMessages = meshMessages.filter((m) => m.channelId === activeChannel);
  const activeChannelData = meshChannels.find((c) => c.id === activeChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setDraft("");
    await sendMessage(text);
    setIsSending(false);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Channel list */}
      <Panel className="w-64 flex-shrink-0 flex flex-col">
        <div className="p-3 border-b border-sb-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-sb-muted">Channels</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {meshChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                activeChannel === channel.id
                  ? "bg-sb-accent/10 text-sb-accent"
                  : "text-sb-muted hover:bg-white/5 hover:text-sb-text"
              }`}
            >
              {channel.type === "encrypted" ? (
                <Lock className="h-3.5 w-3.5" />
              ) : channel.type === "direct" ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              <span className="flex-1 truncate">{channel.name}</span>
              {channel.unread > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-sb-accent text-black text-[10px] font-bold flex items-center justify-center">
                  {channel.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </Panel>

      {/* Messages */}
      <Panel className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-sb-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-sb-text">{activeChannelData?.name}</span>
            {activeChannelData?.type === "encrypted" && (
              <Lock className="h-3 w-3 text-sb-accent" />
            )}
          </div>
          <span className="text-xs text-sb-muted">{activeChannelData?.participants} participants</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {channelMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-sb-accent">{msg.sender}</span>
                <span className="text-[10px] text-sb-muted">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.encrypted && <Lock className="h-3 w-3 text-sb-muted" />}
              </div>
              <p className="text-sm text-sb-text leading-relaxed">{msg.content}</p>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-sb-border">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 bg-black/30 border-sb-border text-sb-text placeholder:text-sb-muted"
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim() && !isSending) {
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !draft.trim()}
              className="h-10 w-10 rounded-lg bg-sb-accent text-black flex items-center justify-center hover:bg-sb-accentDim transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
