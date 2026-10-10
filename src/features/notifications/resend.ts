const RESEND_URL = "https://api.resend.com/emails";

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Resend dedupes requests carrying the same key for 24h. */
  idempotencyKey?: string;
};

export type SendResult = { ok: true } | { ok: false; rateLimited: boolean; code: string };

/**
 * Sends one email through Resend's REST API (no SDK, so no new dependency). Never throws and
 * never logs the API key, the address, or the body; failures come back as a short error code.
 */
export async function sendEmail(
  apiKey: string,
  message: EmailMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (message.idempotencyKey) headers["Idempotency-Key"] = message.idempotencyKey;

  try {
    const response = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return { ok: true };
    return { ok: false, rateLimited: response.status === 429, code: `http_${response.status}` };
  } catch {
    return { ok: false, rateLimited: false, code: "network_error" };
  }
}
