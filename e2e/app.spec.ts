import { test, expect } from "@playwright/test";

test.describe("TutorDesk Shell", () => {
  test("loads the landing page and verifies foundation shell elements", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-frame-options"]).toBe("DENY");

    // Verify title and brand
    await expect(page.locator("#brand-title")).toHaveText("TutorDesk");

    // Verify status badge
    await expect(page.locator("#status-badge")).toContainText("Supabase foundation");

    // Verify auth entry point is present
    await expect(page.locator("#sign-in-link")).toBeVisible();

    const healthResponse = await page.request.get("/api/health");
    expect(healthResponse.status()).toBe(200);
    await expect(healthResponse.json()).resolves.toMatchObject({
      status: "ok",
      app: "TutorDesk",
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Tutor sign in" })).toBeVisible();
  });
});
