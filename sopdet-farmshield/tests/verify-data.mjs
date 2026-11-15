/*
 * node tests/verify-data.mjs      (also run by `npm test`)
 * Recomputes statistics straight from the CSV files with independent code and compares them with src/nasa.js,
 * then checks navigation/route consistency in the source. No browser needed.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0, passed = 0;
const ok = (c, m) => { if (c) { passed++; } else { failed++; console.error("  ✗ " + m); } };
const near = (a, b, tol, m) => ok(a != null && Math.abs(a - b) <= tol, `${m}: got ${a}, expected ${b} (±${tol})`);

/* bundle nasa.js (it imports JSON) into a temp ESM file we can import from Node */
const tmp = path.join(os.tmpdir(), `sopdet-nasa-${process.pid}.mjs`);
await build({ entryPoints: [path.join(ROOT, "src/nasa.js")], bundle: true, format: "esm", outfile: tmp, logLevel: "silent" });
const N = await import(pathToFileURL(tmp).href);

/* independent CSV reader */
const csv = (f) => { const L = fs.readFileSync(path.join(ROOT, "data/nasa", f), "utf8").replace(/\r/g, "").split("\n").filter(Boolean); const h = L[0].split(","); return L.slice(1).map((l) => Object.fromEntries(l.split(",").map((c, i) => [h[i], c]))); };
const files = { EG: "egypt_weather_clean.csv", IN: "india_weather_clean.csv" };

console.log("• data integrity");
for (const [cc, f] of Object.entries(files)) {
  const rows = csv(f), p = N.POINTS[cc];
  ok(rows.length === p.n, `${cc}: row count ${rows.length} vs ${p.n}`);
  ok(rows[0].DATE === p.start && rows.at(-1).DATE === p.end, `${cc}: date range`);
  for (const v of N.VARS) {
    const xs = rows.map((r) => (r[v] === "" ? null : Number(r[v]))).filter((x) => x != null);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const s = N.stat(cc, v, "full");
    near(s.mean, mean, 1e-9, `${cc} ${v} mean`);
    near(s.min, Math.min(...xs), 1e-12, `${cc} ${v} min`);
    near(s.max, Math.max(...xs), 1e-12, `${cc} ${v} max`);
    ok(s.n === xs.length, `${cc} ${v} valid count`);
  }
}
ok(N.POINTS.IN.missing.ALLSKY_SFC_SW_DWN === 2, "India ALLSKY has exactly 2 missing days recorded as null");
ok(Object.values(N.POINTS.EG.missing).every((x) => x === 0), "Egypt has no missing values");

console.log("• cross-checks against the pandas audit");
near(N.stat("EG", "T2M").mean, 22.04, 0.01, "Egypt mean T2M");
near(N.stat("IN", "T2M").mean, 24.66, 0.01, "India mean T2M");
near(N.stat("EG", "GWETROOT").mean, 0.60, 0.01, "Egypt mean GWETROOT");
near(N.stat("IN", "PRECTOTCORR").mean, 3.36, 0.01, "India mean PRECTOTCORR");
near(N.stat("IN", "T2M_MAX").max, 47.12, 0.001, "India max T2M_MAX");

console.log("• common period");
const cp = N.commonPeriod();
ok(N.iso(cp.startMs) === "2021-01-01" && N.iso(cp.endMs) === "2026-03-14", `common period is ${N.iso(cp.startMs)}→${N.iso(cp.endMs)}`);
ok(N.stat("IN", "T2M", "common").days === 1899 && N.stat("EG", "T2M", "common").days === 1899, "both countries get 1899 days in the common period");
ok(N.stat("IN", "T2M", "common").mean !== N.stat("IN", "T2M", "full").mean, "India's common-period mean differs from its full-record mean");

console.log("• monthly / climatology / seasons");
const m = N.monthly("EG", "PRECTOTCORR", "full", "sum");
ok(m.length === 62 && m[0].label === "2021-01" && m.at(-1).label === "2026-02", `Egypt complete months: ${m.length} ${m[0]?.label}..${m.at(-1)?.label}`);
const mi = N.monthly("IN", "T2M", "full");
ok(mi.length === 70 && mi.at(-1).label === "2026-10", `India complete months: ${mi.length} ${mi.at(-1)?.label}`);
const clim = N.climatology("EG", "T2M");
ok(clim.length === 12 && clim.every((c) => c.value != null), "12 climatology months");
ok(clim[7].value > clim[1].value, "Egypt August is warmer than February");
const eg = csv(files.EG); const aug = eg.filter((r) => r.DATE.slice(5, 7) === "08" && r.DATE.slice(0, 4) !== "2026");
const perYear = {}; aug.forEach((r) => { const y = r.DATE.slice(0, 4); (perYear[y] ||= []).push(+r.T2M); });
const augMean = Object.values(perYear).map((a) => a.reduce((x, y) => x + y, 0) / a.length).reduce((x, y) => x + y, 0) / Object.keys(perYear).length;
near(clim[7].value, augMean, 1e-9, "Egypt August climatology matches independent calc");
const ann = N.annual("EG", "PRECTOTCORR");
ok(ann.length === 5 && ann[0].y === 2021 && ann.at(-1).y === 2025, `Egypt complete years: ${ann.map((a) => a.y)}`);
const wEG = N.seasons("EG", "W"), wIN = N.seasons("IN", "W"), sEG = N.seasons("EG", "S"), sIN = N.seasons("IN", "S");
ok(wEG.count === 4 && sEG.count === 5, `Egypt complete winter/summer windows: ${wEG.count}/${sEG.count}`);
ok(wIN.count === 5 && sIN.count === 6, `India complete winter/summer windows: ${wIN.count}/${sIN.count}`);
ok(N.seasons("IN", "W", "common").count === 4, "India winter windows in the common period: 4 (2025/26 window is incomplete)");
ok(wEG.list.every((s) => s.days === 181 || s.days === 182), "winter windows have 181/182 days");
const r30 = N.recent("EG", "PRECTOTCORR", 30);
ok(r30.baselineYears === 5 && r30.cur >= 0, `recent() uses ${r30.baselineYears} baseline years`);

