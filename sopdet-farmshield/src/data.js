/*
 * App constants and the crop catalogue.
 *
 * NOTHING in this file is a measurement. The 8 crops and their numbers come from data/nasa/crop_profiles_clean.csv,
 * which has no source, unit definition or method for any numeric column, so every number taken from it is shown
 * as "unverified". The old demo attributes (soil / productivity / risk / market scores, NDVI, SMAP, random series)
 * were invented and have been removed.
 */
import CPRAW from "./data/crop-profiles.json";

export const MEDIA = {
  ancient: "media/01-ancient-egypt.mp4",
  star: "media/02-sopdet-star.mp4",
  recedes: "media/03-nile-recedes.jpg",
  today: "media/04-nile-today.jpg",
  space: "media/05-from-earth-to-space.jpg",
  fields: "media/crop-fields.jpg",
  soil: "media/crop-soil.jpg",
  wheat: "media/crop-wheat.jpg",
  canal: "media/crop-canal.jpg",
  palms: "media/crop-palms.jpg",
  village: "media/crop-village.jpg",
  flood: "media/crop-flood.jpg",
  shaduf: "media/crop-shaduf.jpg",
  sunrise: "media/crop-sunrise.jpg",
  delta: "media/crop-delta.jpg",
  satellite: "media/crop-satellite.jpg",
};
export const img = (k) => `url(${MEDIA[k]})`;

/* Botanical family is taxonomy (not a model output). Used only for the "same family back-to-back" rule check. */
export const FAMILY = {
  Poaceae: { en: "grass / cereal family (Poaceae)", ar: "الفصيلة النجيلية – الحبوب (Poaceae)" },
  Solanaceae: { en: "nightshade family (Solanaceae)", ar: "الفصيلة الباذنجانية (Solanaceae)" },
  Amaranthaceae: { en: "amaranth family (Amaranthaceae)", ar: "الفصيلة الرمرامية (Amaranthaceae)" },
  Brassicaceae: { en: "mustard family (Brassicaceae)", ar: "الفصيلة الصليبية (Brassicaceae)" },
  Malvaceae: { en: "mallow family (Malvaceae)", ar: "الفصيلة الخبازية (Malvaceae)" },
};
export const CROPS = {
  wheat:     { en: "Wheat",      ar: "قمح",         fam: "Poaceae",       color: "#a8832f" },
  rice:      { en: "Rice",       ar: "أرز",         fam: "Poaceae",       color: "#6c8f7a" },
  maize:     { en: "Maize",      ar: "ذرة شامية",   fam: "Poaceae",       color: "#c0892f" },
  potato:    { en: "Potato",     ar: "بطاطس",       fam: "Solanaceae",    color: "#8a6a45" },
  sugarbeet: { en: "Sugar beet", ar: "بنجر السكر",  fam: "Amaranthaceae", color: "#a56a7a" },
  barley:    { en: "Barley",     ar: "شعير",        fam: "Poaceae",       color: "#9a8440" },
  mustard:   { en: "Mustard",    ar: "خردل",        fam: "Brassicaceae",  color: "#55693a" },
  cotton:    { en: "Cotton",     ar: "قطن",         fam: "Malvaceae",     color: "#9b8f78" },
};
export const CROP_KEYS = Object.keys(CROPS);
const NAME_TO_KEY = { Wheat: "wheat", Rice: "rice", Maize: "maize", Potato: "potato", "Sugar Beet": "sugarbeet", Barley: "barley", Mustard: "mustard", Cotton: "cotton" };
const SEASON_TYPE = { Winter: "W", Rabi: "W", Summer: "S", Kharif: "S" };
const CC = { Egypt: "EG", India: "IN" };
const finiteNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Team-provided crop profile, per country. verified:false for every number. */
export const PROFILES = {};
for (const r of CPRAW.rows) {
  const cc = CC[r.country], k = NAME_TO_KEY[r.crop];
  if (!cc || !k) continue;
  (PROFILES[cc] ||= {})[k] = {
    season: SEASON_TYPE[r.season] ?? null,
    seasonName: r.season,
    suitabilityIndex: finiteNum(r.suitabilityIndex),
    yieldTHa: finiteNum(r.baseYieldTHa),
    irrigationMm: finiteNum(r.irrigationMm),
    region: r.region,
  };
}
export const profileOf = (cc, k) => PROFILES[cc]?.[k] ?? null;
export const CROP_PROFILE_NOTE = CPRAW.note;

/* Only these two countries have data files. Selecting one switches every statistic and chart. */
export const COUNTRIES = {
  EG: { en: "Egypt", ar: "مصر", place: { en: "El-Hamoul, Kafr El-Sheikh", ar: "الحمول، كفر الشيخ" }, seasons: { W: { en: "Winter", ar: "شتوي" }, S: { en: "Summer", ar: "صيفي" } } },
  IN: { en: "India", ar: "الهند", place: { en: "Ludhiana, Punjab", ar: "لوديانا، البنجاب" }, seasons: { W: { en: "Rabi (winter)", ar: "رابي (شتوي)" }, S: { en: "Kharif (summer)", ar: "كاريف (صيفي)" } } },
};
export const COUNTRY_KEYS = Object.keys(COUNTRIES);

