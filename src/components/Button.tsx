import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-blue-600 text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return [BASE_CLASSES, VARIANT_CLASSES[variant], className].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
};

export function LinkButton({ variant = "primary", className, href, ...props }: LinkButtonProps) {
  return <Link href={href} className={buttonClassName(variant, className)} {...props} />;
}