console.log("• geometry");
const c = N.merraCell(31.3264, 31.1517);
ok(c.latMin === 31.25 && c.latMax === 31.75 && Math.abs(c.lonMin - 30.9375) < 1e-9 && Math.abs(c.lonMax - 31.5625) < 1e-9, "Egypt point sits in MERRA-2 cell 31.25–31.75N × 30.94–31.56E");
ok(31.3264 >= c.latMin && 31.3264 <= c.latMax && 31.1517 >= c.lonMin && 31.1517 <= c.lonMax, "point lies inside its cell");
near(N.distKm(0, 0, 0, 1), 111.19, 0.05, "1° of longitude at the equator");
// hand check: dLat 0.5364° = 59.64 km, dLon 0.1517° x 95.28 km/° = 14.45 km → sqrt(59.64² + 14.45²) = 61.37 km
near(N.distKm(30.79, 31.0, 31.3264, 31.1517), 61.37, 0.05, "(30.79N,31.0E) → Egypt data point distance");

console.log("• routes / navigation consistency (source scan)");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const ctx = read("src/app-context.jsx"), shell = read("src/components/Shell.jsx"), main = read("src/main.jsx");
const routes = JSON.parse(ctx.match(/export const ROUTES = (\[.*?\]);/)[1]);
const navRoutes = [...shell.matchAll(/r: "(\w+)"/g)].map((x) => x[1]);
ok(!routes.includes("brand") && !/Brand/.test(main) && !/r: "brand"|go\("brand"\)/.test(shell), "Brand & Design System page removed from routes and navigation");
ok(!fs.existsSync(path.join(ROOT, "src/pages/Brand.jsx")), "Brand.jsx page file removed");
ok(navRoutes.every((r) => routes.includes(r)), `every nav item is a route: ${navRoutes}`);
ok(/Wordmark/.test(shell) && /Emblem/.test(shell), "Logo components still used in the shell");
const pages = [...main.matchAll(/(\w+): (\w+),?/g)];
for (const r of routes.filter((r) => !["intro", "welcome"].includes(r))) ok(new RegExp(`\\b${r}:`).test(main), `route "${r}" has a page in main.jsx`);
for (const f of fs.readdirSync(path.join(ROOT, "src/pages")).map((x) => path.join("src/pages", x))) {
  const s = read(f);
  for (const m of s.matchAll(/go\("(\w+)"\)/g)) ok(routes.includes(m[1]), `${f}: go("${m[1]}") targets a real route`);
  for (const m of s.matchAll(/media\/[\w.-]+/g)) ok(fs.existsSync(path.join(ROOT, "public", m[0])), `${f}: ${m[0]} exists`);
}
for (const m of read("src/data.js").matchAll(/"(media\/[\w.-]+)"/g)) ok(fs.existsSync(path.join(ROOT, "public", m[1])), `data.js: ${m[1]} exists`);

console.log("• planner scenario analysis & crop profiles");
const tmpData = path.join(os.tmpdir(), `sopdet-data-${process.pid}.mjs`);
await build({ entryPoints: [path.join(ROOT, "src/data.js")], bundle: true, format: "esm", outfile: tmpData, logLevel: "silent" });
const D = await import(pathToFileURL(tmpData).href);
const rCurEG = D.analyzeScenario("EG", ["wheat", "maize", "wheat", "maize"], "W", 4200);
ok(rCurEG.waterComplete === true && rCurEG.mm === 480 + 650 + 480 + 650, `EG default current mm = ${rCurEG.mm}`);
ok(rCurEG.off === 0 && rCurEG.rep === 3, `EG default current rules: off=${rCurEG.off}, rep=${rCurEG.rep}`);
const rOffEG = D.analyzeScenario("EG", ["rice", "maize", "wheat", "cotton"], "W", 4200);
ok(rOffEG.off === 1 && rOffEG.rep === 1, `EG off-season check: off=${rOffEG.off}, rep=${rOffEG.rep}`);
// Missing water value in one slot must NOT produce a partial sum as 4-season total
const savedWheat = D.PROFILES.EG.wheat.irrigationMm;
D.PROFILES.EG.wheat.irrigationMm = null;
const rIncomplete = D.analyzeScenario("EG", ["wheat", "maize", "wheat", "maize"], "W", 4200);
ok(rIncomplete.waterComplete === false && rIncomplete.waterKnownCount === 2 && rIncomplete.mm === null && rIncomplete.m3PerUnit === null, "incomplete water data yields waterComplete=false and mm=null (no partial sum)");
D.PROFILES.EG.wheat.irrigationMm = savedWheat;

fs.rmSync(tmp, { force: true });
fs.rmSync(tmpData, { force: true });
console.log(`\n${failed ? "FAILED" : "PASSED"}: ${passed} checks passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
