import { getNotificationConfig, type NotificationConfig } from "./config";
import { isAuthorizedCron } from "./cron-auth";

/**
 * Request handling for the cron route, separated from the route file so it is testable.
 * Order matters: authenticate first (401 reveals nothing), then honor the master switch.
 */
export async function handleCronRequest(
  request: Request,
  run: (config: NotificationConfig) => Promise<unknown>,
  config: NotificationConfig = getNotificationConfig(),
) {
  if (!isAuthorizedCron(request.headers.get("authorization"), config.cronSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!config.enabled) return Response.json({ disabled: true }, { status: 200 });
  const summary = await run(config);
  return Response.json({ disabled: false, summary }, { status: 200 });
}
