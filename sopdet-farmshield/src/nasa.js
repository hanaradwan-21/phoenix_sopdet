/*
 * Computation layer over the real NASA POWER daily data (src/data/nasa-power.json).
 * Everything here is plain arithmetic on the data files. No model, no estimation, no imputation.
 * Missing days (null) are skipped, never replaced by zero or by an average.
 */
import RAW from "./data/nasa-power.json";

const DAY = 86400000;
export const VARS = ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN", "GWETTOP", "GWETROOT", "PRECTOTCORR"];
export const VAR_META = RAW.variables; // { source, name, unit } read from the NASA POWER file headers

const ms = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const iso = (x) => new Date(x).toISOString().slice(0, 10);

export const POINTS = Object.fromEntries(Object.entries(RAW.points).map(([k, p]) => [k, { ...p, key: k, startMs: ms(p.start), endMs: ms(p.end) }]));
export const point = (cc) => POINTS[cc] ?? POINTS.EG;
export const dateAt = (p, i) => p.startMs + i * DAY;
export const indexOf = (p, t) => Math.round((t - p.startMs) / DAY);

/** The period where BOTH points have data. Use it for any fair Egypt-vs-India comparison. */
export function commonPeriod() {
  const ps = Object.values(POINTS);
  return { startMs: Math.max(...ps.map((p) => p.startMs)), endMs: Math.min(...ps.map((p) => p.endMs)) };
}
export function periodFor(cc, mode = "full") {
  const p = point(cc);
  return mode === "common" ? commonPeriod() : { startMs: p.startMs, endMs: p.endMs };
}
/** index range [i0, i1] of point p inside period per */
function range(p, per) {
  return [Math.max(0, indexOf(p, per.startMs)), Math.min(p.n - 1, indexOf(p, per.endMs))];
}

export function agg(p, v, i0, i1) {
  const a = p.data[v]; let sum = 0, n = 0, mn = Infinity, mx = -Infinity, imn = -1, imx = -1;
  for (let i = i0; i <= i1; i++) { const x = a[i]; if (x == null) continue; sum += x; n++; if (x < mn) { mn = x; imn = i; } if (x > mx) { mx = x; imx = i; } }
  return { n, days: i1 - i0 + 1, sum, mean: n ? sum / n : null, min: n ? mn : null, max: n ? mx : null, iMin: imn, iMax: imx };
}
/** Whole-period statistics of one variable */
export function stat(cc, v, mode = "full") {
  const p = point(cc); const [i0, i1] = range(p, periodFor(cc, mode)); return { ...agg(p, v, i0, i1), i0, i1 };
}

const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** Calendar months fully inside the period. how: "mean" | "sum" */
export function monthly(cc, v, mode = "full", how = "mean") {
  const p = point(cc), per = periodFor(cc, mode), out = [];
  const s = new Date(per.startMs), e = new Date(per.endMs);
  for (let y = s.getUTCFullYear(), m = s.getUTCMonth(); y < e.getUTCFullYear() || (y === e.getUTCFullYear() && m <= e.getUTCMonth()); m++) {
    if (m > 11) { m = 0; y++; }
    const a = Date.UTC(y, m, 1), b = Date.UTC(y, m, daysIn(y, m));
    if (a < per.startMs || b > per.endMs) { if (m === 11 && y >= e.getUTCFullYear()) break; continue; }
    const g = agg(p, v, indexOf(p, a), indexOf(p, b));
    out.push({ y, m, label: `${y}-${String(m + 1).padStart(2, "0")}`, value: how === "sum" ? g.sum : g.mean, n: g.n, days: g.days });
  }
  return out;
}

/** Average by calendar month (Jan..Dec) over the complete months in the period. */
export function climatology(cc, v, mode = "full", how = "mean") {
  const ms_ = monthly(cc, v, mode, how);
  return Array.from({ length: 12 }, (_, m) => {
    const xs = ms_.filter((r) => r.m === m && r.value != null);
    return { m, value: xs.length ? xs.reduce((a, r) => a + r.value, 0) / xs.length : null, years: xs.length };
  });
}

/** Complete calendar years (Jan 1 – Dec 31) inside the period. */
export function annual(cc, v, mode = "full", how = "sum") {
  const p = point(cc), per = periodFor(cc, mode), out = [];
  for (let y = new Date(per.startMs).getUTCFullYear(); y <= new Date(per.endMs).getUTCFullYear(); y++) {
    const a = Date.UTC(y, 0, 1), b = Date.UTC(y, 11, 31);
    if (a < per.startMs || b > per.endMs) continue;
    const g = agg(p, v, indexOf(p, a), indexOf(p, b));
    out.push({ y, value: how === "sum" ? g.sum : g.mean, n: g.n });
  }
  return out;
}

