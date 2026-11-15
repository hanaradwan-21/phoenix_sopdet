import React, { useState } from "react";
import { useApp } from "../app-context.jsx";
import { COUNTRIES, COUNTRY_KEYS, AREA_UNITS, CROPS, VAR_LABEL, analyzeScenario, month } from "../data.js";
import { VARS, VAR_META, point, periodFor, commonPeriod, stat, monthly, climatology, annual, merraCell, ceresCell, dateAt, iso, fmt } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { PageHead, SourcesLink, DataType, Disclaimer, PeriodSwitch, VarNote, Freshness } from "../components/ui.jsx";
import { LineChart, BarChart, GroupBars } from "../components/Charts.jsx";

export default function Expert() {
  const { t, ar, lang, farm, scen, go, cc, period } = useApp();
  const [v, setV] = useState("T2M");
  const p = point(cc), C = COUNTRIES[cc], per = periodFor(cc, period), cp = commonPeriod();
  const unit = AREA_UNITS.find((u) => u.k === farm.unit);
  const fieldM2 = farm.area != null ? farm.area * unit.m2 : null;
  const L = (x) => (ar ? VAR_LABEL[x].ar : VAR_LABEL[x].en);

  const yr = annual(cc, "PRECTOTCORR", period);
  const kpis = [
    { v: "T2M", val: fmt(stat(cc, "T2M", period).mean, 1), u: "°C", l: t("mean air temperature", "متوسط حرارة الهواء") },
    { v: "PRECTOTCORR", val: yr.length ? fmt(yr.reduce((a, r) => a + r.value, 0) / yr.length, 0) : "—", u: "mm/yr", l: t(`rain, average of ${yr.length} complete year(s)`, `الأمطار، متوسط ${yr.length} سنة كاملة`) },
    { v: "GWETROOT", val: fmt(stat(cc, "GWETROOT", period).mean, 2), u: "(0–1)", l: t("mean root-zone wetness", "متوسط رطوبة منطقة الجذور") },
    { v: "ALLSKY_SFC_SW_DWN", val: fmt(stat(cc, "ALLSKY_SFC_SW_DWN", period).mean, 1), u: "MJ/m²/day", l: t("mean surface solar radiation", "متوسط الإشعاع الشمسي على السطح") },
  ];

  const isRain = v === "PRECTOTCORR";
  const mv = monthly(cc, v, period, isRain ? "sum" : "mean");
  const s = stat(cc, v, period);
  const lab = mv.map((r) => r.label), vals = mv.map((r) => r.value);
  const hiV = v.startsWith("GWET") ? 1 : v === "RH2M" ? 100 : undefined;

  /* fair comparison: always the common period */
  const days = stat("EG", "T2M", "common").days;
  const cmpRows = VARS.map((x) => ({ x, a: stat("EG", x, "common"), b: stat("IN", x, "common") }));
  const mLab = Array.from({ length: 12 }, (_, i) => month(i, lang).slice(0, 3));
  const cl = (cc2, x, how) => climatology(cc2, x, "common", how).map((r) => r.value ?? 0);
  const names = COUNTRY_KEYS.map((k) => (ar ? COUNTRIES[k].ar : COUNTRIES[k].en));
  const col = ["#a8832f", "#55693a"];

  const cells = [{ n: "MERRA-2", sub: t("most variables", "معظم المتغيرات"), c: merraCell(p.lat, p.lon) }, { n: "CERES SYN1deg", sub: t("solar radiation", "الإشعاع الشمسي"), c: ceresCell(p.lat) }];
  const verdict = (km2) => { if (fieldM2 == null) return ["", t("Unknown, no area entered", "غير معروفة، لم تُدخل مساحة")]; const ratio = (km2 * 1e6) / fieldM2; return [ratio <= 20 ? "warn" : "bad", t("One cell is far larger than your field: regional context only", "الخلية أكبر بكثير من حقلك: سياق إقليمي فقط")]; };

  const scenRows = [["current", t("Current", "الحالية")], ["A", "A"], ["B", "B"]].map(([id, label]) => ({ id, label, r: analyzeScenario(cc, scen[id], farm.season === "S" ? "S" : "W", unit.m2) }));

  return (
    <>
      <PageHead eyebrow={t("Expert dashboard", "لوحة الخبير")} title={t("Variables, comparison and data quality", "المتغيرات والمقارنة وجودة البيانات")}
        lead={t("Every value carries its variable code, unit, source product and dates. Nothing here is a model output.", "كل قيمة تحمل كود المتغير ووحدته والمنتج المصدر وتواريخه. لا شيء هنا مخرج نموذج.")}
        right={<div className="row"><SourcesLink /><button className="btn sm" onClick={() => go("map")}><Icon name="map" size={15} />{t("Location & coverage", "الموقع والتغطية")}</button></div>} />

      <Freshness p={p} />
      <PeriodSwitch />

      <div className="card flat row" style={{ gap: 26 }}>
        <div><div className="eyebrow">{t("Point", "النقطة")}</div><div className="mono">{p.region} · {fmt(p.lat, 4)}, {fmt(p.lon, 4)}</div></div>
        <div><div className="eyebrow">{t("Analysis window", "نافذة التحليل")}</div><div className="mono">{iso(per.startMs)} → {iso(per.endMs)}</div></div>
        <div><div className="eyebrow">{t("Model version", "إصدار النموذج")}</div><div className="mono">{t("none connected", "لا يوجد نموذج متصل")}</div></div>
      </div>

      <section className="grid g4">
        {kpis.map((k) => (
          <div key={k.v} className="card stack" style={{ gap: 8 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="eyebrow">{k.l}</span></div>
            <div className="kpi"><div className="v">{k.val}<span className="tip" style={{ fontSize: 14, marginInlineStart: 4 }}>{k.u}</span></div></div>
            <VarNote v={k.v} /><DataType k="nasa" />
          </div>
        ))}
      </section>

      <section className="grid g-main">
        <div className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div><h3>{t("Variable explorer", "مستكشف المتغيرات")}</h3><div className="sub">{isRain ? t("Monthly total, complete months", "المجموع الشهري للأشهر الكاملة") : t("Monthly mean, complete months", "المتوسط الشهري للأشهر الكاملة")}</div></div>
            <DataType k="nasa" />
          </div>
          <label className="fl" style={{ maxWidth: 420 }}>{t("Variable", "المتغير")}
            <select id="var-select" className="input" value={v} onChange={(e) => setV(e.target.value)}>{VARS.map((x) => <option key={x} value={x}>{x} · {L(x)}</option>)}</select>
          </label>
          {isRain ? <BarChart labels={lab} values={vals} unit="mm" every={6} /> : <LineChart labels={lab} series={[{ name: v, color: "var(--olive-600)", values: vals, area: true }]} yMin={hiV != null ? 0 : undefined} yMax={hiV} decimals={v.startsWith("GWET") ? 2 : 1} every={6} unit={" " + VAR_META[v].unit} />}
          <VarNote v={v} />
          <div className="grid g4" style={{ gap: 10 }}>
            {[[t("Mean", "المتوسط"), fmt(s.mean, 2)], [t("Min", "الأدنى"), `${fmt(s.min, 2)}`, s.iMin >= 0 ? iso(dateAt(p, s.iMin)) : ""], [t("Max", "الأقصى"), `${fmt(s.max, 2)}`, s.iMax >= 0 ? iso(dateAt(p, s.iMax)) : ""], [t("Valid days", "أيام صالحة"), `${s.n} / ${s.days}`]].map(([l, val, d]) => <div key={l} className="kpi"><div className="v" style={{ fontSize: 22 }}>{val}</div><div className="l">{l}{d ? ` · ${d}` : ""}</div></div>)}
          </div>
        </div>

        <div className="card stack">
          <h3>{t("Grid cell vs your field", "الخلية الشبكية مقابل حقلك")}</h3>
          <p className="muted" style={{ fontSize: 13.5 }}>{fieldM2 != null ? t(`Your field is about ${Math.round(fieldM2).toLocaleString()} m². Each NASA value is an average over one grid cell:`, `مساحة حقلك نحو ${Math.round(fieldM2).toLocaleString()} م². كل قيمة من ناسا متوسط على خلية شبكية واحدة:`) : t("No farm area entered, so the comparison to your field is unknown.", "لم تُدخل مساحة المزرعة، لذا المقارنة بحقلك غير معروفة.")}</p>
          {cells.map((c) => { const [cls, txt] = verdict(c.c.km2); return (
            <div key={c.n} className="stack" style={{ gap: 4 }}>
              <div><b>{c.n}</b> <span className="tip">{c.sub}</span></div>
              <div className="mono tip">≈ {fmt(c.c.kmNS, 0)} × {fmt(c.c.kmEW, 0)} km ≈ {Math.round(c.c.km2).toLocaleString()} km²{fieldM2 != null && ` · ≈ ${Math.round((c.c.km2 * 1e6) / fieldM2).toLocaleString()}× ${t("your field", "حقلك")}`}</div>
              <span className={`pill ${cls}`} style={{ justifySelf: "start" }}>{txt}</span>
            </div>); })}
          <p className="tip">{t("Plain geometry from the grid sizes. It is arithmetic, not data.", "هندسة بسيطة من أحجام الشبكة. هي حساب وليست بيانات.")}</p>
        </div>
      </section>

      <section className="card stack">
        <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{t("Egypt vs India", "مصر مقابل الهند")}</h3><div className="sub">{t("Always on the common period so both have the same dates:", "دائمًا على الفترة المشتركة ليكون لكليهما نفس التواريخ:")} <span className="mono">{iso(cp.startMs)} → {iso(cp.endMs)}</span></div></div><DataType k="nasa" /></div>
        <div className="grid g2">
          <div className="stack"><b style={{ fontSize: 14 }}>{t("Mean air temperature by month, °C", "متوسط حرارة الهواء بالشهر، °م")}</b>
            <GroupBars groups={mLab} series={COUNTRY_KEYS.map((k, i) => ({ name: names[i], color: col[i], values: cl(k, "T2M", "mean") }))} showValues={false} decimals={0} /></div>
          <div className="stack"><b style={{ fontSize: 14 }}>{t("Rain by month, mm per month", "الأمطار بالشهر، مم/شهر")}</b>
            <GroupBars groups={mLab} series={COUNTRY_KEYS.map((k, i) => ({ name: names[i], color: col[i], values: cl(k, "PRECTOTCORR", "sum") }))} showValues={false} decimals={0} /></div>
        </div>
        <div className="legend">{names.map((n, i) => <span key={n}><i style={{ background: col[i] }} />{n}</span>)}</div>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>{t("Variable", "المتغير")}</th><th>{t("Unit", "الوحدة")}</th><th>{names[0]}</th><th>{names[1]}</th></tr></thead>
          <tbody>{cmpRows.map(({ x, a, b }) => <tr key={x}><td><b className="mono">{x}</b><div className="tip">{L(x)}</div></td><td className="mono">{VAR_META[x].unit}</td><td className="mono">{fmt(a.mean, 2)}</td><td className="mono">{fmt(b.mean, 2)}</td></tr>)}</tbody>
        </table></div>
        <div className="note"><Icon name="info" size={18} /><span>{t(`Means over the same ${days} days. Each value is one grid-cell point (El-Hamoul and Ludhiana). The difference is a difference between those two points, not between the countries.`, `متوسطات على نفس الـ ${days} يومًا. كل قيمة نقطة شبكية واحدة (الحمول ولوديانا). الفرق هو بين هاتين النقطتين وليس بين الدولتين.`)}</span></div>
      </section>

      <section className="card stack">
        <div className="card-head" style={{ marginBottom: 0 }}><div><h3>{t("Rotation scenarios: rule checks", "سيناريوهات الدورة: فحوص القواعد")}</h3><div className="sub">{t("Counts and sums only. No score, rank or prediction.", "عدّات ومجاميع فقط. لا درجة ولا ترتيب ولا تنبؤ.")}</div></div><div className="row"><DataType k="calc" /><button className="btn sm" onClick={() => go("planner")}>{t("Edit in planner", "عدّل في المخطط")}</button></div></div>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>{t("Scenario", "السيناريو")}</th><th>{t("Sequence", "التتابع")}</th><th>{t("Off-season", "خارج الموسم")}</th><th>{t("Same-family pairs", "أزواج نفس الفصيلة")}</th><th>{t("Listed water, mm (unverified)", "المياه المدرجة مم (غير متحقق)")}</th><th>{t("Prediction", "التنبؤ")}</th></tr></thead>
          <tbody>{scenRows.map(({ id, label, r }) => <tr key={id}><td><b>{label}</b></td><td style={{ minWidth: 230 }}>{scen[id].map((k) => (ar ? CROPS[k].ar : CROPS[k].en)).join(" → ")}</td><td className="mono">{r.off}</td><td className="mono">{r.rep} / {r.pairs}</td><td className="mono">{fmt(r.mm, 0)}</td><td><span className="pill">{t("none", "لا يوجد")}</span></td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="grid g2">
        <div className="card stack">
          <h3>{t("Data timeline", "الخط الزمني للبيانات")}</h3>
          {[[p.start, t("First day in the file", "أول يوم في الملف"), "var(--moss)"], [iso(cp.startMs), t("Common period starts", "بداية الفترة المشتركة"), "var(--turq)"], [iso(cp.endMs), t("Common period ends (Egypt's last day)", "نهاية الفترة المشتركة (آخر يوم لمصر)"), "var(--gold)"], [p.end, t(`Last day in the ${C.en} file`, `آخر يوم في ملف ${C.ar}`), "var(--ink-3)"]].map(([d, l, c], i) => (
            <div key={i} className="row" style={{ gap: 12, flexWrap: "nowrap" }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: c, flex: "none" }} /><span className="mono" style={{ width: 92, flex: "none" }}>{d}</span><span style={{ fontSize: 14 }}>{l}</span></div>
          ))}
        </div>
        <div className="card stack">
          <h3>{t("Data quality for this point", "جودة البيانات لهذه النقطة")}</h3>
          <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, fontSize: 13.5, display: "grid", gap: 6 }}>
            <li>{t(`Missing values: ${Object.values(p.missing).reduce((a, b) => a + b, 0)}. Never filled in.`, `قيم ناقصة: ${Object.values(p.missing).reduce((a, b) => a + b, 0)}. لا تُملأ أبدًا.`)}</li>
            <li>{t(`Raw rows removed by cleaning: ${p.rawRowsDroppedByCleaning} (days NASA marks −999).`, `صفوف خام حُذفت بالتنظيف: ${p.rawRowsDroppedByCleaning} (أيام تعلّمها ناسا بـ −999).`)}</li>
            <li>{t(`Longest run of identical GWETROOT values: ${p.longestConstantRun.GWETROOT} days (GWETTOP ${p.longestConstantRun.GWETTOP}).`, `أطول فترة بقيم GWETROOT متطابقة: ${p.longestConstantRun.GWETROOT} يومًا (وGWETTOP ${p.longestConstantRun.GWETTOP}).`)}</li>
            <li>{t("Cleaned file = original NASA file, value for value.", "الملف النظيف = ملف ناسا الأصلي، قيمة بقيمة.")}</li>
          </ul>
          <SourcesLink label={t("Methodology and limitations", "المنهجية والقيود")} />
        </div>
      </section>
      <Disclaimer />
    </>
  );
}
