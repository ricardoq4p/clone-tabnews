import { createHash } from "crypto";
import connectToDatabase from "./db";
import RateLimitBucket from "./models/RateLimitBucket";

export async function checkRateLimit({ key, ip, identity, limit, windowMs }) {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    !Number.isSafeInteger(windowMs) ||
    windowMs < 1
  ) {
    throw new Error("Invalid rate limit configuration");
  }
  await connectToDatabase();
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const scope = key
    .split(":")
    .slice(0, key.startsWith("communities:") ? 2 : 1)
    .join(":");
  const keys = [key];
  if (ip) keys.push(`${scope}:ip:${ip}`);
  if (identity) keys.push(`${scope}:identity:${identity}`);
  const counts = await Promise.all(
    [...new Set(keys)].map(async (bucketKey) => {
      const _id = createHash("sha256")
        .update(`${windowMs}:${windowStart}:${bucketKey}`)
        .digest("hex");
      const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt } };
      try {
        return (
          await RateLimitBucket.findOneAndUpdate({ _id }, update, {
            upsert: true,
            new: true,
          })
        ).count;
      } catch (error) {
        if (error.code !== 11000) throw error;
        return (
          await RateLimitBucket.findOneAndUpdate(
            { _id },
            { $inc: { count: 1 } },
            { new: true },
          )
        ).count;
      }
    }),
  );
  const count = Math.max(...counts);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  };
}

export function createRateLimitErrorMessage(message, retryAfter) {
  return retryAfter ? `${message} Tente novamente em ${retryAfter}s.` : message;
}
