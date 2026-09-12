import { auth } from "@/src/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth App Router Catch-All Route Handler.
 * Routes all authentication requests (/api/auth/*) to Better Auth.
 */
export const { GET, POST } = toNextJsHandler(auth);
