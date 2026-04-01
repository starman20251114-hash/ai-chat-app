import type { Message } from "../src/types/chat";

type Props = {
  messages: Message[];
};

export default function MessageList({ messages }: Props) {
  return (
    <div className="flex flex-col gap-4 px-4 py-6" aria-live="polite" aria-label="会話履歴">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm sm:text-base ${
              message.role === "user"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {message.images && message.images.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {message.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={`data:${img.mediaType};base64,${img.data}`}
                    alt={`添付画像 ${i + 1}`}
                    className="max-h-48 max-w-full rounded-lg object-contain"
                  />
                ))}
              </div>
            )}
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
