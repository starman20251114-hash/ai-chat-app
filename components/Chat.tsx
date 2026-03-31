"use client";

import { useEffect, useRef, useState } from "react";
import ChatErrorBoundary from "./ChatErrorBoundary";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import type { Message } from "../src/types/chat";

function ChatInner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content };
    const next = [...messages, userMessage];
    setMessages(next);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), ...data.message } as Message]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "エラーが発生しました。もう一度お試しください。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {messages.length > 0 && (
        <div className="flex justify-end px-4 pt-3">
          <div className="mx-auto w-full max-w-2xl lg:max-w-3xl flex justify-end">
            <button
              onClick={() => setMessages([])}
              disabled={isLoading}
              className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              会話をクリア
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-32 text-sm text-zinc-400">
              メッセージを入力して会話を始めましょう
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
          {isLoading && (
            <div className="flex justify-start px-4 pb-4">
              <div className="rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                考え中…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export default function Chat() {
  return (
    <ChatErrorBoundary>
      <ChatInner />
    </ChatErrorBoundary>
  );
}
