import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../app-context.jsx";
import Icon from "../components/Icon.jsx";
import { GuideAvatar } from "../components/Logo.jsx";
import { PageHead, DataType } from "../components/ui.jsx";
import { COUNTRIES, CROPS, CROP_KEYS, profileOf, MONTHS_EN, MONTHS_AR } from "../data.js";
import { point, stat, climatology, annual, commonPeriod, iso, dateAt, fmt, VAR_META } from "../nasa.js";

/*
 * Rule-based guide. No AI model is connected. Every answer is built from the NASA POWER file of the selected country
 * (or from the app's own documentation) at the moment you ask. It reports data; it gives no advice and no forecast.
 */
const arg = (a, f) => a.reduce((b, x) => (x.value != null && (b == null || f(x.value, b.value)) ? x : b), null);
const pair = (en, ar) => ({ en, ar });

function answer(q, cc) {
  const s = q.toLowerCase();
  const has = (...w) => w.some((x) => s.includes(x));
  const p = point(cc), C = COUNTRIES[cc];
  const me = (i) => MONTHS_EN[i], ma = (i) => MONTHS_AR[i];
  const head = pair(`${C.en} (${p.region}, ${fmt(p.lat, 2)}°N ${fmt(p.lon, 2)}°E)`, `${C.ar} (${p.region}، ${fmt(p.lat, 2)}°ش ${fmt(p.lon, 2)}°ق)`);

  if (has("predict", "forecast", "machine", " ml", "ml ", "model", "recommend", "best crop", "should i", "تنبؤ", "توقع", "تعلم", "نموذج", "توصي", "وصي", "أفضل", "افضل", "أحسن", "ذكاء")) {
    return { data: false, actions: ["planner", "sources"], ...pair(
      "There is no machine-learning model connected, so I cannot predict yields, score crops or recommend what to plant. What exists is real NASA POWER climate data, simple rule checks in the planner (labelled illustrative), and crop-profile numbers from the team that are not verified. A real prediction would need a documented model, ground-truth yields to test it, and soil and field observations.",
      "لا يوجد نموذج تعلّم آلي متصل، لذلك لا أستطيع التنبؤ بالإنتاجية ولا تقييم المحاصيل ولا التوصية بما تزرعه. الموجود هو بيانات مناخية حقيقية من NASA POWER، وفحوص قواعد بسيطة في المخطط (موسومة توضيحية)، وأرقام محاصيل من الفريق غير متحقق منها. التنبؤ الحقيقي يحتاج نموذجًا موثّقًا وإنتاجية فعلية لاختباره وملاحظات تربة وحقل.") };
  }
  if (has("ndvi", "smap", "landsat", "satellite", "modis", "imagery", "اخضرار", "قمر", "أقمار", "اقمار", "صور", "فضاء")) {
    return { data: false, actions: ["map", "sources"], ...pair(
      "NDVI, SMAP, Landsat, MODIS and other satellite layers are not in this project: no files were provided for them, so the app shows none of them. The only integrated data is NASA POWER daily weather for one point per country. The picture on the Location page is decorative, not a satellite image.",
      "طبقات NDVI وSMAP وLandsat وMODIS وغيرها من الأقمار غير موجودة في هذا المشروع: لم تُقدَّم لها ملفات، فلا يعرض التطبيق أيًا منها. البيانات المدمجة الوحيدة هي طقس NASA POWER اليومي لنقطة واحدة لكل دولة. الصورة في صفحة الموقع تزيينية وليست صورة قمر صناعي.") };
  }
  if ((has("egypt", "مصر") && has("india", "الهند")) || has("compare", "versus", " vs", "مقارن", "قارن")) {
    const cp = commonPeriod(), d = stat("EG", "T2M", "common").days;
    const g = (c, v) => stat(c, v, "common").mean;
    const r = (c) => { const a = annual(c, "PRECTOTCORR", "common"); return a.length ? a.reduce((x, y) => x + y.value, 0) / a.length : null; };
    return { data: true, actions: ["expert"], ...pair(
      `Fair comparison on the common period ${iso(cp.startMs)} → ${iso(cp.endMs)} (${d} days; Egypt's file is shorter than India's). Mean air temperature: Egypt ${fmt(g("EG", "T2M"), 1)} °C vs India ${fmt(g("IN", "T2M"), 1)} °C. Rain per complete year: Egypt ${fmt(r("EG"), 0)} mm vs India ${fmt(r("IN"), 0)} mm. Root-zone wetness: ${fmt(g("EG", "GWETROOT"), 2)} vs ${fmt(g("IN", "GWETROOT"), 2)}. Each side is one grid-cell point (El-Hamoul and Ludhiana), so this compares two points, not two countries.`,
      `مقارنة عادلة على الفترة المشتركة ${iso(cp.startMs)} ← ${iso(cp.endMs)} (${d} يومًا؛ ملف مصر أقصر من ملف الهند). متوسط حرارة الهواء: مصر ${fmt(g("EG", "T2M"), 1)} °م مقابل الهند ${fmt(g("IN", "T2M"), 1)} °م. الأمطار لكل سنة كاملة: مصر ${fmt(r("EG"), 0)} مم مقابل الهند ${fmt(r("IN"), 0)} مم. رطوبة منطقة الجذور: ${fmt(g("EG", "GWETROOT"), 2)} مقابل ${fmt(g("IN", "GWETROOT"), 2)}. كل جانب نقطة شبكية واحدة (الحمول ولوديانا)، فهذه مقارنة بين نقطتين لا بين دولتين.`) };
  }
  if (has("period", "date", "when", "coverage", "latest", "last day", "تاريخ", "فترة", "تغطية", "متى", "آخر", "اخر")) {
    return { data: true, actions: ["sources"], ...pair(
      `${head.en}: daily data from ${p.start} to ${p.end} (${p.n} days). The other country's file covers a different span, so use the "Common period" option for fair comparisons. "Latest" always means the last day in the file.`,
      `${head.ar}: بيانات يومية من ${p.start} إلى ${p.end} (${p.n} يومًا). ملف الدولة الأخرى يغطي مدة مختلفة، لذا استخدم خيار «الفترة المشتركة» للمقارنات العادلة. «الأحدث» تعني دائمًا آخر يوم في الملف.`) };
  }
  if (has("temp", "hot", "warm", "cold", "heat", "حرار", "سخون", "برد", "دفء", "حر ")) {
    const c = climatology(cc, "T2M"), w = arg(c, (a, b) => a > b), k = arg(c, (a, b) => a < b), m = stat(cc, "T2M_MAX");
    return { data: true, actions: ["insights"], ...pair(
      `${head.en}: mean air temperature (T2M, °C) is ${fmt(stat(cc, "T2M").mean, 1)} over the file. Warmest month on average ${me(w.m)} (${fmt(w.value, 1)}), coolest ${me(k.m)} (${fmt(k.value, 1)}). Highest daily maximum (T2M_MAX): ${fmt(m.max, 1)} °C on ${iso(dateAt(p, m.iMax))}. These are MERRA-2 grid-cell values at 2 m, not a thermometer at your field.`,
      `${head.ar}: متوسط حرارة الهواء (T2M، °م) ${fmt(stat(cc, "T2M").mean, 1)} على مدى الملف. أدفأ شهر في المتوسط ${ma(w.m)} (${fmt(w.value, 1)}) وأبرد شهر ${ma(k.m)} (${fmt(k.value, 1)}). أعلى عظمى يومية (T2M_MAX): ${fmt(m.max, 1)} °م في ${iso(dateAt(p, m.iMax))}. هذه قيم خلية شبكية MERRA-2 عند 2 م وليست ترمومترًا في حقلك.`) };
  }
  if (has("rain", "precip", "مطر", "أمطار", "امطار", "هطول")) {
    const a = annual(cc, "PRECTOTCORR"), c = climatology(cc, "PRECTOTCORR", "full", "sum"), w = arg(c, (x, y) => x > y), d = arg(c, (x, y) => x < y);
    const mean = a.length ? a.reduce((x, y) => x + y.value, 0) / a.length : null;
    return { data: true, actions: ["insights"], ...pair(
      `${head.en}: rain (PRECTOTCORR, mm/day, corrected by MERRA-2) averages ${fmt(mean, 0)} mm per year over ${a.length} complete years. Wettest month on average ${me(w.m)} (${fmt(w.value, 0)} mm), driest ${me(d.m)} (${fmt(d.value, 0)} mm). It is a modelled grid-cell value, not a rain-gauge reading.`,
      `${head.ar}: الأمطار (PRECTOTCORR، مم/يوم، مصحَّحة بـ MERRA-2) متوسطها ${fmt(mean, 0)} مم في السنة على ${a.length} سنوات كاملة. أمطر شهر في المتوسط ${ma(w.m)} (${fmt(w.value, 0)} مم) وأجف شهر ${ma(d.m)} (${fmt(d.value, 0)} مم). هي قيمة نمذجية لخلية شبكية وليست قراءة مقياس مطر.`) };
  }
  if (has("humid", "rh2m", "هواء", "نسبية", "نسبي")) {
    return { data: true, actions: ["insights"], ...pair(
      `${head.en}: relative humidity at 2 m (RH2M, %) averages ${fmt(stat(cc, "RH2M").mean, 0)}%, ranging from ${fmt(stat(cc, "RH2M").min, 0)}% to ${fmt(stat(cc, "RH2M").max, 0)}% in daily values.`,
      `${head.ar}: الرطوبة النسبية عند 2 م (RH2M، %) متوسطها ${fmt(stat(cc, "RH2M").mean, 0)}% وتتراوح يوميًا بين ${fmt(stat(cc, "RH2M").min, 0)}% و${fmt(stat(cc, "RH2M").max, 0)}%.`) };
  }
  if (has("soil", "wetness", "gwet", "root", "تربة", "جذور", "رطوبة", "moisture")) {
    const t1 = stat(cc, "GWETTOP"), r1 = stat(cc, "GWETROOT"), fr = p.longestConstantRun.GWETROOT;
    return { data: true, actions: ["insights"], ...pair(
      `${head.en}: GWETTOP (surface soil wetness) averages ${fmt(t1.mean, 2)} (range ${fmt(t1.min, 2)}–${fmt(t1.max, 2)}) and GWETROOT (root-zone wetness) ${fmt(r1.mean, 2)} (range ${fmt(r1.min, 2)}–${fmt(r1.max, 2)}). Both are dimensionless 0–1 values from MERRA-2. They are not SMAP data and not m³/m³ soil moisture. ${fr > 60 ? `GWETROOT keeps the same value for up to ${fr} days here, so it carries little day-to-day information.` : ""}`,
      `${head.ar}: GWETTOP (رطوبة التربة السطحية) متوسطها ${fmt(t1.mean, 2)} (المدى ${fmt(t1.min, 2)}–${fmt(t1.max, 2)}) وGWETROOT (رطوبة منطقة الجذور) ${fmt(r1.mean, 2)} (المدى ${fmt(r1.min, 2)}–${fmt(r1.max, 2)}). كلاهما قيمة بلا وحدة 0–1 من MERRA-2. ليستا بيانات SMAP وليستا رطوبة تربة بوحدة م³/م³. ${fr > 60 ? `تبقى GWETROOT بنفس القيمة حتى ${fr} يومًا هنا، لذا تحمل معلومات يومية قليلة.` : ""}`) };
  }
  if (has("solar", "radiation", "sun", "allsky", "شمس", "إشعاع", "اشعاع")) {
    return { data: true, actions: ["insights"], ...pair(
      `${head.en}: surface solar radiation (ALLSKY_SFC_SW_DWN, MJ/m²/day, from CERES SYN1deg) averages ${fmt(stat(cc, "ALLSKY_SFC_SW_DWN").mean, 1)}, with a daily maximum of ${fmt(stat(cc, "ALLSKY_SFC_SW_DWN").max, 1)}. CERES is a 1° grid, coarser than the MERRA-2 variables.`,
      `${head.ar}: الإشعاع الشمسي على السطح (ALLSKY_SFC_SW_DWN، MJ/م²/يوم، من CERES SYN1deg) متوسطه ${fmt(stat(cc, "ALLSKY_SFC_SW_DWN").mean, 1)} وأقصاه اليومي ${fmt(stat(cc, "ALLSKY_SFC_SW_DWN").max, 1)}. شبكة CERES بدرجة 1° أخشن من متغيرات MERRA-2.`) };
  }
  if (has("wind", "ws2m", "رياح", "ريح")) {
    return { data: true, actions: ["insights"], ...pair(
      `${head.en}: wind speed here is WS2M, wind at 2 metres (m/s). It averages ${fmt(stat(cc, "WS2M").mean, 1)} with a daily maximum of ${fmt(stat(cc, "WS2M").max, 1)}. The files have no 10-metre wind and I do not convert one.`,
      `${head.ar}: سرعة الرياح هنا هي WS2M أي الرياح عند 2 متر (م/ث). متوسطها ${fmt(stat(cc, "WS2M").mean, 1)} وأقصاها اليومي ${fmt(stat(cc, "WS2M").max, 1)}. لا توجد في الملفات رياح 10 أمتار ولا أحوّل إليها.`) };
  }
  const named = CROP_KEYS.find((k) => has(CROPS[k].en.toLowerCase(), CROPS[k].ar));
  if (named || has("crop", "محصول", "محاصيل", "profile")) {
    if (named) {
      const r = profileOf(cc, named);
      return { data: false, actions: ["insights", "planner"], ...pair(
        `${CROPS[named].en} in the team's crop file for ${C.en}: season "${r.seasonName}", Irrigation_Requirement_mm ${r.irrigationMm}, Base_Yield_Tons_Ha ${r.yieldTHa}. These numbers have no stated source or unit definition, so they are unverified and I cannot vouch for them.`,
        `${CROPS[named].ar} في ملف المحاصيل الخاص بالفريق لـ${C.ar}: الموسم «${r.seasonName}»، Irrigation_Requirement_mm ${r.irrigationMm}، Base_Yield_Tons_Ha ${r.yieldTHa}. هذه الأرقام بلا مصدر أو تعريف وحدة، فهي غير متحقق منها ولا أستطيع الجزم بها.`) };
    }
    return { data: false, actions: ["insights"], ...pair("The crop file lists 8 crops per point (wheat, rice, maize, potato, sugar beet, barley, mustard, cotton) with a season, a water figure, a yield and a suitability index. None of these numbers has a source, so they are shown as unverified, and the suitability index is not used at all. Ask about a specific crop to see its listed numbers.", "ملف المحاصيل يضم 8 محاصيل لكل نقطة (قمح وأرز وذرة وبطاطس وبنجر سكر وشعير وخردل وقطن) مع الموسم ورقم للمياه والإنتاجية ومؤشر ملاءمة. لا مصدر لأي منها فتُعرض كغير متحققة، ومؤشر الملاءمة لا يُستخدم إطلاقًا. اسأل عن محصول محدد لترى أرقامه المدرجة.") };
  }
  if (has("rotation", "rotate", "دورة", "دوره", "تناوب")) {
    return { data: false, actions: ["planner"], ...pair(
      "Crop rotation means changing what you grow on a field from season to season. In this app the planner lines up three sequences and shows rule checks (off-season crops, same botanical family back-to-back), the team's listed water figures (unverified) and NASA climate for each season. It does not say which rotation is best.",
      "الدورة الزراعية تعني تغيير المحصول في الحقل من موسم لآخر. في هذا التطبيق يعرض المخطط ثلاثة تتابعات مع فحوص قواعد (محاصيل خارج الموسم ونفس الفصيلة النباتية متتالية) وأرقام المياه المدرجة من الفريق (غير متحقق منها) ومناخ ناسا لكل موسم. ولا يقول أي دورة هي الأفضل.") };
  }
  if (has("source", "nasa", "power", "merra", "ceres", "مصدر", "ناسا", "بيانات", "data")) {
    return { data: false, actions: ["sources"], ...pair(
      "The data is NASA POWER daily values for 9 variables at one point in Egypt (El-Hamoul) and one in India (Ludhiana), 2021 onward. Temperature, humidity, wind, soil wetness and rain come from MERRA-2 (0.5° × 0.625°); solar radiation from CERES SYN1deg (1°). The Sources page lists units, products and the checks we ran.",
      "البيانات قيم يومية من NASA POWER لـ 9 متغيرات عند نقطة في مصر (الحمول) ونقطة في الهند (لوديانا) من 2021 فصاعدًا. الحرارة والرطوبة والرياح ورطوبة التربة والأمطار من MERRA-2 (0.5° × 0.625°) والإشعاع الشمسي من CERES SYN1deg (1°). تعرض صفحة المصادر الوحدات والمنتجات والفحوص التي أجريناها.") };
  }
  return { data: false, actions: ["insights", "sources"], ...pair(
    "I can explain the NASA POWER data in this app: temperature, rain, soil wetness, humidity, solar radiation, wind, the data period, the Egypt–India comparison, the crop file and the planner. I cannot give farming advice, predictions or satellite data. Try one of the suggestions.",
    "أستطيع شرح بيانات NASA POWER في هذا التطبيق: الحرارة والأمطار ورطوبة التربة والرطوبة والإشعاع الشمسي والرياح وفترة البيانات والمقارنة بين مصر والهند وملف المحاصيل والمخطط. لا أستطيع تقديم نصائح زراعية ولا تنبؤات ولا بيانات أقمار. جرّب أحد المقترحات.") };
}

