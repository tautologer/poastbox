import type { BskyAgent } from "@atproto/api";
import { writable } from "svelte/store";
import { ls } from "./localStorage";

// agent
export const agent = writable<BskyAgent | null>(null);

// settings
export type Settings = {
  service: string;
  handle: string;
  rememberMe: boolean;
  showThreadButtons: boolean;
};
const DEFAULT_SETTINGS: Settings = {
  service: "https://bsky.social",
  handle: "",
  rememberMe: false,
  showThreadButtons: true,
};
const initialSettings: Settings = {
  service: ls.get("poastbox.service", DEFAULT_SETTINGS.service),
  handle: ls.get("poastbox.handle", DEFAULT_SETTINGS.handle),
  rememberMe: ls.get("poastbox.rememberMe", DEFAULT_SETTINGS.rememberMe),
  showThreadButtons: ls.get("poastbox.showThreadButtons", DEFAULT_SETTINGS.showThreadButtons),
};
const settingsStore = writable<Settings>(initialSettings);
// note that this is also a valid store since it has a subscribe method:
export const settings = {
  subscribe: settingsStore.subscribe,
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => {
    ls.set(`poastbox.${key}`, value);
    settingsStore.update((prev) => {
      return { ...prev, [key]: value };
    });
  },
};

// toast
type ToastColor = "red" | "green" | "blue";
type Toast = {
  text: string;
  color: ToastColor;
  interval?: number;
};
const toastQueue: Toast[] = [];
const toastStore = writable<Toast>(null);
export const currentToast = {
  subscribe: toastStore.subscribe,
};
const DEFAULT_TOAST_INTERVAL = 2000;
const setNextToast = () => {
  // TODO sleep for animation duration to re-trigger animation ?
  // TODO if i do it async then i can loop and sleep instead of setTimeout callback nonsense
  if (toastQueue.length === 0) {
    toastStore.set(null);
  } else {
    const _toast = toastQueue[0];
    toastStore.set(_toast);
    setTimeout(() => {
      toastQueue.shift();
      setNextToast();
    }, _toast.interval ?? DEFAULT_TOAST_INTERVAL);
  }
};
const toast = (
  message: string,
  {
    color,
    interval,
  }: {
    color?: ToastColor;
    interval?: number;
  }
) => {
  color = color || "blue";
  toastQueue.push({ text: message, color, interval });
  if (toastQueue.length === 1) {
    setNextToast();
  }
};
export const errorToast = (message: string, duration?: number) => toast(message, { color: "red", interval: duration });
export const successToast = (message: string, duration?: number) =>
  toast(message, { color: "green", interval: duration });
