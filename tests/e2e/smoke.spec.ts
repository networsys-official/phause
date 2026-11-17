import { expect, test } from "@playwright/test";

test("the homepage renders with core marketing content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page).toHaveTitle(/Phause|Strengthen/);
});
