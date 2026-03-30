import { FormEvent, useRef } from "react";

type Props = {
  onSend: (content: string) => void;
  disabled: boolean;
};

export default function MessageInput({ onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = textareaRef.current?.value.trim();
    if (!content) return;
    onSend(content);
    if (textareaRef.current) textareaRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-2xl gap-2 lg:max-w-3xl"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力… (Shift+Enter で改行)"
          className="flex-1 resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:text-base"
        >
          送信
        </button>
      </form>
    </div>
  );
}
