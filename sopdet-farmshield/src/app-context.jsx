import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { DEFAULT_FARM, DEFAULT_SCENARIOS, CROPS, COUNTRIES, AREA_UNITS } from "./data.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export const ROUTES = ["intro", "welcome", "setup", "dashboard", "insights", "guide", "planner", "expert", "map", "sources"];

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/* Empty hash → intro (first visit). Unknown hash (old bookmark such as #brand) → dashboard. */
function readHash() {
  const h = (typeof location !== "undefined" ? location.hash : "").replace("#", "");
  if (!h) return "intro";
  return ROUTES.includes(h) ? h : "dashboard";
}

/* Stored values are validated, so a stale or edited localStorage entry can never crash the app. */
function loadFarm() {
  try {
    const f = JSON.parse(store.get("sf-farm", "null"));
    if (!f || typeof f !== "object") return DEFAULT_FARM;
    /* a missing field falls back to the default; an explicit null means "I don't know"; anything else must be valid */
    const crop = (k) => (f[k] === undefined || (f[k] !== null && !(f[k] in CROPS)) ? DEFAULT_FARM[k] : f[k]);
    const validNum = (v, min = -Infinity, max = Infinity) =>
      v === null || (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max);
    return {
      ...DEFAULT_FARM, ...f,
      country: f.country in COUNTRIES ? f.country : DEFAULT_FARM.country,
      area: f.area === undefined || !validNum(f.area, 0) ? DEFAULT_FARM.area : f.area,
      lat: f.lat === undefined || !validNum(f.lat, -90, 90) ? DEFAULT_FARM.lat : f.lat,
      lon: f.lon === undefined || !validNum(f.lon, -180, 180) ? DEFAULT_FARM.lon : f.lon,
      current: crop("current"), previous: crop("previous"),
      unit: AREA_UNITS.some((u) => u.k === f.unit) ? f.unit : DEFAULT_FARM.unit,
      season: f.season === undefined || (f.season !== null && f.season !== "W" && f.season !== "S") ? DEFAULT_FARM.season : f.season,
    };
  } catch { return DEFAULT_FARM; }
}
function loadScen() {
  try {
    const s = JSON.parse(store.get("sf-scen", "null"));
    const good = s && ["current", "A", "B"].every((k) => Array.isArray(s[k]) && s[k].length === 4 && s[k].every((c) => c in CROPS));
    return good ? s : DEFAULT_SCENARIOS;
  } catch { return DEFAULT_SCENARIOS; }
}

export function AppProvider({ children }) {
  const [route, setRoute] = useState(readHash);
  const [lang, setLangState] = useState(() => (store.get("sf-lang", "en") === "ar" ? "ar" : "en"));
  const [mode, setModeState] = useState(() => (store.get("sf-mode", "farmer") === "expert" ? "expert" : "farmer"));
  const [farm, setFarmState] = useState(loadFarm);
  const [scen, setScenState] = useState(loadScen);
  const [period, setPeriod] = useState("full"); // "full" = whole record of the selected country, "common" = Egypt∩India overlap
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    const on = () => { setRoute(readHash()); setSourcesOpen(false); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((r) => { if (location.hash !== "#" + r) location.hash = r; else window.scrollTo(0, 0); }, []);
  const setLang = (l) => { setLangState(l); store.set("sf-lang", l); };
  const setMode = (m) => { setModeState(m); store.set("sf-mode", m); };
  const setFarm = useCallback((u) => setFarmState((f) => { const n = typeof u === "function" ? u(f) : u; store.set("sf-farm", JSON.stringify(n)); return n; }), []);
  const setScen = useCallback((u) => setScenState((s) => { const n = typeof u === "function" ? u(s) : u; store.set("sf-scen", JSON.stringify(n)); return n; }), []);
  const setCountry = useCallback((c) => setFarm((f) => (f.country === c ? f : { ...f, country: c })), [setFarm]);

  const ar = lang === "ar";
  const t = useCallback((en, a) => (ar ? a ?? en : en), [ar]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? "rtl" : "ltr";
  }, [lang, ar]);

  const value = useMemo(() => ({ route, go, lang, ar, setLang, mode, setMode, t, farm, setFarm, scen, setScen, cc: farm.country, setCountry, period, setPeriod, sourcesOpen, setSourcesOpen }),
    [route, go, lang, ar, mode, t, farm, scen, period, sourcesOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
