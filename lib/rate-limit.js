const globalStore = globalThis.__panteralabRateLimitStore || new Map();

if (!globalThis.__panteralabRateLimitStore) {
  globalThis.__panteralabRateLimitStore = globalStore;
}

function getWindowEntry(key, windowMs) {
  const now = Date.now();
  const existingEntry = globalStore.get(key);

  if (!existingEntry || existingEntry.expiresAt <= now) {
    const freshEntry = {
      count: 0,
      expiresAt: now + windowMs,
    };
    globalStore.set(key, freshEntry);
    return freshEntry;
  }

  return existingEntry;
}

export function checkRateLimit({ key, limit, windowMs }) {
  const entry = getWindowEntry(key, windowMs);
  entry.count += 1;

  const now = Date.now();
  const retryAfter = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfter,
  };
}

export function createRateLimitErrorMessage(defaultMessage, retryAfter) {
  if (!retryAfter) {
    return defaultMessage;
  }

  return `${defaultMessage} Tente novamente em ${retryAfter}s.`;
}
