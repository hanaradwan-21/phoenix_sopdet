import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../app-context.jsx";
import { MEDIA } from "../data.js";
import { Wordmark } from "../components/Logo.jsx";
import Icon from "../components/Icon.jsx";
import { LangSwitch, Demo } from "../components/ui.jsx";

/* Scene timing in ms. Scenes 0–4 total ≈ 13.5 s, then the logo reveal waits for "Enter". */
const DUR = [2900, 2900, 2500, 2500, 3500];

/* Nile Delta focus on image 05, in % of the stage (image aspect 2576×1438). */
const DELTA = { cx: 49.5, cy: 41.5 };

function ScanOverlay() {
  const pts = [[44, 38], [47, 40], [50, 38.5], [52.5, 41], [46, 43], [49, 44], [54, 43], [51, 36.5], [43, 41.5], [55, 39.5], [48, 46], [52, 46.5]];
  const vlines = Array.from({ length: 13 }, (_, i) => 40 + i * 1.8);
  const hlines = Array.from({ length: 9 }, (_, i) => 34 + i * 1.7);
  return (
    <div className="scan" aria-hidden="true">
      <svg viewBox="0 0 100 55.8" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sg" x1="0" x2="1"><stop offset="0" stopColor="#35b1a6" stopOpacity="0" /><stop offset=".5" stopColor="#7fd8cf" stopOpacity=".9" /><stop offset="1" stopColor="#35b1a6" stopOpacity="0" /></linearGradient>
          <clipPath id="cp"><polygon points="39,20 61,20 62,29 38,29" /></clipPath>
        </defs>
        <g clipPath="url(#cp)" transform="translate(0 0)">
          {/* geospatial lattice, drawn in on arrival */}
          <g stroke="#7fd8cf" strokeWidth=".09" opacity=".8" fill="none">
            {vlines.map((x, i) => <line key={"v" + i} x1={x * 0.98 - 0.7} y1="19" x2={x * 0.98 - 0.7 + (i - 6) * 0.2} y2="31" pathLength="1" className="grid-draw" style={{ animationDelay: `${0.4 + i * 0.07}s` }} />)}
            {hlines.map((y, i) => <line key={"h" + i} x1="38" y1={y * 0.55 + 1.6} x2="63" y2={y * 0.55 + 1.6 + (i - 4) * 0.04} pathLength="1" className="grid-draw" style={{ animationDelay: `${0.9 + i * 0.08}s` }} />)}
          </g>
          {/* scan beam */}
          <g className="sweep" style={{ "--sw": "20px" }}>
            <rect x="38" y="19" width="3.4" height="11" fill="url(#sg)" />
          </g>
        </g>
        {/* outline of area of interest */}
        <polygon points="39,20 61,20 62,29 38,29" fill="none" stroke="#7fd8cf" strokeWidth=".16" strokeDasharray=".8 .5" opacity=".9" />
        {[[39, 20], [61, 20], [62, 29], [38, 29]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".35" fill="#7fd8cf" />)}
        {pts.map(([x, y], i) => <circle key={i} className="dot" cx={x} cy={y * 0.55 - 0.5} r=".28" fill="#bff5ee" style={{ animationDelay: `${i * 0.23}s` }} />)}
        <text x="39.2" y="18.9" fontSize="1.25" fill="#bff5ee" stroke="#06100f" strokeWidth=".3" paintOrder="stroke" fontFamily="IBM Plex Mono, monospace" letterSpacing=".08">NILE DELTA · 30.8°N 31.0°E</text>
        <text x="39.2" y="30.9" fontSize=".95" fill="#bff5ee" stroke="#06100f" strokeWidth=".3" paintOrder="stroke" fontFamily="IBM Plex Mono, monospace" letterSpacing=".06">ILLUSTRATIVE OVERLAY · DEMO</text>
      </svg>
    </div>
  );
}

