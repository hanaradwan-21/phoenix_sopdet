import React from "react";
import { useApp } from "../app-context.jsx";
import { COUNTRIES, AREA_UNITS, img, month } from "../data.js";
import { point, recent, climatology, annual, fmt, sign, iso } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { Demo, CropName, Disclaimer, DataType, Freshness } from "../components/ui.jsx";
import { Spark } from "../components/Charts.jsx";

export default function Dashboard() {
  const { t, ar, lang, farm, go, mode, cc } = useApp();
  const p = point(cc), C = COUNTRIES[cc];
  const unit = AREA_UNITS.find((u) => u.k === farm.unit);

  const rT = recent(cc, "T2M", 30), rR = recent(cc, "PRECTOTCORR", 30), rW = recent(cc, "GWETROOT", 30), rS = recent(cc, "GWETTOP", 30);
  const vs = (r, u, d) => (r.baselineYears ? t(`${sign(r.diff, d)} ${u} vs the average of the same dates in ${r.baselineYears} earlier years (${fmt(r.baseline, d)} ${u})`.replace(" )", ")").replace("  ", " "), `${sign(r.diff, d)} ${u} مقارنة بمتوسط نفس التواريخ في ${r.baselineYears} سنوات سابقة (${fmt(r.baseline, d)} ${u})`.replace(" )", ")").replace("  ", " ")) : t("No earlier year covers the same dates.", "لا توجد سنة سابقة تغطي نفس التواريخ."));
  const window = `${iso(rT.from)} → ${iso(rT.to)}`;

  const status = [
    { icon: "thermo", h: t("Air temperature", "درجة حرارة الهواء"), v: fmt(rT.cur, 1), u: "°C", sub: t("mean of daily T2M, last 30 days in the file", "متوسط T2M اليومي، آخر 30 يومًا في الملف"), cmp: vs(rT, "°C", 1), spark: rT.spark, c: "var(--terra)" },
    { icon: "rain", h: t("Rainfall", "الأمطار"), v: fmt(rR.cur, 1), u: "mm", sub: t("total PRECTOTCORR, last 30 days in the file", "مجموع PRECTOTCORR، آخر 30 يومًا في الملف"), cmp: vs(rR, "mm", 1), spark: rR.spark, c: "var(--turq)" },
    { icon: "droplet", h: t("Soil wetness (root zone)", "رطوبة التربة (منطقة الجذور)"), v: fmt(rW.cur, 2), u: t("(0–1)", "(0–1)"), sub: t(`GWETROOT mean · surface layer GWETTOP ${fmt(rS.cur, 2)}`, `متوسط GWETROOT · الطبقة السطحية GWETTOP ${fmt(rS.cur, 2)}`), cmp: vs(rW, "", 2), spark: rW.spark, c: "var(--olive-600)" },
  ];

  /* facts computed from the file of the selected country */
  const cT = climatology(cc, "T2M"), cR = climatology(cc, "PRECTOTCORR", "full", "sum"), cW = climatology(cc, "GWETROOT");
  const arg = (a, f) => a.reduce((b, x) => (x.value != null && (b == null || f(x.value, b.value)) ? x : b), null);
  const warm = arg(cT, (a, b) => a > b), cool = arg(cT, (a, b) => a < b), wet = arg(cR, (a, b) => a > b);
  const yr = annual(cc, "PRECTOTCORR"), yrMean = yr.length ? yr.reduce((a, r) => a + r.value, 0) / yr.length : null;
  const wLo = arg(cW, (a, b) => a < b), wHi = arg(cW, (a, b) => a > b);
  const facts = [
    ["thermo", t(`Warmest month on average: ${month(warm.m, lang)} (${fmt(warm.value, 1)} °C); coolest: ${month(cool.m, lang)} (${fmt(cool.value, 1)} °C).`, `أدفأ شهر في المتوسط: ${month(warm.m, lang)} (${fmt(warm.value, 1)} °م)، وأبرد شهر: ${month(cool.m, lang)} (${fmt(cool.value, 1)} °م).`)],
    ["rain", yrMean != null ? t(`Rain averages ${fmt(yrMean, 0)} mm per year over ${yr.length} complete years (${yr[0].y}–${yr.at(-1).y}); the wettest month averages ${fmt(wet.value, 0)} mm (${month(wet.m, lang)}).`, `متوسط الأمطار ${fmt(yrMean, 0)} مم في السنة على ${yr.length} سنوات كاملة (${yr[0].y}–${yr.at(-1).y})، وأمطر شهر يبلغ متوسطه ${fmt(wet.value, 0)} مم (${month(wet.m, lang)}).`) : t("No complete calendar year in the file.", "لا توجد سنة كاملة في الملف.")],
    ["droplet", t(`Root-zone wetness: monthly averages run from ${fmt(wLo.value, 2)} (${month(wLo.m, lang)}) to ${fmt(wHi.value, 2)} (${month(wHi.m, lang)}) on a 0–1 scale. It is a gridded MERRA-2 value, not a soil probe reading.`, `رطوبة منطقة الجذور: المتوسطات الشهرية بين ${fmt(wLo.value, 2)} (${month(wLo.m, lang)}) و${fmt(wHi.value, 2)} (${month(wHi.m, lang)}) على مقياس 0–1. وهي قيمة شبكية من MERRA-2 وليست قراءة مجس تربة.`)],
  ];

  return (
    <>
      <section className="hero" style={{ "--img": img("fields"), "--pos": "50% 60%", minHeight: 380 }}>
        <div className="inner">
          <div className="row">
            <span className="pill dark"><Icon name="pin" size={14} />{ar ? C.place.ar : C.place.en}, {ar ? C.ar : C.en}</span>
            <span className="pill dark">NASA POWER · {iso(p.startMs)} → {iso(p.endMs)}</span>
            {farm.isSample && <Demo dark>{t("Sample farm inputs", "مُدخلات مزرعة تجريبية")}</Demo>}
          </div>
          <h2>{t(`Welcome back. Here is the NASA climate record for ${C.en}.`, `أهلًا بعودتك. هذا سجل ناسا المناخي لـ${C.ar}.`)}</h2>
          <div className="row" style={{ gap: 22, color: "rgba(241,233,214,.85)" }}>
            <span><b className="display" style={{ fontSize: 26, color: "var(--limestone)" }}>{farm.area ?? "—"}</b> {ar ? unit.ar : unit.en}</span>
            <span>{t("Now growing:", "المزروع الآن:")} <b style={{ color: "var(--limestone)" }}>{farm.current ? <CropName k={farm.current} /> : t("not set", "غير محدد")}</b></span>
            <span>{t("Before that:", "قبله:")} <b style={{ color: "var(--limestone)" }}>{farm.previous ? <CropName k={farm.previous} /> : t("not set", "غير محدد")}</b></span>
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn gold lg" onClick={() => go("planner")}><Icon name="rotate" size={20} />{t("Compare rotation scenarios", "قارن سيناريوهات الدورة")}</button>
            <button className="btn dark lg" onClick={() => go("guide")}><Icon name="star" size={20} />{t("Ask the Data Guide", "اسأل مرشد البيانات")}</button>
          </div>
        </div>
      </section>

      {mode === "expert" && (
        <div className="note"><Icon name="flask" size={18} /><span>{t("You are in Expert mode. This simple view stays available; units, dates and data quality are in the Expert Dashboard.", "أنت في وضع الخبير. هذه الصفحة المبسطة متاحة دائمًا، والوحدات والتواريخ وجودة البيانات في لوحة الخبير.")} <button className="btn sm" style={{ marginInlineStart: 8 }} onClick={() => go("expert")}>{t("Open Expert Dashboard", "افتح لوحة الخبير")}</button></span></div>
      )}

      <Freshness p={p} />

      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h3 className="display" style={{ fontSize: 24 }}>{t("Latest 30 days in the data", "آخر 30 يومًا في البيانات")}</h3>
          <span className="tip row" style={{ gap: 8 }}><span className="mono">{window}</span><DataType k="nasa" /></span>
        </div>
        <div className="status-row">
          {status.map((x, i) => (
            <div key={i} className="status">
              <div className="row" style={{ justifyContent: "space-between" }}><div className="ic"><Icon name={x.icon} size={24} /></div><Spark values={x.spark} color={x.c} /></div>
              <div><div className="eyebrow">{x.h}</div><div className="word">{x.v} <span className="tip" style={{ fontSize: 14 }}>{x.u}</span></div></div>
              <p className="muted" style={{ fontSize: 13.5 }}>{x.sub}</p>
              <p style={{ fontSize: 13.5 }}>{x.cmp}</p>
            </div>
          ))}
        </div>
        <p className="tip" style={{ marginTop: 10 }}>{t("One grid-cell point per country. The curves show the last 60 days. Differences are plain arithmetic, not a judgement of good or bad.", "نقطة شبكية واحدة لكل دولة. المنحنيات تعرض آخر 60 يومًا. الفروق حساب مباشر وليست حكمًا بالجيد أو السيئ.")}</p>
      </section>

      <section className="grid g-main">
        <div className="card next" style={{ background: "linear-gradient(135deg, var(--olive-900), var(--olive-800))", color: "var(--limestone)", borderColor: "rgba(216,180,99,.3)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(216,180,99,.16)", display: "grid", placeItems: "center", color: "var(--gold-2)" }}><Icon name="calendar" size={30} /></div>
          <div className="stack" style={{ gap: 6 }}>
            <div className="eyebrow" style={{ color: "var(--gold-2)" }}>{t("Explore", "استكشف")}</div>
            <h3 style={{ fontSize: 24 }}>{t("Line up rotation scenarios side by side", "اعرض سيناريوهات الدورة جنبًا إلى جنب")}</h3>
            <p style={{ color: "rgba(241,233,214,.75)", fontSize: 14.5 }}>{t("The planner shows rule checks, the team's listed crop water figures (unverified) and NASA POWER season context. It does not rank options or recommend one.", "يعرض المخطط فحوص القواعد وأرقام المياه المدرجة للمحاصيل (غير متحقق منها) وسياق الموسم من NASA POWER. لا يرتّب الخيارات ولا يوصي بأحدها.")}</p>
          </div>
          <button className="btn gold" onClick={() => go("planner")}>{t("Open planner", "افتح المخطط")}<Icon name="arrow" size={18} className="flip" /></button>
        </div>
        <div className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Three things the data shows", "ثلاث حقائق من البيانات")}</h3><DataType k="nasa" /></div>
          {facts.map(([ic, tx], i) => <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "nowrap" }}><Icon name={ic} size={20} style={{ color: "var(--olive-600)", marginTop: 3, flex: "none" }} /><span style={{ fontSize: 14.5 }}>{tx}</span></div>)}
        </div>
      </section>

      <section className="grid g3">
        <button className="photo-tile" style={{ "--img": img("wheat"), textAlign: "start", border: 0, padding: 0 }} onClick={() => go("insights")}><div className="in"><h4>{t("Climate history", "التاريخ المناخي")}</h4><span className="tip" style={{ color: "rgba(241,233,214,.75)" }}>{t("Daily NASA POWER data, by month and season", "بيانات NASA POWER اليومية بالشهر والموسم")}</span></div></button>
        <button className="photo-tile" style={{ "--img": img("soil"), textAlign: "start", border: 0, padding: 0 }} onClick={() => go("guide")}><div className="in"><h4>{t("Farm Data Guide", "مرشد بيانات المزرعة")}</h4><span className="tip" style={{ color: "rgba(241,233,214,.75)" }}>{t("Ask what each variable means and what the numbers are", "اسأل عن معنى كل متغير وما هي الأرقام")}</span></div></button>
        <button className="photo-tile" style={{ "--img": img("delta"), textAlign: "start", border: 0, padding: 0 }} onClick={() => go("map")}><div className="in"><h4>{t("Where the data comes from", "من أين تأتي البيانات")}</h4><span className="tip" style={{ color: "rgba(241,233,214,.75)" }}>{t("The grid cell behind each country's numbers", "الخلية الشبكية خلف أرقام كل دولة")}</span></div></button>
      </section>
      <Disclaimer />
    </>
  );
}
