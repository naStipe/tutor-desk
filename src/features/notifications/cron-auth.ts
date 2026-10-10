import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/**
 * Constant-time check of `Authorization: Bearer <secret>`. Both sides are hashed first so the
 * comparison has equal length regardless of input (timingSafeEqual requires it). An unset or
 * empty secret never authorizes anything.
 */
export function isAuthorizedCron(authorizationHeader: string | null, secret: string | undefined) {
  if (!secret || !authorizationHeader) return false;
  const match = /^Bearer (.+)$/.exec(authorizationHeader);
  if (!match) return false;
  return timingSafeEqual(digest(match[1]), digest(secret));
}