export default function Intro() {
  const { go, t, ar } = useApp();
  const [scene, setScene] = useState(0); // 0..4 media, 5 = logo
  const v1 = useRef(null), v2 = useRef(null);

  useEffect(() => {
    if (scene > 4) return;
    const id = setTimeout(() => setScene((s) => s + 1), DUR[scene]);
    return () => clearTimeout(id);
  }, [scene]);

  useEffect(() => {
    [[v1, 0], [v2, 1]].forEach(([r, i]) => {
      const v = r.current; if (!v) return;
      if (scene === i) { try { v.currentTime = 0; v.muted = true; const p = v.play(); p && p.catch(() => {}); } catch {} }
      else if (scene > i + 0 && scene !== i) { setTimeout(() => { try { v.pause(); } catch {} }, 1200); }
    });
  }, [scene]);

  const caps = [
    { e: t("Chapter I", "الفصل الأول"), h: t("Ancient Egypt", "مصر القديمة"), p: t("Eight thousand harvests began along one river.", "بدأت الزراعة على ضفاف نهر واحد قبل آلاف السنين.") },
    { e: t("Chapter II", "الفصل الثاني"), h: t("The Sopdet Star", "نجم سوبدت"), p: t("When Sirius rose before dawn, the flood, and the farming year, was near.", "حين يظهر سيريوس قبل الفجر، يقترب الفيضان وتبدأ السنة الزراعية.") },
    { e: t("Chapter III", "الفصل الثالث"), h: t("The Nile Recedes, Life Begins", "ينحسر النيل وتبدأ الحياة"), p: t("Silt-rich soil is left behind, and the first seeds go in.", "تبقى تربة غنية بالطمي، وتُزرع البذور الأولى.") },
    { e: t("Chapter IV", "الفصل الرابع"), h: t("The Nile Today", "النيل اليوم"), p: t("Canals, fields and cities still follow the same river.", "الترع والحقول والمدن لا تزال تتبع النهر نفسه.") },
    { e: t("Chapter V", "الفصل الخامس"), h: t("From Earth to Space", "من الأرض إلى الفضاء"), p: t("Satellites now watch the Delta, season after season.", "الأقمار الصناعية تراقب الدلتا الآن، موسمًا بعد موسم.") },
  ];
  const Cap = ({ i }) => (
    <div className="cap"><div className="eyebrow">{caps[i].e}</div><h2>{caps[i].h}</h2><p>{caps[i].p}</p></div>
  );

  return (
    <div className="intro" dir={ar ? "rtl" : "ltr"}>
      <div className="stars-bg" />
      {/* 1 · Ancient Egypt (video) */}
      <section className={`scene ${scene === 0 ? "on" : ""}`}>
        <video ref={v1} src={MEDIA.ancient} muted playsInline preload="auto" aria-hidden="true" />
        <Cap i={0} />
      </section>
      {/* 2 · Sopdet star (video) */}
      <section className={`scene ${scene === 1 ? "on" : ""}`}>
        <video ref={v2} src={MEDIA.star} muted playsInline preload="auto" aria-hidden="true" />
        <Cap i={1} />
      </section>
      {/* 3 · Nile recedes (image, CSS camera move) */}
      <section className={`scene ${scene === 2 ? "on" : ""}`}>
        <div className="stage"><div className="kb a" style={{ backgroundImage: `url(${MEDIA.recedes})` }} /></div>
        <Cap i={2} />
      </section>
      {/* 4 · Nile today */}
      <section className={`scene ${scene === 3 ? "on" : ""}`}>
        <div className="stage"><div className="kb b" style={{ backgroundImage: `url(${MEDIA.today})` }} /></div>
        <Cap i={3} />
      </section>
      {/* 5 · Earth to space + scanning */}
      <section className={`scene ${scene === 4 ? "on" : ""}`}>
        <div className="stage">
          <div className="kb c" style={{ backgroundImage: `url(${MEDIA.space})`, transformOrigin: `${DELTA.cx}% ${DELTA.cy}%` }}>
            {scene === 4 && <ScanOverlay />}
          </div>
        </div>
        <Cap i={4} />
      </section>

      {/* Logo reveal */}
      <section className={`logo-scene ${scene === 5 ? "on" : ""}`} aria-live="polite">
        <div className="bg" style={{ backgroundImage: `url(${MEDIA.space})` }} />
        <div className="fade" />
        <div className="logo-wrap">
          {scene === 5 && <Wordmark tone="dark" width={Math.min(620, typeof window !== "undefined" ? window.innerWidth - 56 : 620)} animate go title="SOPDET FARMSHIELD" />}
          <div className="tagline">{t("From Stars to Soil.", "من النجوم إلى التربة.")}</div>
          <button className="btn gold lg enter-btn" onClick={() => go("welcome")}>{t("Enter SOPDET", "ادخل إلى سوبدت")}<Icon name="arrow" size={20} className="flip" /></button>
        </div>
      </section>

      <div className="intro-top">
        <div className="row" style={{ gap: 10 }}><LangSwitch dark /></div>
        <div className="row" style={{ gap: 10 }}>
          {scene === 5 && <button className="btn dark sm" onClick={() => setScene(0)}><Icon name="replay" size={15} />{t("Replay", "إعادة")}</button>}
          {scene < 5 && <button className="btn dark sm" onClick={() => go("welcome")}><Icon name="skip" size={15} className="flip" />{t("Skip Intro", "تخطي المقدمة")}</button>}
        </div>
      </div>
      <div className="intro-prog" aria-hidden="true">
        {DUR.map((d, i) => <i key={i} className={scene > i ? "done" : scene === i ? "run" : ""} style={{ "--dur": `${d}ms` }} />)}
        <i className={scene === 5 ? "done" : ""} />
      </div>
    </div>
  );
}
