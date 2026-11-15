/*
 * Builds src/data/nasa-power.json and src/data/crop-profiles.json from the CSV files in data/nasa/.
 *
 *   node scripts/build-data.mjs
 *
 * What it does (and checks):
 *   1. Reads the cleaned daily files (egypt_weather_clean.csv, india_weather_clean.csv).
 *   2. Confirms weather_daily_clean.csv is exactly their union.
 *   3. Reads the ORIGINAL NASA POWER files and confirms the cleaned files match them value-for-value
 *      (so "clean" never silently changed a number). Variable names, units and source products are read
 *      from the raw POWER header, not typed by hand.
 *   4. Verifies the daily series is contiguous, has no duplicates, and records missing values as null.
 *   5. Reads crop_profiles_clean.csv, confirms it is identical to crop_profiles.csv, and marks every
 *      row as unverified (no source/units/definition is provided for any of its numbers).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "data", "nasa");
const OUT = path.join(ROOT, "src", "data");
fs.mkdirSync(OUT, { recursive: true });

const VARS = ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN", "GWETTOP", "GWETROOT", "PRECTOTCORR"];
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8").replace(/\r/g, "");
const fail = (m) => { console.error("DATA ERROR: " + m); process.exit(1); };

function parseCsv(text) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const head = lines[0].split(",");
  return lines.slice(1).map((l) => { const c = l.split(","); return Object.fromEntries(head.map((h, i) => [h, c[i]])); });
}
const num = (s) => (s === undefined || s === "" || s === "NaN" ? null : Number(s));

/* ---- raw NASA POWER file: header metadata + body ---- */
function parseRaw(file) {
  const t = read(file);
  const [header, body] = t.split("-END HEADER-");
  const hl = header.split("\n");
  const dates = hl.find((l) => l.startsWith("Dates"));
  const loc = hl.find((l) => l.startsWith("Location"));
  const elev = hl.find((l) => l.startsWith("elevation"));
  const miss = hl.find((l) => l.includes("missing source data"));
  const vars = {};
  for (const l of hl) {
    const m = l.match(/^(\w+)\s+(MERRA-2|CERES SYN1deg)\s+(.*?)\s+\(([^)]*)\)\s*$/);
    if (m && VARS.includes(m[1])) vars[m[1]] = { source: m[2], name: m[3].trim(), rawUnit: m[4] };
  }
  const rows = parseCsv(body.trim());
  const byDate = new Map();
  for (const r of rows) {
    const d = new Date(Date.UTC(+r.YEAR, 0, 1) + (+r.DOY - 1) * 86400000).toISOString().slice(0, 10);
    byDate.set(d, Object.fromEntries(VARS.map((v) => [v, Number(r[v]) === -999 ? null : Number(r[v])])));
  }
  const ll = loc.match(/latitude\s+([\d.-]+)\s+longitude\s+([\d.-]+)/);
  const el = elev ? elev.match(/=\s*([\d.]+)\s*meters/) : null;
  return { dates: dates.replace("Dates (month/day/year): ", "").trim(), lat: +ll[1], lon: +ll[2], elevation: el ? +el[1] : null,
    missingFlag: miss ? "-999" : null, vars, byDate, nRows: rows.length };
}

const UNIT = { C: "°C", "%": "%", "m/s": "m/s", "MJ/m^2/day": "MJ/m²/day", "1": "1 (dimensionless, 0–1)", "mm/day": "mm/day" };

const POINTS = [
  { key: "EG", clean: "egypt_weather_clean.csv", raw: "POWER_Point_Daily_20210101_20260314_031d33N_031d15E_LST.csv" },
  { key: "IN", clean: "india_weather_clean.csv", raw: "POWER_Point_Daily_20210101_20261114_030d90N_076d00E_LST.csv" },
];

const out = { generatedBy: "scripts/build-data.mjs", variables: {}, points: {} };
const unionRows = [];
const audit = {};

