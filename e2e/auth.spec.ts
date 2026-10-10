import { expect, test } from "@playwright/test";

/**
 * Auth UX smoke tests against the current AuthForm (src/features/auth/components/AuthForm.tsx).
 *
 * Every submit here fails Zod validation in the server action before any Supabase call, so no
 * account is created and no credentials are needed. The old create-account / sign-out / sign-in
 * round trip was removed: it needs a hosted project that skips email confirmation and it created a
 * real user on every run. Hosted auth is covered by `pnpm run test:auth:hosted` instead.
 */
test.describe("Tutor authentication UX", () => {
  test("home page links to sign in and sign up", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#brand-title")).toContainText("TutorDesk");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create a free account/ })).toBeVisible();
  });

  test("sign-in page renders its form and links", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    await expect(page.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  test("sign-in shows field errors for empty fields", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("sign-up page renders its form and links", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(
      page.getByRole("heading", { name: "Create tutor account", level: 1 }),
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  test("sign-up shows field errors for empty fields and for a short password", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

    // A valid email with a too-short password still fails validation before any Supabase call.
    await page.getByLabel("Email address").fill("valid@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
    await expect(page.getByText("Enter a valid email address")).toHaveCount(0);
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("navigates between sign-in and sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByRole("heading", { name: "Create tutor account" })).toBeVisible();

    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
  });
});
