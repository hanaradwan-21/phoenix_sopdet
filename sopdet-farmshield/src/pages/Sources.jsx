import React from "react";
import { useApp } from "../app-context.jsx";
import { COUNTRIES, COUNTRY_KEYS, VAR_LABEL, CROPS, CROP_KEYS, profileOf } from "../data.js";
import { VARS, VAR_META, POINTS, commonPeriod, iso, fmt } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { PageHead, DataType, Disclaimer, TYPE_COLORS, typeLabels, typeHelp } from "../components/ui.jsx";

/* Layers that have NO files in this project. They are listed so nobody mistakes them for integrated data. */
export const NOT_INTEGRATED = [
  { name: "SMAP", full: "Soil Moisture Active Passive", param: { en: "Satellite soil moisture", ar: "رطوبة التربة من الأقمار" }, need: { en: "SMAP soil-moisture rasters for the area and dates", ar: "ملفات SMAP لرطوبة التربة للمنطقة والتواريخ" } },
  { name: "MODIS NDVI", full: "MOD13Q1 vegetation index", param: { en: "Greenness (NDVI / EVI)", ar: "الاخضرار (NDVI / EVI)" }, need: { en: "MODIS NDVI tiles or a time series per field", ar: "مربعات MODIS لـ NDVI أو سلسلة زمنية لكل حقل" } },
  { name: "Landsat", full: "Landsat 8/9 surface reflectance", param: { en: "Field-scale imagery", ar: "صور على مستوى الحقل" }, need: { en: "Landsat scenes and field boundaries", ar: "مشاهد Landsat وحدود الحقول" } },
  { name: "GPM IMERG", full: "Integrated Multi-satellite Retrievals", param: { en: "Satellite rainfall", ar: "الأمطار من الأقمار" }, need: { en: "IMERG rainfall files", ar: "ملفات IMERG للأمطار" } },
  { name: "ECOSTRESS", full: "ECOsystem Spaceborne Thermal Radiometer", param: { en: "Evapotranspiration, surface temperature", ar: "البخر-نتح وحرارة السطح" }, need: { en: "ECOSTRESS products for the area", ar: "منتجات ECOSTRESS للمنطقة" } },
  { name: "GRACE / GRACE-FO", full: "Gravity Recovery and Climate Experiment", param: { en: "Terrestrial water storage", ar: "تخزين المياه الأرضية" }, need: { en: "GRACE mascon files", ar: "ملفات GRACE" } },
];

const RES = { "MERRA-2": "0.5° × 0.625°", "CERES SYN1deg": "1° × 1°" };
const NOTE = {
  GWETTOP: { en: "From MERRA-2. Not SMAP. Dimensionless wetness 0–1, not m³/m³.", ar: "من MERRA-2 وليست SMAP. رطوبة بلا وحدة 0–1 وليست م³/م³." },
  GWETROOT: { en: "From MERRA-2. Not SMAP. Dimensionless wetness 0–1, not m³/m³.", ar: "من MERRA-2 وليست SMAP. رطوبة بلا وحدة 0–1 وليست م³/م³." },
  WS2M: { en: "Wind at 2 m. The files have no 10 m wind (WS10M).", ar: "رياح عند 2 م. لا توجد في الملفات رياح 10 م (WS10M)." },
  ALLSKY_SFC_SW_DWN: { en: "From CERES SYN1deg, not MERRA-2.", ar: "من CERES SYN1deg وليست MERRA-2." },
  PRECTOTCORR: { en: "Model-corrected precipitation, not a rain-gauge reading.", ar: "هطول مصحَّح بالنموذج وليس قراءة مقياس مطر." },
};

export function SourcesPanel({ compact }) {
  const { t, ar } = useApp();
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card stack">
        <div className="card-head" style={{ marginBottom: 0 }}><div><h3>NASA POWER</h3><div className="tip">{t("Integrated: 9 daily variables, 2 points", "مدمج: 9 متغيرات يومية، نقطتان")}</div></div><DataType k="nasa" /></div>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>{t("Variable", "المتغير")}</th><th>{t("Unit", "الوحدة")}</th><th>{t("Source product", "المنتج المصدر")}</th>{!compact && <th>{t("Native grid", "الشبكة الأصلية")}</th>}{!compact && <th>{t("Note", "ملاحظة")}</th>}</tr></thead>
          <tbody>{VARS.map((v) => (
            <tr key={v}><td><b className="mono">{v}</b><div className="tip">{ar ? VAR_LABEL[v].ar : VAR_LABEL[v].en}</div></td><td className="mono">{VAR_META[v].unit}</td><td>{VAR_META[v].source}</td>
              {!compact && <td className="mono">{RES[VAR_META[v].source]}</td>}{!compact && <td style={{ fontSize: 12.5 }}>{NOTE[v] ? (ar ? NOTE[v].ar : NOTE[v].en) : ""}</td>}</tr>))}</tbody>
        </table></div>
        <p className="tip">{t("Units and source products are read from the headers of the original NASA POWER files.", "الوحدات والمنتجات المصدر مقروءة من هيدر ملفات NASA POWER الأصلية.")}</p>
      </div>
      <div className="card stack">
        <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Not integrated (no files provided)", "غير مدمجة (لا توجد ملفات)")}</h3><DataType k="none" /></div>
        <div className="grid g2" style={compact ? { gridTemplateColumns: "minmax(0,1fr)" } : undefined}>
          {NOT_INTEGRATED.map((d) => (
            <div key={d.name} className="card flat stack" style={{ gap: 4 }}>
              <b>{d.name}</b><div className="tip">{d.full}</div>
              <div style={{ fontSize: 13 }}>{ar ? d.param.ar : d.param.en}</div>
              <div className="tip">{t("Needed to integrate:", "المطلوب للدمج:")} {ar ? d.need.ar : d.need.en}</div>
            </div>
          ))}
        </div>
        <p className="tip">{t("None of these is shown anywhere in the app as data. The Map page is not a satellite map.", "لا يظهر أي منها كبيانات في التطبيق. صفحة الخريطة ليست خريطة أقمار صناعية.")}</p>
      </div>
    </div>
  );
}

