import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-brand text-on-brand shadow-sm hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-border bg-surface text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97] motion-reduce:active:scale-100";

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
