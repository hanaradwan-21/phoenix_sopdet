import React from "react";
import { useApp } from "../app-context.jsx";
import { CROPS, COUNTRIES, COUNTRY_KEYS } from "../data.js";
import * as NASA from "../nasa.js";
import { periodFor, iso } from "../nasa.js";
import Icon from "./Icon.jsx";

/** Marks a value that is only a sample/illustration. Used sparingly: sample farm inputs and illustrative pictures. */
export function Demo({ dark, children }) {
  const { t } = useApp();
  return <span className={`demo ${dark ? "on-dark" : ""}`} title={t("Illustrative sample. Not a real measurement.", "عيّنة توضيحية. ليست قياسًا حقيقيًا.")}>{children ?? t("Sample", "تجريبي")}</span>;
}

export function PageHead({ eyebrow, title, lead, right }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
      <div className="page-head">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {right}
    </div>
  );
}

export function LangSwitch({ dark }) {
  const { lang, setLang } = useApp();
  return (
    <div className={`seg ${dark ? "dark" : ""}`} role="group" aria-label="Language">
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button aria-pressed={lang === "ar"} onClick={() => setLang("ar")} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>عربي</button>
    </div>
  );
}

export function ModeSwitch({ dark }) {
  const { mode, setMode, t } = useApp();
  return (
    <div className={`seg ${dark ? "dark" : ""}`} role="group" aria-label={t("Mode", "الوضع")}>
      <button aria-pressed={mode === "farmer"} onClick={() => setMode("farmer")}><Icon name="sprout" size={15} style={{ marginInlineEnd: 6, verticalAlign: -2 }} />{t("Farmer", "مزارع")}</button>
      <button aria-pressed={mode === "expert"} onClick={() => setMode("expert")}><Icon name="flask" size={15} style={{ marginInlineEnd: 6, verticalAlign: -2 }} />{t("Expert", "خبير")}</button>
    </div>
  );
}

/** Egypt / India. Switching it changes the NASA POWER series, statistics and charts everywhere. */
export function CountrySwitch({ dark }) {
  const { cc, setCountry, ar, t } = useApp();
  return (
    <div className={`seg ${dark ? "dark" : ""}`} role="group" aria-label={t("Country (selects the NASA POWER data point)", "الدولة (تحدد نقطة بيانات NASA POWER)")}>
      {COUNTRY_KEYS.map((k) => <button key={k} aria-pressed={cc === k} onClick={() => setCountry(k)}><Icon name="globe" size={14} style={{ marginInlineEnd: 5, verticalAlign: -2 }} />{ar ? COUNTRIES[k].ar : COUNTRIES[k].en}</button>)}
    </div>
  );
}

/** Full record of the selected country, or the overlap shared by both countries (the fair comparison window). */
export function PeriodSwitch() {
  const { cc, period, setPeriod, t } = useApp();
  const f = periodFor(cc, "full"), c = periodFor(cc, "common");
  const rng = (p) => `${iso(p.startMs)} → ${iso(p.endMs)}`;
  return (
    <div className="chips" role="group" aria-label={t("Analysis period", "فترة التحليل")}>
      <button className="chip" aria-pressed={period === "full"} onClick={() => setPeriod("full")}>{t("Full record", "السجل الكامل")} <span className="mono tip" style={{ color: "inherit", opacity: .75 }}>{rng(f)}</span></button>
      <button className="chip" aria-pressed={period === "common"} onClick={() => setPeriod("common")}>{t("Common period (Egypt ∩ India)", "الفترة المشتركة (مصر ∩ الهند)")} <span className="mono tip" style={{ color: "inherit", opacity: .75 }}>{rng(c)}</span></button>
    </div>
  );
}

export function CropName({ k }) {
  const { ar } = useApp();
  return <>{ar ? CROPS[k].ar : CROPS[k].en}</>;
}