export function Restrictions() {
  const { t } = useApp();
  const items = [
    t("Climate numbers are NASA POWER gridded values for one point per country. They do not represent a whole country, a governorate or your own field.", "الأرقام المناخية قيم شبكية من NASA POWER لنقطة واحدة لكل دولة. لا تمثل دولة كاملة ولا محافظة ولا حقلك أنت."),
    t("GWETTOP and GWETROOT are MERRA-2 soil wetness (0–1). They are not SMAP and not volumetric soil moisture.", "GWETTOP وGWETROOT رطوبة تربة من MERRA-2 (0–1). ليستا من SMAP وليستا رطوبة حجمية."),
    t("NDVI, SMAP, Landsat and other satellite layers are not integrated. No files were provided.", "طبقات NDVI وSMAP وLandsat وغيرها غير مدمجة. لم تُقدَّم لها ملفات."),
    t("Crop-profile numbers (irrigation, yield, suitability index) have no stated source or unit definition. They are shown as unverified.", "أرقام ملف المحاصيل (الري والإنتاجية ومؤشر الملاءمة) بلا مصدر أو تعريف وحدة. تُعرض كغير متحقق منها."),
    t("No machine-learning model is connected. The app makes no predictions, scores or recommendations.", "لا يوجد نموذج تعلّم آلي متصل. التطبيق لا يقدّم تنبؤات ولا درجات ولا توصيات."),
    t("Student project using public NASA data. Not affiliated with or endorsed by NASA.", "مشروع طلابي يستخدم بيانات ناسا العامة. غير تابع لناسا ولا معتمد منها."),
  ];
  return <ul style={{ margin: 0, padding: 0, display: "grid", gap: 10, listStyle: "none" }}>{items.map((x, i) => <li key={i} className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}><Icon name="shield" size={18} style={{ color: "var(--terra)", flex: "none", marginTop: 3 }} /><span style={{ fontSize: 14.5 }}>{x}</span></li>)}</ul>;
}

