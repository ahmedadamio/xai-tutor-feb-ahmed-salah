import { expect, test } from "@playwright/test";

test("loads mailbox and opens compose modal", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Emails" })).toBeVisible();
  await expect(page.getByText("All Mails")).toBeVisible();

  await page.getByRole("button", { name: "New Message" }).click();
  await expect(page.getByText("New Message")).toBeVisible();
});

test("filters unread and archive tabs", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Unread" }).click();
  await expect(page.getByRole("button", { name: "Unread" })).toBeVisible();

  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();
});