/** Crop sequence rail: one block per season slot. labels = [{en, ar}], optional subtitles = [{en, ar}], flags from analyzeScenario(). */
export function CropSeq({ seq, flags = [], labels, subtitles, nowIndex = -1 }) {
  const { ar, t } = useApp();
  return (
    <div className="seq" dir={ar ? "rtl" : "ltr"}>
      {seq.map((k, i) => {
        const fl = flags.filter((f) => f.i === i);
        const sub = subtitles?.[i] ? (ar ? subtitles[i].ar : subtitles[i].en) : null;
        return (
          <div className={`s ${i === nowIndex ? "now" : ""}`} key={i} style={{ background: CROPS[k].color }}>
            <small>{labels[i] ? (ar ? labels[i].ar : labels[i].en) : ""}</small>
            <b>{ar ? CROPS[k].ar : CROPS[k].en}</b>
            {sub && <small style={{ opacity: 0.92 }}>{sub}</small>}
            {fl.some((f) => f.type === "season") && <span className="flag">{t("off-season per profile", "خارج الموسم حسب الملف")}</span>}
            {fl.some((f) => f.type === "family") && <span className="flag">{t("same family as previous", "نفس فصيلة السابق")}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function Meter({ value, color }) {
  return <div className="meter" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></div>;
}

/* The four kinds of content in this app. Every number on screen belongs to exactly one. */
export const TYPE_COLORS = { nasa: "#3c4a29", calc: "#a8832f", pred: "#b0553a", unv: "#8a7f69", none: "#c9bfa6" };
export function typeLabels(t) {
  return {
    nasa: t("NASA POWER data", "بيانات NASA POWER"),
    calc: t("Illustrative calculation", "حساب توضيحي"),
    pred: t("Prediction", "تنبؤ"),
    unv: t("Unverified input", "مُدخل غير متحقق منه"),
    none: t("Not integrated", "غير مدمج"),
  };
}
export function typeHelp(t) {
  return {
    nasa: t("Daily values from the NASA POWER files. Gridded reanalysis / satellite-derived products for one point, not a weather-station or field reading.", "قيم يومية من ملفات NASA POWER. منتجات شبكية (إعادة تحليل/مشتقة من الأقمار) لنقطة واحدة، وليست قراءة محطة أرصاد أو حقل."),
    calc: t("Plain arithmetic or rule checks on the data or on your inputs. Shows how numbers add up. Not a forecast and not advice.", "حساب مباشر أو فحص قواعد على البيانات أو مُدخلاتك. يوضح كيف تتجمع الأرقام. ليس توقعًا ولا نصيحة."),
    pred: t("Output of a trained and tested model. None is connected, so this app shows no predictions.", "مخرجات نموذج مدرَّب ومُختبَر. لا يوجد نموذج متصل، لذلك لا يعرض التطبيق أي تنبؤات."),
    unv: t("Numbers supplied by the team with no source, unit definition or method. Shown for reference only, never used as a result.", "أرقام قدّمها الفريق بلا مصدر أو تعريف وحدة أو منهج. تُعرض للاطلاع فقط ولا تُستخدم كنتيجة."),
    none: t("A data layer that is not in this project because no file was provided.", "طبقة بيانات غير موجودة في المشروع لعدم توفر ملف لها."),
  };
}
export function DataType({ k }) {
  const { t } = useApp();
  return <span className="type-chip" title={typeHelp(t)[k]}><i style={{ background: TYPE_COLORS[k] }} />{typeLabels(t)[k]}</span>;
}

export function Disclaimer() {
  const { t } = useApp();
  return (
    <div className="note">
      <Icon name="info" size={18} />
      <span>{t(
        "Student project, not affiliated with or endorsed by NASA. Climate values are real NASA POWER daily data for one point per country. Crop-profile numbers are team inputs that are not yet verified. Calculations are labelled illustrative. No machine-learning model is connected, so there are no predictions or recommendations.",
        "مشروع طلابي غير تابع لناسا ولا معتمد منها. القيم المناخية بيانات يومية حقيقية من NASA POWER لنقطة واحدة لكل دولة. أرقام ملف المحاصيل مُدخلات من الفريق لم يُتحقق منها بعد. الحسابات موسومة «توضيحية». لا يوجد نموذج تعلّم آلي متصل، لذلك لا توجد تنبؤات أو توصيات."
      )}</span>
    </div>
  );
}

export function SourcesLink({ label, dark }) {
  const { setSourcesOpen, t } = useApp();
  return <button className={`btn sm ${dark ? "dark" : "ghost"}`} onClick={() => setSourcesOpen(true)}><Icon name="book" size={15} />{label ?? t("Data sources & methodology", "مصادر البيانات والمنهجية")}</button>;
}

/** Latest-value freshness banner. NASA POWER files end on a fixed date; do not present them as "today". */
export function Freshness({ p }) {
  const { t } = useApp();
  const days = Math.floor((Date.now() - p.endMs) / 86400000);
  if (days < 14) return null;
  const months = Math.round(days / 30.4);
  return (
    <div className="note" style={{ borderStyle: "solid" }}>
      <Icon name="calendar" size={18} />
      <span>{t(
        `The latest day in this country's file is ${iso(p.endMs)}, about ${months} month${months === 1 ? "" : "s"} before today. "Latest" below means latest in the file, not today's weather.`,
        `آخر يوم في ملف هذه الدولة هو ${iso(p.endMs)}، أي قبل اليوم بنحو ${months} شهر. كلمة «الأحدث» أدناه تعني الأحدث في الملف وليس طقس اليوم.`
      )}</span>
    </div>
  );
}

/** variable code · source product · unit, read from the NASA POWER file headers */
export function VarNote({ v }) {
  const { VAR_META } = NASA;
  return <div className="mono tip" dir="ltr" style={{ textAlign: "start" }}>{v} · {VAR_META[v].source} · {VAR_META[v].unit}</div>;
}