for (const P of POINTS) {
  const rows = parseCsv(read(P.clean));
  const raw = parseRaw(P.raw);
  rows.sort((a, b) => (a.DATE < b.DATE ? -1 : 1));
  const meta = rows[0];
  for (const r of rows) if (r.Country !== meta.Country || r.Region !== meta.Region || r.Latitude !== meta.Latitude || r.Longitude !== meta.Longitude) fail(`${P.clean}: more than one location`);
  if (Math.abs(raw.lat - +meta.Latitude) > 1e-4 || Math.abs(raw.lon - +meta.Longitude) > 1e-4) fail(`${P.clean}: coordinates differ from raw header`);

  // contiguity + duplicates
  const start = rows[0].DATE, end = rows[rows.length - 1].DATE;
  const n = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  if (n !== rows.length) fail(`${P.clean}: not contiguous (${rows.length} rows for ${n} days)`);
  const seen = new Set(); for (const r of rows) { if (seen.has(r.DATE)) fail("duplicate date " + r.DATE); seen.add(r.DATE); }

  // value-for-value vs raw
  let diffs = 0;
  for (const r of rows) { const rv = raw.byDate.get(r.DATE); if (!rv) fail("date not in raw: " + r.DATE); for (const v of VARS) { const a = num(r[v]); if (a !== rv[v]) diffs++; } }
  if (diffs) fail(`${P.clean}: ${diffs} values differ from the raw NASA file`);

  const data = {}; const missing = {}; const flat = {};
  for (const v of VARS) {
    data[v] = rows.map((r) => num(r[v]));
    missing[v] = data[v].filter((x) => x === null).length;
    let best = 1, run = 1; for (let i = 1; i < data[v].length; i++) { run = data[v][i] !== null && data[v][i] === data[v][i - 1] ? run + 1 : 1; if (run > best) best = run; }
    flat[v] = best;
    if (raw.vars[v]) out.variables[v] = { source: raw.vars[v].source, name: raw.vars[v].name, unit: UNIT[raw.vars[v].rawUnit] ?? raw.vars[v].rawUnit };
  }
  const rawDroppedTrailing = raw.nRows - rows.length;
  out.points[P.key] = {
    country: meta.Country, region: meta.Region, lat: +meta.Latitude, lon: +meta.Longitude,
    elevation_m: raw.elevation, start, end, n, missing, longestConstantRun: flat,
    rawFileDates: raw.dates, rawRows: raw.nRows, rawRowsDroppedByCleaning: rawDroppedTrailing, data,
  };
  audit[P.key] = { rows: rows.length, start, end, missing, rawRows: raw.nRows, rawDropped: rawDroppedTrailing, longestConstantRun: flat };
  for (const r of rows) unionRows.push(`${r.Country}|${r.Region}|${r.DATE}|${VARS.map((v) => r[v]).join(",")}`);
}

// weather_daily_clean.csv must be exactly the union
const combined = parseCsv(read("weather_daily_clean.csv")).map((r) => `${r.Country}|${r.Region}|${r.DATE}|${VARS.map((v) => r[v]).join(",")}`);
if (combined.length !== unionRows.length || [...combined].sort().join("\n") !== [...unionRows].sort().join("\n")) fail("weather_daily_clean.csv is not the union of the two country files");

/* ---- crop profiles ---- */
const cp = read("crop_profiles.csv"), cpc = read("crop_profiles_clean.csv");
if (cp.trim() !== cpc.trim()) fail("crop_profiles.csv and crop_profiles_clean.csv differ");
const crops = parseCsv(cpc).map((r) => ({
  country: r.Country, region: r.Region, crop: r.Crop_Name, season: r.Season,
  suitabilityIndex: +r.Suitability_Index, baseYieldTHa: +r.Base_Yield_Tons_Ha, irrigationMm: +r.Irrigation_Requirement_mm,
}));
const cropOut = {
  verified: false,
  note: "No source, unit definition or method is provided for any numeric column. Treated as unverified team-provided inputs.",
  columns: { suitabilityIndex: "Suitability_Index (scale and method unknown)", baseYieldTHa: "Base_Yield_Tons_Ha (assumed t/ha, source unknown)", irrigationMm: "Irrigation_Requirement_mm (gross vs net, source unknown)" },
  rows: crops,
};

fs.writeFileSync(path.join(OUT, "nasa-power.json"), JSON.stringify(out));
fs.writeFileSync(path.join(OUT, "crop-profiles.json"), JSON.stringify(cropOut, null, 1));
fs.writeFileSync(path.join(ROOT, "data", "audit.json"), JSON.stringify({ audit, crops: crops.length }, null, 1));
console.log("OK  nasa-power.json  " + (fs.statSync(path.join(OUT, "nasa-power.json")).size / 1024).toFixed(0) + " KB");
for (const k of Object.keys(audit)) console.log(`    ${k}: ${audit[k].rows} days ${audit[k].start} → ${audit[k].end}; missing ${JSON.stringify(Object.fromEntries(Object.entries(audit[k].missing).filter(([, v]) => v)))}; raw rows dropped by cleaning: ${audit[k].rawDropped}`);
console.log("OK  crop-profiles.json  " + crops.length + " rows (all unverified)");
