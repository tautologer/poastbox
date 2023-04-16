export const ls = {
  get: (key: string, defaultValue: any) => {
    const value = localStorage.getItem(key);
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
    localStorage.setItem(key, JSON.stringify(value));
  },
  delete: (key: string) => {
    localStorage.removeItem(key);
  },
};
