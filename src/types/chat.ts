export type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export type ImageAttachment = {
  mediaType: MediaType;
  data: string; // base64 encoded (without data: prefix)
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ImageAttachment[];
};