/* Illustrative calendar windows used ONLY to summarise NASA data by season. Real sowing dates differ. */
export const WINDOWS = { W: [10, 11, 0, 1, 2, 3], S: [4, 5, 6, 7, 8, 9] }; // 0-based months: Nov–Apr and May–Oct
export const WINDOW_TEXT = { W: { en: "Nov – Apr", ar: "نوفمبر – أبريل" }, S: { en: "May – Oct", ar: "مايو – أكتوبر" } };

/** Season instances that are completely inside the period, with their NASA POWER summary. */
export function seasons(cc, type, mode = "full") {
  const p = point(cc), per = periodFor(cc, mode), out = [];
  const y0 = new Date(per.startMs).getUTCFullYear() - 1, y1 = new Date(per.endMs).getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    const a = type === "W" ? Date.UTC(y, 10, 1) : Date.UTC(y, 4, 1);
    const b = type === "W" ? Date.UTC(y + 1, 3, 30) : Date.UTC(y, 9, 31);
    if (a < per.startMs || b > per.endMs) continue;
    const i0 = indexOf(p, a), i1 = indexOf(p, b), g = (v) => agg(p, v, i0, i1);
    const rainAgg = g("PRECTOTCORR");
    out.push({ y, label: type === "W" ? `${y}/${String(y + 1).slice(2)}` : `${y}`, days: i1 - i0 + 1,
      t2m: g("T2M").mean, tmax: g("T2M_MAX").mean, tmin: g("T2M_MIN").mean, rh: g("RH2M").mean, ws: g("WS2M").mean,
      solar: g("ALLSKY_SFC_SW_DWN").mean, wetTop: g("GWETTOP").mean, wetRoot: g("GWETROOT").mean, rain: rainAgg.n > 0 ? rainAgg.sum : null });
  }
  const avg = (k) => {
    const xs = out.filter((r) => typeof r[k] === "number" && Number.isFinite(r[k]));
    return xs.length ? xs.reduce((a, r) => a + r[k], 0) / xs.length : null;
  };
  return { type, list: out, count: out.length,
    mean: out.length ? { t2m: avg("t2m"), tmax: avg("tmax"), tmin: avg("tmin"), rh: avg("rh"), ws: avg("ws"), solar: avg("solar"), wetTop: avg("wetTop"), wetRoot: avg("wetRoot"), rain: avg("rain") } : null };
}

/** The last `days` days of the file, and the same calendar window in the other years of the file. */
export function recent(cc, v, days = 30) {
  const p = point(cc), i1 = p.n - 1, i0 = i1 - days + 1;
  const cur = agg(p, v, i0, i1);
  const end = new Date(p.endMs), base = [];
  for (let y = new Date(p.startMs).getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
    if (y === end.getUTCFullYear()) continue;
    const b = Date.UTC(y, end.getUTCMonth(), Math.min(end.getUTCDate(), daysIn(y, end.getUTCMonth())));
    const a = b - (days - 1) * DAY;
    if (a < p.startMs || b > p.endMs) continue;
    base.push(agg(p, v, indexOf(p, a), indexOf(p, b)));
  }
  const key = v === "PRECTOTCORR" ? "sum" : "mean";
  const baseline = base.length ? base.reduce((s, g) => s + g[key], 0) / base.length : null;
  const values = p.data[v].slice(Math.max(0, i1 - 59), i1 + 1).map((x) => x ?? 0);
  return { cur: cur[key], baseline, baselineYears: base.length, diff: baseline == null ? null : cur[key] - baseline, from: dateAt(p, i0), to: dateAt(p, i1), spark: values };
}

/** Daily values for a chart (last N days). */
export function lastDays(cc, v, n = 90) { const p = point(cc); const a = p.data[v]; return { values: a.slice(-n).map((x) => x ?? 0), labels: Array.from({ length: Math.min(n, p.n) }, (_, k) => iso(dateAt(p, p.n - Math.min(n, p.n) + k)).slice(5)) }; }

/* ---------- geometry (real arithmetic, no data needed) ---------- */
export const toRad = (d) => (d * Math.PI) / 180;
export function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088, dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
/** Approximate MERRA-2 grid cell containing a point (0.5° lat x 0.625° lon, centres at -90+0.5j and -180+0.625k). */
export function merraCell(lat, lon) {
  const cLat = -90 + 0.5 * Math.round((lat + 90) / 0.5), cLon = -180 + 0.625 * Math.round((lon + 180) / 0.625);
  const kmNS = 0.5 * 111.32, kmEW = 0.625 * 111.32 * Math.cos(toRad(cLat));
  return { latMin: cLat - 0.25, latMax: cLat + 0.25, lonMin: cLon - 0.3125, lonMax: cLon + 0.3125, kmNS, kmEW, km2: kmNS * kmEW };
}
/** CERES SYN1deg is a 1° x 1° grid. */
export function ceresCell(lat) { const kmNS = 111.32, kmEW = 111.32 * Math.cos(toRad(lat)); return { kmNS, kmEW, km2: kmNS * kmEW }; }

export const fmt = (x, d = 1) => (x == null || Number.isNaN(x) ? "—" : Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
export const sign = (x, d = 1) => (x == null ? "—" : (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x), d));
