const { test, expect } = require("@playwright/test");
const { source: axeSource } = require("axe-core");

async function expectNoAccessibilityViolations(page) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run({
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
    });
    return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) }));
  });
  expect(violations).toEqual([]);
}

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

test("the Chicago showcase swaps rendered districts with working keyboard controls", async ({ page }) => {
  await page.goto("./#game");
  const controls = page.getByRole("group", { name: "Choose a district view" });
  const river = controls.getByRole("button", { name: "River District" });
  const market = controls.getByRole("button", { name: "West Market" });
  const riverView = page.locator("#river-district-view");
  const marketView = page.locator("#west-market-view");

  await expect(river).toHaveAttribute("aria-pressed", "true");
  await expect(riverView.getByRole("img")).toHaveJSProperty("naturalWidth", 744);
  await expect(marketView).toBeHidden();
  await market.focus();
  await market.press("Space");
  await expect(market).toBeFocused();
  await expect(market).toHaveAttribute("aria-pressed", "true");
  await expect(marketView.getByRole("img")).toHaveJSProperty("naturalWidth", 744);
  await expect(marketView).toBeVisible();
  await expect(riverView).toBeHidden();

  await river.click();
  await expect(riverView).toBeVisible();
  await expect(market).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator("html").evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0);
});

for (const edition of [
  {
    title: "Life on a Margin: The First Trade",
    details: "Browser demo details",
    other: "Downloadable game details",
    url: /\/editions\/first-trade\.html$/,
    otherUrl: /\/editions\/life-on-a-margin\.html$/,
    label: "Free browser demo",
    verified: /internal browser build resumed the same universe/,
    scene: "Chicago River District"
  },
  {
    title: "Life on a Margin",
    details: "Downloadable game details",
    other: "Browser demo details",
    url: /\/editions\/life-on-a-margin\.html$/,
    otherUrl: /\/editions\/first-trade\.html$/,
    label: "Free downloadable game",
    verified: /internal desktop save test restored a universe/,
    scene: "West Market"
  }
]) {
  test(`${edition.label} details and prerelease navigation`, async ({ page }) => {
    await page.goto("./#editions");
    await page.getByRole("link", { name: edition.details }).click();
    await expect(page).toHaveURL(edition.url);
    await expect(page).toHaveTitle(edition.title);
    await expect(page.getByRole("heading", { level: 1, name: edition.title })).toBeVisible();
    await expect(page.getByText(edition.label, { exact: true })).toBeVisible();
    await expect(page.getByText(edition.verified)).toBeVisible();
    const capture = page.getByRole("figure").filter({ hasText: edition.scene });
    await expect(capture.getByText("Development gameplay")).toBeVisible();
    await expect(capture.getByRole("img")).toHaveJSProperty("naturalWidth", 744);
    const status = page.getByRole("region", { name: "Release status" });
    await expect(status.getByText("Not yet released")).toBeVisible();
    await expect(page.getByRole("link", { name: /^(Play now|Download now)$/i })).toHaveCount(0);
    expect(await page.locator("html").evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0);
    await expectNoAccessibilityViolations(page);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();

    await page.getByRole("link", { name: "See release status" }).click();
    await expect(page).toHaveURL(/#editions$/);
    await page.goBack();
    await page.getByRole("navigation").getByRole("link", { name: "Player guide" }).click();
    await expect(page).toHaveURL(/#guide$/);
    await expect(page.getByRole("heading", { name: "Getting started" })).toBeVisible();
    await page.goBack();
    await page.getByRole("link", { name: edition.other }).click();
    await expect(page).toHaveURL(edition.otherUrl);
  });
}

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

test("the player guide filters topics locally and recovers from an empty search result", async ({ page }) => {
  await page.goto("./#guide");
  const search = page.getByRole("search", { name: "Player guide" });
  const query = search.getByRole("searchbox", { name: "Search guide topics" });
  const status = search.getByRole("status");
  const topics = page.locator("#guide-results > div");

  await expect(status).toHaveText("All 3 topics shown");
  await query.fill("   BROWSER   backup  ");
  await expect(status).toHaveText("1 topic found");
  await expect(topics.filter({ visible: true })).toHaveText([/Continue from a save/]);
  await query.press("Enter");
  await expect(page).toHaveURL(/#guide$/);
  await expect(query).toHaveValue("   BROWSER   backup  ");

  await query.fill("zzz");
  await expect(status).toHaveText("No matching topics. Try a shorter search.");
  await expect(topics.filter({ visible: true })).toHaveCount(0);
  await search.getByRole("button", { name: "Clear" }).click();
  await expect(query).toBeFocused();
  await expect(query).toBeEmpty();
  await expect(topics.filter({ visible: true })).toHaveCount(3);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the guide still presents every topic", async ({ page }) => {
    await page.goto("./#guide");
    await expect(page.getByRole("search", { name: "Player guide" })).toBeHidden();
    await expect(page.locator("#guide-results > div").filter({ visible: true })).toHaveCount(3);
  });

  test("both Chicago district views remain available", async ({ page }) => {
    await page.goto("./#game");
    await expect(page.getByRole("group", { name: "Choose a district view" })).toBeHidden();
    await expect(page.locator(".district-view").filter({ visible: true })).toHaveCount(2);
  });
});

test("the landing page passes an automated accessibility scan", async ({ page }) => {
  await page.goto("./");
  await page.getByText("Show the cash flow", { exact: true }).click();
  await expectNoAccessibilityViolations(page);
});
