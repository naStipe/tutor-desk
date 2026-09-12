import { z } from "zod";

/**
 * Validation schema for Tutor Sign-Up.
 * Validates tutor name, email address, and strong password.
 */
export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Name must not exceed 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Validation schema for Tutor Sign-In.
 * Validates email address and password input.
 */
export const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;
