import React, { useEffect, useRef } from "react";
import { useApp } from "../app-context.jsx";
import Icon from "./Icon.jsx";
import { Wordmark, Emblem } from "./Logo.jsx";
import { LangSwitch, ModeSwitch, CountrySwitch } from "./ui.jsx";

/* Navigation. The internal "Brand & Design System" documentation page is not part of the farmer-facing app. */
export const NAV = [
  { r: "dashboard", icon: "home", en: "Dashboard", ar: "لوحة المزرعة", short: ["Home", "الرئيسية"], grp: 0 },
  { r: "insights", icon: "sprout", en: "Climate Insights", ar: "تحليلات المناخ", short: ["Climate", "المناخ"], grp: 0 },
  { r: "guide", icon: "star", en: "Farm Data Guide", ar: "مرشد بيانات المزرعة", short: ["Guide", "المرشد"], grp: 0 },
  { r: "planner", icon: "rotate", en: "Crop Rotation Planner", ar: "مخطط الدورة الزراعية", short: ["Rotate", "الدورة"], grp: 0 },
  { r: "expert", icon: "gauge", en: "Expert Dashboard", ar: "لوحة الخبير", short: ["Expert", "الخبير"], grp: 1 },
  { r: "map", icon: "map", en: "Location & Coverage", ar: "الموقع والتغطية", short: ["Map", "الموقع"], grp: 1 },
  { r: "sources", icon: "book", en: "Data Sources & Methodology", ar: "المصادر والمنهجية", short: ["Sources", "المصادر"], grp: 1 },
  { r: "setup", icon: "pin", en: "Farm Setup", ar: "إعداد المزرعة", short: ["Setup", "الإعداد"], grp: 2 },
];

export default function Shell({ children }) {
  const { route, go, t, ar } = useApp();
  const mnav = useRef(null);
  /* the bottom bar scrolls sideways on phones: keep the current page in view */
  useEffect(() => {
    const el = mnav.current?.querySelector('[aria-current="page"]');
    try { el?.scrollIntoView({ inline: "center", block: "nearest" }); } catch {}
  }, [route, ar]);
  const item = (n) => (
    <button key={n.r} aria-current={route === n.r ? "page" : undefined} onClick={() => go(n.r)}><Icon name={n.icon} size={19} />{ar ? n.ar : n.en}</button>
  );
  return (
    <div className="app">
      <aside className="side" aria-label={t("Main navigation", "التنقل الرئيسي")}>
        <button className="brand" onClick={() => go("welcome")} aria-label="SOPDET FARMSHIELD"><Wordmark tone="dark" width={176} /></button>
        <nav className="nav">
          <div className="grp">{t("Farm", "المزرعة")}</div>
          {NAV.filter((n) => n.grp === 0).map(item)}
          <div className="grp">{t("Science", "العلوم")}</div>
          {NAV.filter((n) => n.grp === 1).map(item)}
          <div className="grp">{t("Project", "المشروع")}</div>
          {NAV.filter((n) => n.grp === 2).map(item)}
          <button onClick={() => go("intro")}><Icon name="replay" size={19} />{t("Replay intro", "إعادة المقدمة")}</button>
        </nav>
        <div className="foot">
          <div>{t("From Stars to Soil.", "من النجوم إلى التربة.")}</div>
          <div>{t("Student project · not affiliated with NASA", "مشروع طلابي · غير تابع لناسا")}</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="mbrand" onClick={() => go("welcome")} aria-label="SOPDET FARMSHIELD"><Emblem tone="light" size={34} /></button>
          <div className="notice"><span className="pill good">NASA POWER</span>{t("Real climate data · no prediction model connected", "بيانات مناخية حقيقية · لا يوجد نموذج تنبؤ متصل")}</div>
          <div className="grow" />
          <CountrySwitch />
          <ModeSwitch />
          <LangSwitch />
        </header>
        <main className="page" key={route}>{children}</main>
      </div>

      <nav className="mobile-nav" ref={mnav} aria-label={t("Main navigation", "التنقل الرئيسي")}>
        {NAV.map((n) => (
          <button key={n.r} aria-current={route === n.r ? "page" : undefined} onClick={() => go(n.r)}><Icon name={n.icon} size={20} />{ar ? n.short[1] : n.short[0]}</button>
        ))}
      </nav>
    </div>
  );
}
