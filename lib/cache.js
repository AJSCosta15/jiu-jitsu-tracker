const createCache = (ttlMs, now = Date.now) => {
  const store = new Map();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (now() - entry.at > ttlMs) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      store.set(key, { value, at: now() });
    },
  };
};

module.exports = { createCache };
