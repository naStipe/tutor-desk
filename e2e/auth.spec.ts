import { test, expect } from "@playwright/test";

test.describe("TD-001A Tutor Authentication UX", () => {
  const uniqueId = Date.now();
  const testTutor = {
    name: "Alex Tutor",
    email: `alex-tutor-${uniqueId}@example.com`,
    password: "Password123!",
  };

  test("displays unauthenticated session card with navigation links on home page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#brand-title")).toHaveText("TutorDesk");
    await expect(page.locator("#sign-in-nav-link")).toBeVisible();
    await expect(page.locator("#sign-up-nav-link")).toBeVisible();
  });

  test("validates input fields client-side on sign-up form", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("#signup-heading")).toHaveText("Create Tutor Account");

    // Click submit with empty fields
    await page.locator("#signup-submit-btn").click();

    // Verify error messages
    await expect(page.locator("#signup-name-error")).toBeVisible();
    await expect(page.locator("#signup-email-error")).toBeVisible();
    await expect(page.locator("#signup-password-error")).toBeVisible();

    // Test short password
    await page.locator("#signup-name").fill("Alex Tutor");
    await page.locator("#signup-email").fill("valid@example.com");
    await page.locator("#signup-password").fill("short");
    await page.locator("#signup-submit-btn").click();
    await expect(page.locator("#signup-password-error")).toContainText("at least 8 characters");
  });

  test("validates input fields client-side on sign-in form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("#signin-heading")).toHaveText("Tutor Sign In");

    await page.locator("#signin-submit-btn").click();
    await expect(page.locator("#signin-email-error")).toBeVisible();
    await expect(page.locator("#signin-password-error")).toBeVisible();
  });

  test("completes end-to-end registration, session recognition, sign-out, and sign-in", async ({
    page,
  }) => {
    // 1. Go to sign-up and create account
    await page.goto("/sign-up");
    await page.locator("#signup-name").fill(testTutor.name);
    await page.locator("#signup-email").fill(testTutor.email);
    await page.locator("#signup-password").fill(testTutor.password);
    await page.locator("#signup-submit-btn").click();

    // 2. Expect redirect to home page with recognized session
    await page.waitForURL("/");
    await expect(page.locator("#authenticated-session-card")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#session-user-name")).toHaveText(testTutor.name);
    await expect(page.locator("#session-user-email")).toHaveText(testTutor.email);
    await expect(page.locator("#session-badge")).toHaveText("Authenticated");

    // 3. Verify visiting /sign-in while authenticated shows "Already Signed In" notice
    await page.goto("/sign-in");
    await expect(page.locator("#already-authenticated-notice")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#already-authenticated-notice")).toContainText(testTutor.email);

    // 4. Sign out
    await page.locator("#sign-out-btn").click();
    await page.waitForURL("/");
    await expect(page.locator("#unauthenticated-session-card")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#sign-in-nav-link")).toBeVisible();

    // 5. Sign back in with credentials
    await page.goto("/sign-in");
    await page.locator("#signin-email").fill(testTutor.email);
    await page.locator("#signin-password").fill(testTutor.password);
    await page.locator("#signin-submit-btn").click();

    // 6. Expect redirect to home page and authenticated session restored
    await page.waitForURL("/");
    await expect(page.locator("#authenticated-session-card")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#session-user-name")).toHaveText(testTutor.name);
    await expect(page.locator("#session-user-email")).toHaveText(testTutor.email);
  });
});
