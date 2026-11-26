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
