const PREFIX = "poastbox.";

export const ls = {
  get: (key: string, defaultValue: any) => {
    const value = localStorage.getItem(PREFIX + key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  delete: (key: string) => {
    localStorage.removeItem(PREFIX + key);
  },
  keys: (pattern?: string | RegExp) => {
    const keys = Object.keys(localStorage).map((key) => key.replace(PREFIX, ""));
    if (!pattern) return keys;
    return keys.filter((key) => {
      if (typeof pattern === "string") {
        return key.includes(pattern);
      }
      return pattern.test(key);
    });
  },
};
