import { test, expect } from "@playwright/test";

test.describe("TutorDesk Shell", () => {
  test("loads the landing page and verifies foundation shell elements", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify title and brand
    await expect(page.locator("#brand-title")).toHaveText("TutorDesk");

    // Verify status badge
    await expect(page.locator("#status-badge")).toContainText("TD-000 Initialized");

    // Verify health check link is present
    await expect(page.locator("#health-check-link")).toBeVisible();
  });
});
