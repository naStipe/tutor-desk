export type NotificationConfig = {
  /** Master switch. Only the exact string "true" turns email on; anything else is off. */
  enabled: boolean;
  apiKey: string | undefined;
  from: string | undefined;
  cronSecret: string | undefined;
};

type EnvSource = Record<string, string | undefined>;

/**
 * Reads the email-notification settings. Deliberately separate from `getEnv()` (src/lib/env.ts):
 * these variables are optional, and a missing value must never break the rest of the app.
 */
export function getNotificationConfig(env: EnvSource = process.env): NotificationConfig {
  return {
    enabled: env.EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === "true",
    apiKey: env.RESEND_API_KEY?.trim() || undefined,
    from: env.EMAIL_FROM?.trim() || undefined,
    cronSecret: env.CRON_SECRET?.trim() || undefined,
  };
}

/** True only when the master switch is on AND Resend credentials and a sender are configured. */
export function canSendEmail(config: NotificationConfig) {
  return config.enabled && Boolean(config.apiKey) && Boolean(config.from);
}