const SUGGEST = [
  { en: "How hot does it get here?", ar: "ما مدى الحرارة هنا؟" },
  { en: "How much rain falls per year?", ar: "كم تبلغ الأمطار في السنة؟" },
  { en: "What do GWETTOP and GWETROOT mean?", ar: "ماذا تعني GWETTOP وGWETROOT؟" },
  { en: "Compare Egypt and India fairly", ar: "قارن بين مصر والهند مقارنة عادلة" },
  { en: "Which crop should I plant?", ar: "أي محصول أزرع؟" },
  { en: "Do you use NDVI or SMAP?", ar: "هل تستخدمون NDVI أو SMAP؟" },
];

export default function Guide() {
  const { t, ar, go, cc } = useApp();
  const [msgs, setMsgs] = useState([{ role: "bot", id: 0, en: "Peace be with you. I'm the Sopdet guide. I explain the NASA POWER data in SOPDET FARMSHIELD using numbers computed from the files for the country you selected. I run on simple rules with no AI model, so I only report what is in the data: no advice, no predictions. What would you like to know?", ar: "سلامٌ عليك. أنا مرشد سوبدت. أشرح بيانات NASA POWER في سوبدت فارم شيلد بأرقام محسوبة من ملفات الدولة التي اخترتها. أعمل بقواعد بسيطة دون نموذج ذكاء اصطناعي، فأنقل فقط ما في البيانات: لا نصائح ولا تنبؤات. ماذا تريد أن تعرف؟", quick: true }]);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(null);
  const log = useRef(null), idc = useRef(1), timer = useRef(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [msgs, typing]);
  useEffect(() => () => { clearTimeout(timer.current); try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const push = (m) => setMsgs((x) => [...x, { id: idc.current++, ...m }]);
  const ask = (q) => {
    if (!q.trim()) return;
    push({ role: "me", en: q, ar: q });
    setText("");
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setTyping(false); push({ role: "bot", ...answer(q, cc) }); }, 450);
  };

  const speak = (m) => {
    if (!canSpeak) return;
    const synth = window.speechSynthesis;
    if (speaking === m.id) { synth.cancel(); setSpeaking(null); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(ar ? m.ar : m.en);
    u.lang = ar ? "ar-EG" : "en-US"; u.rate = 0.95;
    u.onend = () => setSpeaking(null); u.onerror = () => setSpeaking(null);
    setSpeaking(m.id); synth.speak(u);
  };

  const label = { planner: t("Open Crop Rotation Planner", "افتح مخطط الدورة الزراعية"), insights: t("Open Climate Insights", "افتح تحليلات المناخ"), sources: t("Data sources & methodology", "المصادر والمنهجية"), expert: t("Open Expert Dashboard", "افتح لوحة الخبير"), map: t("Location & coverage", "الموقع والتغطية") };

  return (
    <>
      <PageHead eyebrow={t("Farm Data Guide", "مرشد بيانات المزرعة")} title={t("A guide that explains the data, nothing more", "مرشد يشرح البيانات ولا شيء غيرها")}
        lead={t("Ask what a variable means or what the numbers say for the country you selected. Answers are computed from the NASA POWER files. There is no AI model, advice or prediction.", "اسأل عن معنى أي متغير أو ما تقوله الأرقام للدولة التي اخترتها. الإجابات محسوبة من ملفات NASA POWER. لا يوجد نموذج ذكاء اصطناعي ولا نصائح ولا تنبؤات.")} />
      <div className="guide-grid">
        <section className="card chat" aria-label={t("Conversation", "المحادثة")}>
          <div className="chat-head">
            <GuideAvatar size={52} speaking={speaking != null} />
            <div style={{ flex: 1, minWidth: 0 }}><div className="display" style={{ fontSize: 21 }}>{t("Sopdet Guide", "مرشد سوبدت")}</div><div className="tip">{t("Rule-based · no AI model connected", "قائم على قواعد · لا يوجد نموذج ذكاء اصطناعي")}</div></div>
            <button className="btn sm ghost" onClick={() => go("dashboard")}>{t("Dashboard", "اللوحة")}</button>
          </div>
          <div className="chat-log" ref={log} aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`msg ${m.role === "me" ? "me" : ""}`}>
                {m.role === "bot" && <GuideAvatar size={34} />}
                <div>
                  <div className="bubble">
                    {ar ? m.ar : m.en}
                    {m.role === "bot" && (
                      <div className="meta">
                        {m.data && <DataType k="nasa" />}
                        {canSpeak && <button className="btn sm ghost" onClick={() => speak(m)} aria-pressed={speaking === m.id}><Icon name={speaking === m.id ? "pause" : "volume"} size={15} />{speaking === m.id ? t("Stop", "إيقاف") : t("Listen", "استمع")}</button>}
                      </div>
                    )}
                  </div>
                  {m.actions && <div className="quick" style={{ marginTop: 8 }}>{m.actions.map((a) => <button key={a} onClick={() => go(a)}>{label[a]}</button>)}</div>}
                  {m.quick && <div className="quick" style={{ marginTop: 8 }}>{SUGGEST.slice(0, 3).map((s, i) => <button key={i} onClick={() => ask(ar ? s.ar : s.en)}>{ar ? s.ar : s.en}</button>)}</div>}
                </div>
              </div>
            ))}
            {typing && <div className="msg"><GuideAvatar size={34} /><div className="bubble"><span className="typing"><i /><i /><i /></span></div></div>}
          </div>
          <form className="chat-in" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
            <input id="chat-input" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Ask about temperature, rain, soil wetness, the data…", "اسأل عن الحرارة أو الأمطار أو رطوبة التربة أو البيانات…")} aria-label={t("Message", "رسالة")} />
            <button className="btn primary" type="submit" aria-label={t("Send", "إرسال")}><Icon name="send" size={18} className="flip" /><span className="sr">{t("Send", "إرسال")}</span></button>
          </form>
        </section>

        <aside className="stack">
          <div className="card dark stack" style={{ justifyItems: "center", textAlign: "center", padding: 24 }}>
            <GuideAvatar size={96} speaking={speaking != null} />
            <div className="display" style={{ fontSize: 22 }}>{t("Sopdet Guide", "مرشد سوبدت")}</div>
            <p className="muted" style={{ fontSize: 13.5 }}>{t("Answering for:", "أجيب عن:")} <b>{ar ? COUNTRIES[cc].ar : COUNTRIES[cc].en}</b> · {point(cc).region}</p>
          </div>
          <div className="card stack">
            <h3 style={{ fontSize: 18 }}>{t("What I can and cannot do", "ما أستطيعه وما لا أستطيعه")}</h3>
            <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, fontSize: 13.5, display: "grid", gap: 6 }}>
              <li>{t("Can: explain the 9 NASA POWER variables and report their numbers", "أستطيع: شرح متغيرات NASA POWER التسعة وذكر أرقامها")}</li>
              <li>{t("Can: say what is and is not integrated", "أستطيع: بيان ما هو مدمج وما ليس مدمجًا")}</li>
              <li>{t("Cannot: advise, predict or recommend a crop", "لا أستطيع: النصح أو التنبؤ أو التوصية بمحصول")}</li>
              <li>{t("Cannot: show satellite data (none provided)", "لا أستطيع: عرض بيانات أقمار (لم تُقدَّم)")}</li>
            </ul>
          </div>
          <div className="card stack">
            <h3 style={{ fontSize: 18 }}>{t("Try asking", "جرّب أن تسأل")}</h3>
            <div className="quick" style={{ flexDirection: "column", alignItems: "stretch" }}>
              {SUGGEST.map((s, i) => <button key={i} style={{ textAlign: "start", borderRadius: 12 }} onClick={() => ask(ar ? s.ar : s.en)}>{ar ? s.ar : s.en}</button>)}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
