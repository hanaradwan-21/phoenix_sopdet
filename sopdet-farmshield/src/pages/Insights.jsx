import React, { useState } from "react";
import { useApp } from "../app-context.jsx";
import { COUNTRIES, AREA_UNITS, SOILS, CROPS, CROP_KEYS, profileOf, CROP_PROFILE_NOTE, VAR_LABEL, img, month } from "../data.js";
import { point, periodFor, stat, monthly, annual, seasons, climatology, WINDOW_TEXT, merraCell, VAR_META, fmt, iso } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { PageHead, SourcesLink, Disclaimer, DataType, PeriodSwitch, VarNote, Freshness } from "../components/ui.jsx";
import { LineChart, BarChart } from "../components/Charts.jsx";

export default function Insights() {
  const { t, ar, lang, farm, mode, cc, period } = useApp();
  const [tab, setTab] = useState("climate");
  const p = point(cc), C = COUNTRIES[cc], expert = mode === "expert";
  const per = periodFor(cc, period), cell = merraCell(p.lat, p.lon);
  const unit = AREA_UNITS.find((u) => u.k === farm.unit);
  const soil = SOILS.find((s) => s[0] === farm.soil);
  const days = stat(cc, "T2M", period).days;
  const L = (v) => (ar ? VAR_LABEL[v].ar : VAR_LABEL[v].en);
  const M = (v, how = "mean") => monthly(cc, v, period, how);
  const labels = M("T2M").map((r) => r.label);
  const series = (v, how) => M(v, how).map((r) => r.value);

  const tabs = [["climate", t("Temperature, humidity, sun, wind", "الحرارة والرطوبة والشمس والرياح")], ["water", t("Rain & soil wetness", "الأمطار ورطوبة التربة")], ["season", t("Season windows", "نوافذ المواسم")], ["crops", t("Crop profiles (unverified)", "ملف المحاصيل (غير متحقق منه)")]];

  const small = (v, color, yMin, yMax, d) => (
    <div key={v} className="card stack">
      <div className="card-head" style={{ marginBottom: 0 }}><div><h3 style={{ fontSize: 18 }}>{L(v)}</h3><VarNote v={v} /></div><DataType k="nasa" /></div>
      <LineChart labels={labels} series={[{ name: L(v), color, values: series(v) }]} yMin={yMin} yMax={yMax} decimals={d} every={12} height={180} unit={" " + VAR_META[v].unit} />
      <div className="tip">{t("Monthly mean of the daily values, complete months only.", "متوسط شهري للقيم اليومية، للأشهر الكاملة فقط.")}</div>
    </div>
  );

  const seasonCard = (type) => {
    const S = seasons(cc, type, period);
    const name = C.seasons[type];
    return (
      <div className="card stack" key={type}>
        <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{ar ? name.ar : name.en}</h3><div className="sub">{t("Calendar window", "النافذة التقويمية")}: {ar ? WINDOW_TEXT[type].ar : WINDOW_TEXT[type].en}</div></div><DataType k="nasa" /></div>
        {S.count === 0 ? <p className="muted">{t("No complete season of this type fits in the selected period.", "لا يوجد موسم كامل من هذا النوع ضمن الفترة المختارة.")}</p> : (
          <div className="table-wrap"><table className="t">
            <thead><tr><th>{t("Season", "الموسم")}</th><th>{t("Temp °C", "حرارة °م")}</th><th>{t("Rain mm", "أمطار مم")}</th><th>{t("Root wetness", "رطوبة الجذور")}</th><th>{t("Solar MJ/m²/d", "إشعاع MJ/م²/ي")}</th></tr></thead>
            <tbody>
              {S.list.map((r) => <tr key={r.label}><td className="mono">{r.label}</td><td className="mono">{fmt(r.t2m, 1)}</td><td className="mono">{fmt(r.rain, 0)}</td><td className="mono">{fmt(r.wetRoot, 2)}</td><td className="mono">{fmt(r.solar, 1)}</td></tr>)}
              <tr style={{ background: "var(--paper-2)" }}><td><b>{t(`Average of ${S.count}`, `متوسط ${S.count}`)}</b></td><td className="mono"><b>{fmt(S.mean.t2m, 1)}</b></td><td className="mono"><b>{fmt(S.mean.rain, 0)}</b></td><td className="mono"><b>{fmt(S.mean.wetRoot, 2)}</b></td><td className="mono"><b>{fmt(S.mean.solar, 1)}</b></td></tr>
            </tbody>
          </table></div>
        )}
      </div>
    );
  };

  const yr = annual(cc, "PRECTOTCORR", period);
  const flatRoot = p.longestConstantRun.GWETROOT, flatTop = p.longestConstantRun.GWETTOP;

  return (
    <>
      <PageHead eyebrow={t("Climate insights", "تحليلات المناخ")} title={t(`What the NASA data says about ${C.en}`, `ماذا تقول بيانات ناسا عن ${C.ar}`)}
        lead={t("Monthly and seasonal summaries computed from the daily NASA POWER file of the selected country. Switch country in the top bar to change everything on this page.", "ملخصات شهرية وموسمية محسوبة من ملف NASA POWER اليومي للدولة المختارة. بدّل الدولة من الشريط العلوي لتتغير كل بيانات الصفحة.")}
        right={<SourcesLink />} />

      <section className="grid g-side" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative", minHeight: 280 }}>
          <div className="ph" style={{ "--img": img("canal"), position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: "auto 12px 12px 12px", display: "grid", gap: 6 }}>
            <span className="glass" style={{ padding: "8px 12px", fontSize: 13 }}><b>{ar ? C.place.ar : C.place.en}</b> · <span className="mono">{fmt(p.lat, 4)}°N {fmt(p.lon, 4)}°E</span></span>
            <span className="glass" style={{ padding: "6px 12px", fontSize: 12 }}>{t("Decorative photo. The data below is for this one grid-cell point.", "صورة تزيينية. البيانات أدناه لهذه النقطة الشبكية الواحدة.")}</span>
          </div>
        </div>
        <div className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("The data behind this page", "البيانات خلف هذه الصفحة")}</h3><DataType k="nasa" /></div>
          <div className="grid g2" style={{ gap: 14 }}>
            <div className="kpi"><div className="v" style={{ fontSize: 26 }}>{days.toLocaleString()}</div><div className="l">{t("days", "يوم")} · <span className="mono">{iso(per.startMs)} → {iso(per.endMs)}</span></div></div>
            <div className="kpi"><div className="v" style={{ fontSize: 26 }}>{fmt(p.elevation_m, p.elevation_m < 10 ? 2 : 0)} m</div><div className="l">{t("elevation, MERRA-2 grid-cell average", "الارتفاع، متوسط الخلية الشبكية MERRA-2")}</div></div>
            <div className="kpi"><div className="v" style={{ fontSize: 26 }}>{fmt(cell.kmNS, 0)} × {fmt(cell.kmEW, 0)} km</div><div className="l">{t("approx. MERRA-2 cell size (0.5° × 0.625°)", "حجم خلية MERRA-2 التقريبي (0.5° × 0.625°)")}</div></div>
            <div className="kpi"><div className="v" style={{ fontSize: 26 }}>{Object.values(p.missing).reduce((a, b) => a + b, 0)}</div><div className="l">{t("missing daily values in the file (never filled in)", "قيم يومية ناقصة في الملف (لا تُملأ أبدًا)")}</div></div>
          </div>
          <hr className="divider" />
          <div className="eyebrow">{t("Your inputs (Farm Setup)", "مُدخلاتك (إعداد المزرعة)")}</div>
          <p style={{ fontSize: 14 }}>{farm.area ?? t("area unknown", "المساحة غير معروفة")} {farm.area != null ? (ar ? unit.ar : unit.en) : ""} · {soil ? (ar ? soil[2] : soil[1]) : t("soil unknown", "التربة غير معروفة")} · {farm.current ? (ar ? CROPS[farm.current].ar : CROPS[farm.current].en) : t("current crop unknown", "المحصول الحالي غير معروف")} ← {farm.previous ? (ar ? CROPS[farm.previous].ar : CROPS[farm.previous].en) : t("previous crop unknown", "المحصول السابق غير معروف")}</p>
          <p className="tip">{t("Values you did not enter stay unknown. They are not assumed to be zero.", "القيم التي لم تُدخلها تبقى غير معروفة، ولا تُفترض صفرًا.")}</p>
        </div>
      </section>

      <Freshness p={p} />
      <div className="row" style={{ justifyContent: "space-between" }}><PeriodSwitch />{period === "common" && <span className="pill warn">{t("Same dates for Egypt and India: use this for fair comparison", "نفس التواريخ لمصر والهند: استخدمها للمقارنة العادلة")}</span>}</div>

      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === "climate" && (
        <section className="stack" style={{ gap: 18 }}>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{t("Air temperature by month", "درجة حرارة الهواء بالشهر")}</h3><div className="sub">{t("Monthly mean of daily mean, maximum and minimum", "متوسط شهري للمتوسط اليومي والعظمى والصغرى")}</div></div><DataType k="nasa" /></div>
            <LineChart labels={labels} series={[
              { name: t("Daily max (T2M_MAX)", "العظمى (T2M_MAX)"), color: "var(--gold)", values: series("T2M_MAX"), dashed: true },
              { name: t("Mean (T2M)", "المتوسط (T2M)"), color: "var(--terra)", values: series("T2M") },
              { name: t("Daily min (T2M_MIN)", "الصغرى (T2M_MIN)"), color: "var(--olive-600)", values: series("T2M_MIN"), dashed: true },
            ]} yMin={0} yMax={50} decimals={0} every={6} unit=" °C" />
            <div className="legend"><span><i style={{ background: "var(--gold)" }} />T2M_MAX</span><span><i style={{ background: "var(--terra)" }} />T2M</span><span><i style={{ background: "var(--olive-600)" }} />T2M_MIN</span></div>
            <VarNote v="T2M" />
          </div>
          <div className="grid g3">
            {small("RH2M", "var(--turq)", 0, 100, 0)}
            {small("ALLSKY_SFC_SW_DWN", "var(--gold)", 0, 35, 0)}
            {small("WS2M", "var(--olive-600)", 0, 8, 1)}
          </div>
          <div className="note"><Icon name="info" size={18} /><span>{t("Wind speed here is WS2M, the 2-metre wind in the NASA files. It is not a 10-metre wind and is not converted to one. Solar radiation comes from CERES SYN1deg (1° grid), the other variables from MERRA-2 (0.5° × 0.625°).", "سرعة الرياح هنا هي WS2M أي الرياح عند ارتفاع 2 متر في ملفات ناسا، وليست رياح 10 أمتار ولم تُحوَّل إليها. الإشعاع الشمسي من CERES SYN1deg (شبكة 1°) وباقي المتغيرات من MERRA-2 (0.5° × 0.625°).")}</span></div>
        </section>
      )}

      {tab === "water" && (
        <section className="stack" style={{ gap: 18 }}>
          <div className="grid g-main">
            <div className="card stack">
              <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{t("Rainfall per month", "الأمطار في كل شهر")}</h3><div className="sub">{t("Monthly total of daily PRECTOTCORR", "المجموع الشهري لـ PRECTOTCORR اليومي")}</div></div><DataType k="nasa" /></div>
              <BarChart labels={labels} values={series("PRECTOTCORR", "sum")} unit="mm" every={6} decimals={0} />
              <VarNote v="PRECTOTCORR" />
            </div>
            <div className="card stack">
              <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Rain per complete year", "الأمطار لكل سنة كاملة")}</h3><DataType k="nasa" /></div>
              {yr.length === 0 ? <p className="muted">{t("No complete calendar year in this period.", "لا توجد سنة تقويمية كاملة في هذه الفترة.")}</p> : (
                <table className="t"><thead><tr><th>{t("Year", "السنة")}</th><th>{t("Total mm", "المجموع مم")}</th></tr></thead>
                  <tbody>{yr.map((r) => <tr key={r.y}><td className="mono">{r.y}</td><td className="mono">{fmt(r.value, 0)}</td></tr>)}
                    <tr style={{ background: "var(--paper-2)" }}><td><b>{t("Average", "المتوسط")}</b></td><td className="mono"><b>{fmt(yr.reduce((a, r) => a + r.value, 0) / yr.length, 0)}</b></td></tr></tbody></table>
              )}
              <p className="tip">{t("Calendar years that are complete inside the selected period. Partial years are left out, not scaled up.", "السنوات التقويمية الكاملة داخل الفترة المختارة. السنوات الناقصة تُستبعد ولا تُكبَّر.")}</p>
            </div>
          </div>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{t("Soil wetness", "رطوبة التربة")}</h3><div className="sub">{t("Dimensionless 0–1 wetness from MERRA-2. Not SMAP, and not m³/m³.", "رطوبة بلا وحدة (0–1) من MERRA-2. ليست من SMAP وليست م³/م³.")}</div></div><DataType k="nasa" /></div>
            <LineChart labels={labels} series={[
              { name: t("Surface (GWETTOP)", "السطحية (GWETTOP)"), color: "var(--turq)", values: series("GWETTOP") },
              { name: t("Root zone (GWETROOT)", "الجذور (GWETROOT)"), color: "var(--olive-600)", values: series("GWETROOT") },
            ]} yMin={0} yMax={1} decimals={1} every={6} />
            <div className="legend"><span><i style={{ background: "var(--turq)" }} />GWETTOP</span><span><i style={{ background: "var(--olive-600)" }} />GWETROOT</span></div>
            <div className="grid g2"><VarNote v="GWETTOP" /><VarNote v="GWETROOT" /></div>
            {Math.max(flatRoot, flatTop) > 60 && <div className="note" style={{ borderStyle: "solid" }}><Icon name="alert" size={18} /><span>{t(`Caution: at this point GWETROOT keeps the same two-decimal value for up to ${flatRoot} days in a row (GWETTOP up to ${flatTop}). It changes very little, so small day-to-day differences in it say little.`, `تنبيه: عند هذه النقطة تبقى GWETROOT بنفس القيمة (رقمان عشريان) حتى ${flatRoot} يومًا متتاليًا (وGWETTOP حتى ${flatTop}). تتغير قليلًا جدًا، لذا فالفروق اليومية الصغيرة فيها لا تعني الكثير.`)}</span></div>}
            <p className="muted" style={{ fontSize: 14 }}>{t("These are modelled grid-cell wetness values. They do not measure how wet your own field is; your own checks come first.", "هذه قيم رطوبة نمذجية للخلية الشبكية. لا تقيس مدى رطوبة حقلك أنت؛ وفحصك الميداني له الأولوية.")}</p>
          </div>
        </section>
      )}

      {tab === "season" && (
        <section className="stack" style={{ gap: 18 }}>
          <div className="grid g2">{seasonCard("W")}{seasonCard("S")}</div>
          <div className="note"><Icon name="info" size={18} /><span>{t("The windows (Nov–Apr and May–Oct) are our own illustrative calendar windows, used only to summarise the NASA data by season. Real sowing and harvest dates differ by crop and place. Only seasons that fit completely inside the selected period are included.", "النوافذ (نوفمبر–أبريل ومايو–أكتوبر) نوافذ تقويمية توضيحية من عندنا، تُستخدم فقط لتلخيص بيانات ناسا بالموسم. مواعيد الزراعة والحصاد الفعلية تختلف بالمحصول والمكان. تُدرج فقط المواسم التي تقع كاملة داخل الفترة المختارة.")}</span></div>
        </section>
      )}

      {tab === "crops" && (
        <section className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{ar ? C.ar : C.en} · {t("team-provided crop profile", "ملف المحاصيل المقدَّم من الفريق")}</h3><div className="sub">{p.region} · crop_profiles_clean.csv</div></div><DataType k="unv" /></div>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>{t("Crop", "المحصول")}</th><th>{t("Season (as listed)", "الموسم (كما هو مدرج)")}</th><th>Irrigation_Requirement_mm</th><th>Base_Yield_Tons_Ha</th><th>Suitability_Index</th></tr></thead>
            <tbody>{CROP_KEYS.map((k) => { const r = profileOf(cc, k); return r && <tr key={k}><td><b>{ar ? CROPS[k].ar : CROPS[k].en}</b></td><td>{r.seasonName}</td><td className="mono">{r.irrigationMm}</td><td className="mono">{r.yieldTHa}</td><td className="mono tip">{r.suitabilityIndex}</td></tr>; })}</tbody>
          </table></div>
          <div className="note" style={{ borderStyle: "solid" }}><Icon name="alert" size={18} /><span>{t("These numbers have no source, no unit definition and no method in the files provided. Suitability_Index has no known scale (values like 8200) and is not used anywhere in this app. Yield is shown for reference only. The listed irrigation figure is added up in the planner as an unverified input and is labelled that way.", "هذه الأرقام بلا مصدر ولا تعريف للوحدة ولا منهج في الملفات المقدمة. Suitability_Index بلا مقياس معروف (قيم مثل 8200) ولا يُستخدم في أي مكان بالتطبيق. الإنتاجية تُعرض للاطلاع فقط. رقم الري المدرج يُجمع في المخطط كمُدخل غير متحقق منه وموسوم بذلك.")}</span></div>
          <p className="tip">{CROP_PROFILE_NOTE}</p>
        </section>
      )}
      <Disclaimer />
    </>
  );
}
