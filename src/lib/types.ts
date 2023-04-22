import type { RichText } from "@atproto/api";

export type Post = {
  text: "";
  posting?: boolean;
  posted?: boolean;
};

export type PostRef = {
  uri: string;
  cid: string;
};
