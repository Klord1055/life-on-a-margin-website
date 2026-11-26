const { test, expect } = require("@playwright/test");
const { source: axeSource } = require("axe-core");

test("main navigation, release status and hero artwork work", async ({ page }) => {
  const failed = [];
  page.on("pageerror", (error) => failed.push(error.message));
  await page.goto("./");
  await expect(page).toHaveTitle("Life on a Margin");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Not yet released", { exact: true })).toHaveCount(2);

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  for (const [label, anchor] of Object.entries({
    "The game": "#game",
    "Editions": "#editions",
    "Player guide": "#guide",
    "Academy": "#academy",
    "Updates": "#updates",
    "Engineering": "#engineering",
    "FAQ": "#faq"
  })) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    expect(new URL(page.url()).hash).toBe(anchor);
    await expect(page.locator(anchor)).toBeVisible();
  }
  for (const [label, anchor] of Object.entries({
    "Explore the game": "#game",
    "Release status": "#editions",
    "Back to top": "#top"
  })) {
    const action = page.getByRole("link", { name: label, exact: true });
    await action.click();
    expect(new URL(page.url()).hash).toBe(anchor);
  }

  const heroImage = page.getByRole("img", { name: /suited traveler/ });
  await expect(heroImage).toHaveJSProperty("naturalWidth", 448);
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width);
  expect(failed).toEqual([]);
});

test("development updates and site help lead to the matching resources", async ({ page }) => {
  await page.goto("./#updates");
  const updates = page.getByRole("region", { name: "Development updates" });
  await page.getByRole("link", { name: "Engineering", exact: true }).click();
  await expect(page).toHaveURL(/#engineering$/);
  const notes = page.getByRole("region", { name: "Engineering notes" });
  await expect(notes.getByText(/AI-assisted engineering/)).toBeVisible();
  await notes.getByRole("link", { name: "Read verified milestones" }).click();
  await expect(page).toHaveURL(/#updates$/);
  await expect(updates.getByRole("heading", { name: "Internal save and resume test" })).toBeVisible();
  await expect(updates.getByText(/Both editions are still in development/)).toBeVisible();
  await expect(updates.locator("time").first()).toHaveAttribute("datetime", "2026-11-26");
  await updates.getByRole("link", { name: "Try the exercises" }).click();
  await expect(page).toHaveURL(/#academy$/);

  await page.getByRole("link", { name: "Site help", exact: true }).click();
  await expect(page).toHaveURL(/#support$/);
  const support = page.getByRole("region", { name: "Help with the site" });
  await expect(support.getByRole("heading", { name: "Images and text" })).toBeVisible();
  await support.getByRole("link", { name: "Go to the FAQ" }).click();
  await expect(page).toHaveURL(/#faq$/);
  await page.goBack();
  await support.getByRole("link", { name: "Check release status" }).click();
  await expect(page).toHaveURL(/#editions$/);
  await expect(page.getByText("Not yet released", { exact: true })).toHaveCount(2);
});

test("skip navigation and answer disclosures work with keyboard input", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  for (const [label, answer] of [
    ["Show the cash flow", /negative \$1,000/],
    ["Show the interest calculation", /\$102\.50 total/],
    ["Show the portfolio impact", /loses \$50/],
    ["Can I play or download the game now?", /Neither edition has been released/],
    ["Which devices will be supported?", /Windows prioritized/],
    ["Will I be able to take a demo save into the game?", /Save export and transfer are planned/],
    ["What can I use with a keyboard or reduced motion?", /keyboard-accessible navigation/],
    ["Is this financial advice?", /fictional scenarios/]
  ]) {
    const toggle = page.locator("summary").filter({ hasText: label });
    const content = toggle.locator("..").getByText(answer);
    await expect(content).toBeHidden();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(content).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(content).toBeHidden();
  }
});

test("the landing page passes an automated accessibility scan", async ({ page }) => {
  await page.goto("./");
  await page.getByText("Show the cash flow", { exact: true }).click();
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run({
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
    });
    return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) }));
  });
  expect(violations).toEqual([]);
});
