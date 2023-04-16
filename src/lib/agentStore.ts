import type { BskyAgent } from "@atproto/api";
import { writable } from "svelte/store";

export const agent = writable<BskyAgent | null>(null);
