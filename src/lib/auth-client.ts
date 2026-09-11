import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React Client.
 *
 * Client-side authentication utilities for checking session state,
 * sign-in, and sign-out in React components.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
