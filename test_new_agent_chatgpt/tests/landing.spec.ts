import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("patient search, chart exploration, review state, and missing data work together", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Discover PulseMind" }).click();
  const search = page.getByRole("textbox", { name: "Find a demo patient" });
  await search.fill("nonexistent");
  await expect(page.getByText("No matching patient.")).toBeVisible();
  await search.fill("PM-004");
  await page.getByRole("button", { name: /PM-004 Bed 04/ }).click();
  await expect(
    page.getByRole("heading", { name: "The context behind the change." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "24h", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /trend over 24 hours/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark as reviewed" }).click();
  await expect(
    page.getByRole("button", { name: "Reviewed · Undo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore the source" }).click();
  await expect(
    page.getByText("DATA PROVENANCE", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "01 See the whole unit" }).click();
  await search.clear();
  await expect(
    page.getByRole("button", { name: /PM-004 Bed 04 Reviewed/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /PM-012 Bed 12/ }).click();
  await expect(
    page.getByText("Assessment unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No recent data", { exact: true })).toBeVisible();
});

test("tabs support arrow-key navigation and FAQ exposes the selected answer", async ({
  page,
}) => {
  const tab = page.getByRole("tab", { name: "01 See the whole unit" });
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "02 Understand the patient" }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "02 Understand the patient" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "03 Trace every signal" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Is PulseMind being used for clinical care?" })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Is PulseMind being used for clinical care?",
    }),
  ).toContainText("Not yet.");
  await expect(
    page.getByRole("button", { name: "What is PulseMind?" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("research uses updated figures and the English brief can be downloaded", async ({
  page,
}) => {
  await expect(page.locator(".research-stats")).toContainText("36");
  await expect(page.locator(".research-stats")).toContainText("4.25");
  await expect(page.locator(".research-stats")).toContainText("77.8");
  await page.getByRole("button", { name: "Behind the numbers" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("28 of 36");
  await expect(dialog).toContainText("conditional on safety validation");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download the research brief" }).click();
  await expect((await download).suggestedFilename()).toBe("research-brief.md");
  const brief = await page.request.get("/research-brief.md");
  expect(brief.ok()).toBeTruthy();
  expect(await brief.text()).toContain("77.8%");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Behind the numbers" }),
  ).toBeFocused();
});

test("contact creates a reviewable email draft and preserves edits without claiming to send", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Let’s connect", exact: true })
    .click();
  await page.getByLabel("Your name").fill("Alex Morgan");
  await page.getByLabel("Work email").fill("alex@example.org");
  await page
    .getByLabel("Organization", { exact: true })
    .fill("Example Hospital");
  await page.getByLabel("Your role").selectOption("an ICU clinician");
  await page
    .getByLabel("A little about your interest")
    .fill("I would like to help with prototype feedback.");
  await page.getByRole("button", { name: "Prepare an introduction" }).click();
  await expect(page.getByText("Your introduction is ready.")).toBeVisible();
  const link = page.getByRole("link", { name: "Open email draft" });
  expect(decodeURIComponent((await link.getAttribute("href")) ?? "")).toContain(
    "Alex Morgan",
  );
  expect(await link.getAttribute("href")).toMatch(
    /^mailto:khanh.nguyenl3ph@hcmut.edu.vn/,
  );
  await expect(page.getByText(/Nothing has been sent or stored/)).toBeVisible();
  await page.getByRole("button", { name: "Edit your introduction" }).click();
  await expect(page.getByLabel("Your name")).toHaveValue("Alex Morgan");
  await expect(page.getByLabel("A little about your interest")).toHaveValue(
    "I would like to help with prototype feedback.",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Let’s connect", exact: true }),
  ).toBeFocused();
});

test("mobile navigation works and all screens stay inside the viewport", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const stage of [
      "01 See the whole unit",
      "02 Understand the patient",
      "03 Trace every signal",
    ]) {
      await page.getByRole("tab", { name: stage }).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "The research" })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).not.toBeVisible();
  await expect(page).toHaveURL(/#research$/);
});

test("desktop and mobile pass automated accessibility checks", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});

test("loads without browser errors and all local links resolve", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
  const hashes = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
  for (const hash of hashes) await expect(page.locator(hash)).toHaveCount(1);
  const image = page.getByAltText(
    "A pair of translucent crimson glass lungs, connected by delicate branching fibers",
  );
  expect(
    await image.evaluate(
      (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
    ),
  ).toBeTruthy();
});
