import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required").max(128),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
