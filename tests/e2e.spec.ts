import { expect, test } from "@playwright/test";

test("header phone is a visible tel link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const phone = page.locator("header a.header-phone");
  await expect(phone).toBeVisible();
  await expect(phone).toHaveAttribute("href", /tel:/);
  await expect(phone).toContainText("(805) 236-8182");
});

test("scan happy path produces a result and print control", async ({ page }) => {
  await page.goto("/scan");
  await page.getByRole("button", { name: "Shop" }).click();
  await page.getByRole("button", { name: "6–15" }).click();
  await page.getByRole("button", { name: "Weekly numbers" }).click();
  await page.getByRole("button", { name: "6–10" }).click();
  await page.getByRole("button", { name: "Owner" }).click();
  await expect(page.locator(".result")).toBeVisible();
  await expect(page.locator(".result")).toContainText("hours a year");
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  expect(page.url()).toContain("a=shop");
});

test("query-string restore works", async ({ page }) => {
  await page.goto("/scan?a=shop&s=6-15&p=numbers&h=6-10&o=owner");
  await expect(page.locator(".result")).toBeVisible();
  await expect(page.locator(".result")).toContainText("First step");
});

test("sample print page exists", async ({ page }) => {
  await page.goto("/sample");
  await expect(page.getByRole("heading", { name: "Harbor Tool & Supply" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print this page" })).toBeVisible();
});

test("card, markdown, and llms surfaces", async ({ request }) => {
  const vcf = await request.get("/card.vcf");
  expect(vcf.ok()).toBeTruthy();
  expect(await vcf.text()).toContain("TEL");
  const workMd = await request.get("/work.md");
  expect(workMd.ok()).toBeTruthy();
  const llms = await request.get("/llms.txt");
  expect(llms.ok()).toBeTruthy();
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  const body = await health.json();
  expect(body.ok).toBeTruthy();
});

test("no banned words and footer built-with is not in the header", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  for (const word of ["quantum", "strand", "mercenary", "cognitive architect"]) {
    expect(html.toLowerCase()).not.toContain(word);
  }
  await expect(page.locator("header a[href='/built-with']")).toHaveCount(0);
  await expect(page.locator("footer a[href='/built-with']")).toBeVisible();
});

test("form has at most five real fields", async ({ page }) => {
  await page.goto("/talk");
  const fields = page.locator("form[data-contact] input:not(.hp input):not([type=hidden]), form[data-contact] select, form[data-contact] textarea");
  expect(await fields.count()).toBeLessThanOrEqual(5);
});

test("about has Broadcast, LinkedIn, and GitHub doors", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator(".link-tree a[href*='the-broadcast']")).toBeVisible();
  await expect(page.locator(".link-tree a[href*='linkedin.com']")).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" })).toBeVisible();
  await expect(page.getByRole("link", { name: "This site", exact: true })).toBeVisible();
});

test("talk offers self-built booking and a video note", async ({ page, request }) => {
  const slots = await request.get("/api/slots");
  expect(slots.ok()).toBeTruthy();
  const body = await slots.json();
  expect(Array.isArray(body.slots)).toBeTruthy();
  await page.goto("/talk");
  await expect(page.locator("#book")).toBeVisible();
  await expect(page.locator("#video-note input[capture]")).toBeVisible();
});