export const AREA_UNITS = [
  { k: "feddan", en: "feddan", ar: "فدان", m2: 4200 },
  { k: "hectare", en: "hectare", ar: "هكتار", m2: 10000 },
  { k: "acre", en: "acre", ar: "أكر (acre)", m2: 4047 },
];
export const SOILS = [
  ["clay", "Clay", "طينية"], ["silty-clay", "Silty clay", "طينية غرينية"], ["loam", "Loam", "طميية"],
  ["sandy-loam", "Sandy loam", "رملية طميية"], ["sandy", "Sandy", "رملية"], ["calcareous", "Calcareous", "جيرية"],
];

export const DEFAULT_FARM = {
  country: "EG", lat: null, lon: null,
  area: 12, unit: "feddan",
  current: "wheat", previous: "maize", season: "W",
  soil: "silty-clay", // null → "I don't know"
  ph: null, ec: null, om: null,
  isSample: true, // true until the person saves Farm Setup; the UI labels sample inputs as such
};

/* Season slots of the planner: alternating winter/summer, starting with the farm's season. */
export const slotTypes = (start) => (start === "S" ? ["S", "W", "S", "W"] : ["W", "S", "W", "S"]);

/* Example scenarios. They are starting points to edit, not suggestions. */
export const DEFAULT_SCENARIOS = {
  current: ["wheat", "maize", "wheat", "maize"],
  A: ["potato", "maize", "wheat", "cotton"],
  B: ["mustard", "rice", "sugarbeet", "maize"],
};

/**
 * Rule checks on a scenario. This is arithmetic and lookups on (a) the team crop profile and (b) botanical taxonomy.
 * It is NOT an agronomic model: it produces no score, no yield, no ranking and no recommendation.
 * If any slot is missing an irrigation value, `waterComplete` is false and `mm` is null (never a partial sum).
 */
export function analyzeScenario(cc, seq, startSeason, unitM2) {
  const types = slotTypes(startSeason);
  const flags = [];
  let off = 0, rep = 0;
  const slots = seq.map((k, i) => {
    const pr = profileOf(cc, k);
    const cropMeta = CROPS[k];
    const offSeason = Boolean(pr && pr.season && pr.season !== types[i]);
    const sameFamilyAsPrev = Boolean(i > 0 && cropMeta && CROPS[seq[i - 1]] && cropMeta.fam === CROPS[seq[i - 1]].fam);
    if (offSeason) { flags.push({ i, type: "season" }); off++; }
    if (sameFamilyAsPrev) { flags.push({ i, type: "family" }); rep++; }
    return {
      index: i,
      crop: k,
      seasonType: types[i],
      profile: pr,
      offSeason,
      sameFamilyAsPrev,
      family: cropMeta?.fam ?? null,
    };
  });

  const perSlotMm = slots.map((s) => finiteNum(s.profile?.irrigationMm));
  const validWater = perSlotMm.filter((x) => x != null);
  const waterKnownCount = validWater.length;
  const waterComplete = seq.length > 0 && waterKnownCount === seq.length;
  const mm = waterComplete ? validWater.reduce((a, x) => a + x, 0) : null;
  const partialMm = waterKnownCount > 0 ? validWater.reduce((a, x) => a + x, 0) : null;
  const validUnitM2 = typeof unitM2 === "number" && Number.isFinite(unitM2) ? unitM2 : null;
  const m3PerUnit = mm != null && validUnitM2 != null ? (mm * validUnitM2) / 1000 : null;

  return {
    types, flags, slots, off, rep,
    pairs: Math.max(0, seq.length - 1),
    crops: new Set(seq).size,
    families: new Set(seq.map((k) => CROPS[k]?.fam).filter(Boolean)).size,
    cereal: seq.filter((k) => CROPS[k]?.fam === "Poaceae").length,
    perSlotMm,
    waterKnownCount,
    waterComplete,
    mm,
    partialMm,
    m3PerUnit, // 1 mm of water over 1 m² = 1 litre → mm × m² / 1000 = m³
  };
}

export const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export const month = (i, lang) => (lang === "ar" ? MONTHS_AR : MONTHS_EN)[((i % 12) + 12) % 12];

/* Human names for the 9 NASA POWER variables. Units and source products come from the file headers (VAR_META in nasa.js). */
export const VAR_LABEL = {
  T2M: { en: "Air temperature (2 m)", ar: "درجة حرارة الهواء (2 م)" },
  T2M_MAX: { en: "Daily maximum temperature (2 m)", ar: "درجة الحرارة العظمى اليومية (2 م)" },
  T2M_MIN: { en: "Daily minimum temperature (2 m)", ar: "درجة الحرارة الصغرى اليومية (2 م)" },
  RH2M: { en: "Relative humidity (2 m)", ar: "الرطوبة النسبية (2 م)" },
  WS2M: { en: "Wind speed (2 m)", ar: "سرعة الرياح (2 م)" },
  ALLSKY_SFC_SW_DWN: { en: "Surface solar radiation, all-sky", ar: "الإشعاع الشمسي على السطح (سماء كاملة)" },
  GWETTOP: { en: "Surface soil wetness", ar: "رطوبة التربة السطحية" },
  GWETROOT: { en: "Root-zone soil wetness", ar: "رطوبة منطقة الجذور" },
  PRECTOTCORR: { en: "Precipitation (corrected)", ar: "الهطول المصحَّح (الأمطار)" },
};