export default function Sources() {
  const { t, ar } = useApp();
  const cp = commonPeriod();
  const tl = typeLabels(t), th = typeHelp(t);
  return (
    <>
      <PageHead eyebrow={t("Data sources & methodology", "المصادر والمنهجية")} title={t("What the data can and cannot tell you", "ما يمكن للبيانات أن تخبرك به وما لا يمكن")}
        lead={t("Every number in the app belongs to one of four kinds. This page lists what is integrated, what is not, and what we found when we checked the files.", "كل رقم في التطبيق ينتمي لأحد أربعة أنواع. تعرض هذه الصفحة ما هو مدمج وما ليس مدمجًا وما وجدناه عند فحص الملفات.")} />

      <section className="card stack">
        <h3>{t("How to read what you see", "كيف تقرأ ما تراه")}</h3>
        <div className="grid g4">
          {["nasa", "calc", "pred", "unv"].map((k) => (
            <div key={k} className="stack" style={{ gap: 8, paddingInlineStart: 14, borderInlineStart: `3px solid ${TYPE_COLORS[k]}` }}>
              <DataType k={k} /><p className="muted" style={{ fontSize: 13.5 }}>{th[k]}</p>
              {k === "pred" && <p className="pill bad">{t("None connected", "لا يوجد نموذج متصل")}</p>}
            </div>
          ))}
        </div>
      </section>

      <SourcesPanel />

      <section className="card stack">
        <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Coverage and data checks", "التغطية وفحوص البيانات")}</h3><DataType k="nasa" /></div>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>{t("Country", "الدولة")}</th><th>{t("Point", "النقطة")}</th><th>{t("Dates in file", "التواريخ في الملف")}</th><th>{t("Days", "الأيام")}</th><th>{t("Missing", "ناقص")}</th><th>{t("Raw rows dropped", "صفوف خام محذوفة")}</th></tr></thead>
          <tbody>{COUNTRY_KEYS.map((k) => { const p = POINTS[k]; const m = Object.entries(p.missing).filter(([, v]) => v); return (
            <tr key={k}><td><b>{ar ? COUNTRIES[k].ar : COUNTRIES[k].en}</b></td><td className="mono">{p.region}<br />{fmt(p.lat, 4)}, {fmt(p.lon, 4)}</td><td className="mono">{p.start} → {p.end}</td><td className="mono">{p.n}</td>
              <td className="mono">{m.length ? m.map(([v, c]) => `${v}: ${c}`).join(", ") : t("none", "لا يوجد")}</td><td className="mono">{p.rawRowsDroppedByCleaning}</td></tr>); })}</tbody>
        </table></div>
        <div className="note"><Icon name="info" size={18} /><span>{t(`Common period for a fair Egypt–India comparison: ${iso(cp.startMs)} → ${iso(cp.endMs)}. Egypt's file stops on ${POINTS.EG.end}; India's runs to ${POINTS.IN.end}.`, `الفترة المشتركة لمقارنة عادلة بين مصر والهند: ${iso(cp.startMs)} ← ${iso(cp.endMs)}. ملف مصر ينتهي في ${POINTS.EG.end} وملف الهند يمتد إلى ${POINTS.IN.end}.`)}</span></div>
        <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, fontSize: 14, display: "grid", gap: 6 }}>
          <li>{t("The cleaned files match the original NASA files value for value; cleaning only removed the days NASA marks as missing (−999).", "الملفات النظيفة تطابق ملفات ناسا الأصلية قيمة بقيمة؛ التنظيف حذف فقط الأيام التي تعلّمها ناسا كناقصة (−999).")}</li>
          <li>{t("The two missing India solar-radiation days are left empty, not filled in.", "يومان ناقصان في إشعاع الهند الشمسي يُتركان فارغين دون ملء.")}</li>
          <li>{t("A clean file is not proof the numbers are right for a farm: MERRA-2 and CERES are coarse grids that smooth local conditions (for example, the Egypt cell is close to the coast).", "الملف النظيف ليس دليلًا على صحة الأرقام لمزرعة: MERRA-2 وCERES شبكتان خشنتان تلطّفان الظروف المحلية (مثلًا خلية مصر قريبة من الساحل).")}</li>
          <li>{t("The Egypt root-zone wetness barely changes (see Climate Insights), so it carries little day-to-day information.", "رطوبة منطقة الجذور في مصر تكاد لا تتغير (انظر تحليلات المناخ)، لذا تحمل معلومات يومية قليلة.")}</li>
        </ul>
      </section>

      <section className="card stack">
        <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Crop profiles", "ملفات المحاصيل")}</h3><DataType k="unv" /></div>
        <p style={{ fontSize: 14.5 }}>{t("crop_profiles.csv and crop_profiles_clean.csv are identical: 16 rows, 8 crops for each of the two points. Season names differ (Winter/Summer for Egypt, Rabi/Kharif for India). To use these numbers as science we would need: the source of each number, the definition and unit (is the irrigation figure gross or net? is yield t/ha at what moisture?), the meaning and scale of Suitability_Index, and the years or method behind them.", "ملفا crop_profiles.csv وcrop_profiles_clean.csv متطابقان: 16 صفًا، 8 محاصيل لكل نقطة. أسماء المواسم تختلف (شتوي/صيفي لمصر ورابي/كاريف للهند). لاستخدام هذه الأرقام علميًا نحتاج: مصدر كل رقم، وتعريفه ووحدته (هل رقم الري إجمالي أم صافي؟ وإنتاجية الطن/هكتار عند أي رطوبة؟)، ومعنى مؤشر الملاءمة ومقياسه، والسنوات أو المنهج وراءها.")}</p>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>{t("Crop", "المحصول")}</th>{COUNTRY_KEYS.map((k) => <th key={k}>{ar ? COUNTRIES[k].ar : COUNTRIES[k].en}: {t("season · irrigation mm · yield t/ha", "الموسم · الري مم · الإنتاجية ط/هـ")}</th>)}</tr></thead>
          <tbody>{CROP_KEYS.map((c) => <tr key={c}><td><b>{ar ? CROPS[c].ar : CROPS[c].en}</b></td>{COUNTRY_KEYS.map((k) => { const r = profileOf(k, c); return <td key={k} className="mono">{r ? `${r.seasonName} · ${r.irrigationMm} · ${r.yieldTHa}` : "—"}</td>; })}</tr>)}</tbody>
        </table></div>
      </section>

      <section className="card dark stack">
        <h3>{t("What this project does not claim", "ما لا يدّعيه هذا المشروع")}</h3>
        <div style={{ color: "var(--limestone)" }}><Restrictions /></div>
      </section>
      <Disclaimer />
    </>
  );
}
