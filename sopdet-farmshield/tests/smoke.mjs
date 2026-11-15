/*
 * Browser smoke test (needs Playwright + a Chromium):   npm run build && node tests/smoke.mjs
 * Opens dist/index.html in headless Chromium and checks every page, both languages, both countries, desktop and phone width:
 * no JavaScript errors, no missing local files, no sideways scrolling, working navigation, no Brand page, and that choosing
 * Egypt or India really changes the numbers.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const { chromium } = await import("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL0 = pathToFileURL(path.join(ROOT, "dist/index.html")).href;
const PAGES = ["dashboard", "insights", "guide", "planner", "expert", "map", "sources", "setup"];
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  ✗ " + m); } };

const browser = await chromium.launch();
async function open(viewport, lang = "en", cc = "EG", mode = "farmer") {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(([l, c, m]) => { try { localStorage.setItem("sf-lang", l); localStorage.setItem("sf-mode", m); localStorage.setItem("sf-farm", JSON.stringify({ country: c })); } catch {} }, [lang, cc, mode]);
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_INTERNET|ERR_NAME|Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
  page.on("requestfailed", (r) => { const u = r.url(); if (!/fonts\.(googleapis|gstatic)/.test(u) && !/\.mp4/.test(u)) errors.push("requestfailed: " + u); });
  page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith("file")) errors.push("http " + r.status() + " " + r.url()); });
  return { ctx, page, errors };
}
const go = async (page, r) => { await page.evaluate((x) => (location.hash = x), r); await page.waitForTimeout(250); };
const text = (page) => page.evaluate(() => document.querySelector("main")?.innerText ?? "");

console.log("• every page × language × country × viewport");
for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 800 }]) {
  for (const lang of ["en", "ar"]) for (const cc of ["EG", "IN"]) {
    const { ctx, page, errors } = await open(vp, lang, cc, "expert");
    await page.goto(URL0 + "#dashboard"); await page.waitForTimeout(400);
    for (const r of PAGES) {
      await go(page, r);
      const body = await text(page);
      ok(body.length > 300, `${r}/${lang}/${cc}/${vp.width}: page rendered (${body.length} chars)`);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(over <= 1, `${r}/${lang}/${cc}/${vp.width}: no sideways scroll (overflow ${over}px)`);
      ok(!/NaN|undefined|\[object/.test(body), `${r}/${lang}/${cc}/${vp.width}: no NaN/undefined in text`);
      ok(!/DEMO DATA|بيانات تجريبية\./.test(body) || r === "x", `${r}: no leftover "DEMO DATA" banner`);
    }
    ok(errors.length === 0, `no JS/network errors (${lang}/${cc}/${vp.width}): ${errors.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
}

console.log("• navigation");
{
  const { ctx, page, errors } = await open({ width: 1280, height: 900 });
  await page.goto(URL0 + "#dashboard"); await page.waitForTimeout(400);
  const side = await page.$$eval(".side .nav button", (b) => b.map((x) => x.textContent.trim()));
  ok(!side.some((s) => /Brand|الهوية/i.test(s)), `sidebar has no Brand entry: ${side.join(" | ")}`);
  ok(side.length >= 9, `sidebar items: ${side.length}`);
  for (const n of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const btns = await page.$$(".side .nav button"); await btns[n].click(); await page.waitForTimeout(200);
    const h = await page.evaluate(() => location.hash.slice(1)); ok(PAGES.includes(h), `sidebar item ${n} → #${h}`);
    ok((await text(page)).length > 200, `sidebar item ${n} renders`);
  }
  await page.goto(URL0 + "#brand"); await page.reload(); await page.waitForTimeout(400);
  ok(/Climate record|climate record|Dashboard|Latest 30/i.test(await text(page)), "old #brand link falls back to the dashboard");
  await page.setViewportSize({ width: 390, height: 800 }); await page.waitForTimeout(300);
  const mob = await page.$$eval(".mobile-nav button", (b) => b.map((x) => x.textContent.trim()));
  ok(mob.length === 8 && !mob.some((s) => /Brand|الهوية/i.test(s)), `mobile nav has 8 items, no Brand: ${mob.join(" | ")}`);
  for (let n = 0; n < mob.length; n++) { const btns = await page.$$(".mobile-nav button"); await btns[n].click({ force: true }); await page.waitForTimeout(200); ok((await text(page)).length > 200, `mobile item ${n} renders`); }
  ok(errors.length === 0, "navigation: no errors " + errors.join("|"));
  await ctx.close();
}

console.log("• Egypt / India switch really changes the data");
{
  const { ctx, page, errors } = await open({ width: 1280, height: 900 });
  await page.goto(URL0 + "#dashboard"); await page.waitForTimeout(400);
  const stat = () => page.$$eval(".status .word", (n) => n.map((x) => x.textContent.trim()).join(" / "));
  const eg = await stat(), egDate = await text(page);
  ok(/Now growing:\s*Wheat/.test(egDate), "partial saved settings fall back to defaults (Now growing: Wheat)");
  ok(await page.evaluate(() => document.documentElement.dir) === "ltr", "English page is LTR");
  await page.click('.topbar .seg[aria-label*="Country"] button:nth-child(2)'); await page.waitForTimeout(300);
  const ind = await stat(), indDate = await text(page);
  ok(eg !== ind, `dashboard numbers differ: EG [${eg}] vs IN [${ind}]`);
  ok(/2026-03-14/.test(egDate) && /2026-11-11/.test(indDate), "dashboard shows each country's own last data date");
  await go(page, "insights"); const t1 = await text(page); await page.click('.topbar .seg[aria-label*="Country"] button:nth-child(1)'); await page.waitForTimeout(300); const t2 = await text(page);
  ok(t1 !== t2 && /1,899|1899/.test(t2) && /2,141|2141/.test(t1), "insights switches 2,141-day India vs 1,899-day Egypt record");
  await go(page, "expert");
  await page.selectOption("#var-select", "PRECTOTCORR"); await page.waitForTimeout(200);
  ok(/mm/.test(await text(page)), "expert variable explorer works");
  ok(/2021-01-01 → 2026-03-14/.test(await text(page)), "expert comparison states the common period");
  ok(errors.length === 0, "switch: no errors " + errors.join("|"));
  await ctx.close();
}

console.log("• planner is a comparison tool, not a scorer");
{
  const { ctx, page, errors } = await open({ width: 1280, height: 900 });
  await page.goto(URL0 + "#planner"); await page.waitForTimeout(500);
  const t1 = await text(page);
  ok(/No model connected/.test(t1) && /Prediction/.test(t1), "prediction block says no model is connected");
  ok(!/Fit with your priorities|Productivity potential|Market suitability|Agricultural risk|\/ 100/.test(t1), "no invented scores or priority-fit");
  ok(/Unverified input/.test(t1) && /Illustrative calculation/.test(t1) && /NASA POWER data/.test(t1), "all content tiers are labelled");
  const before = await page.$$eval(".scen .display", (n) => n.map((x) => x.textContent.trim()).join(","));
  await page.$$eval(".scen details summary", (s) => s.forEach((x) => x.click()));
  await page.selectOption('select[aria-label^="Scenario A"] >> nth=0', "rice"); await page.waitForTimeout(250);
  const after = await page.$$eval(".scen .display", (n) => n.map((x) => x.textContent.trim()).join(","));
  ok(before !== after, `changing a crop changes the listed-water sum: ${before} → ${after}`);
  ok(/outside its listed season/.test(await text(page)), "an off-season crop is flagged");
  ok(errors.length === 0, "planner: no errors " + errors.join("|"));
  await ctx.close();
}

console.log("• Arabic is RTL");
{
  const { ctx, page } = await open({ width: 1280, height: 900 }, "ar");
  await page.goto(URL0 + "#dashboard"); await page.waitForTimeout(400);
  ok(await page.evaluate(() => document.documentElement.dir) === "rtl", "Arabic page is RTL");
  ok(/سجل ناسا المناخي/.test(await text(page)), "Arabic dashboard text is shown");
  await ctx.close();
}

console.log("• guide, setup, map");
{
  const { ctx, page, errors } = await open({ width: 1280, height: 900 });
  await page.goto(URL0 + "#guide"); await page.waitForTimeout(400);
  await page.fill("#chat-input", "How much rain falls per year?"); await page.press("#chat-input", "Enter"); await page.waitForTimeout(900);
  ok(/mm per year over 5 complete years/.test(await text(page)), "guide answers rain question with computed numbers");
  await page.fill("#chat-input", "Which crop should I plant?"); await page.press("#chat-input", "Enter"); await page.waitForTimeout(900);
  ok(/no machine-learning model/i.test(await text(page)), "guide refuses to recommend/predict");
  await page.fill("#chat-input", "هل عندكم بيانات NDVI؟"); await page.press("#chat-input", "Enter"); await page.waitForTimeout(900);
  ok(/not in this project/.test(await text(page)), "guide says NDVI is not integrated");
  await go(page, "setup"); await page.fill("#lat", "30.79"); await page.fill("#lon", "31.0"); await page.waitForTimeout(150);
  ok(/61 km/.test(await text(page)), "setup shows distance to the data point");
  await page.click('button[type="submit"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => location.hash) === "#dashboard", "saving setup opens the dashboard");
  await go(page, "map"); ok(/Schematic/.test(await text(page)) && await page.$("svg polygon, svg rect") !== null, "map page draws the grid cell diagram");
  ok(errors.length === 0, "guide/setup/map: no errors " + errors.join("|"));
  await ctx.close();
}

await browser.close();
console.log(`\n${fail ? "FAILED" : "PASSED"}: ${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
