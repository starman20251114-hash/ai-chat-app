"use client";

import { FormEvent, useRef, useState } from "react";
import type { ImageAttachment, MediaType } from "../src/types/chat";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: MediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type PendingImage = {
  previewUrl: string;
  attachment: ImageAttachment;
};

type Props = {
  onSend: (content: string, images: ImageAttachment[]) => void;
  disabled: boolean;
};

export default function MessageInput({ onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleChange = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = textareaRef.current?.value.trim();
    if (!content && pendingImages.length === 0) return;
    onSend(content ?? "", pendingImages.map((p) => p.attachment));
    if (textareaRef.current) {
      textareaRef.current.value = "";
      resetHeight();
    }
    setPendingImages([]);
    setImageError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImageError(null);

    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      setImageError(`画像は最大 ${MAX_IMAGES} 枚まで添付できます`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      setImageError(`画像は最大 ${MAX_IMAGES} 枚まで添付できます（${remaining} 枚のみ追加しました）`);
    }

    const newImages: PendingImage[] = [];
    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type as MediaType)) {
        setImageError("対応フォーマット: JPEG、PNG、GIF、WebP");
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`ファイルサイズは 5MB 以下にしてください（${file.name}）`);
        continue;
      }
      const data = await readFileAsBase64(file);
      newImages.push({
        previewUrl: `data:${file.type};base64,${data}`,
        attachment: { mediaType: file.type as MediaType, data },
      });
    }

    setPendingImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      {pendingImages.length > 0 && (
        <div className="mx-auto mb-2 flex w-full max-w-2xl flex-wrap gap-2 lg:max-w-3xl">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`添付画像 ${i + 1}`}
                className="h-16 w-16 rounded-lg object-cover border border-zinc-300 dark:border-zinc-600"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={`添付画像 ${i + 1} を削除`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white text-xs hover:bg-zinc-900 dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {imageError && (
        <p className="mx-auto mb-1 w-full max-w-2xl text-xs text-red-500 lg:max-w-3xl">{imageError}</p>
      )}
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl gap-2 lg:max-w-3xl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="画像を添付"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || pendingImages.length >= MAX_IMAGES}
          aria-label="画像を添付"
          title="画像を添付 (JPEG/PNG/GIF/WebP, 最大5枚, 各5MB以下)"
          className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 5.5 2-3L16 15z" clipRule="evenodd" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="メッセージを入力"
          placeholder="メッセージを入力… (Shift+Enter で改行)"
          className="max-h-40 flex-1 resize-none overflow-y-auto rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label="メッセージを送信"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:text-base"
        >
          送信
        </button>
      </form>
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
