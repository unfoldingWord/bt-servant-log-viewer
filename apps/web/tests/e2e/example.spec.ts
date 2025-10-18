import { expect, test } from "@playwright/test";

test("homepage loads successfully", async ({ page }): Promise<void> => {
  await page.goto("/");

  await expect(page.locator("h1")).toContainText("BT Servant Logs");
});

test("responsive design - mobile viewport", async ({ page }): Promise<void> => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  // Verify the page is usable on mobile
  await expect(page.locator("body")).toBeVisible();
});

test("responsive design - desktop viewport", async ({ page }): Promise<void> => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");

  // Verify the page is usable on desktop
  await expect(page.locator("body")).toBeVisible();
});
