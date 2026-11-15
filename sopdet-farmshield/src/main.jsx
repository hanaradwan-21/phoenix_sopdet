import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AppProvider, useApp } from "./app-context.jsx";
import Shell from "./components/Shell.jsx";
import Icon from "./components/Icon.jsx";
import { FAVICON_URI } from "./components/Logo.jsx";
import Intro from "./pages/Intro.jsx";
import Welcome from "./pages/Welcome.jsx";
import Setup from "./pages/Setup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Insights from "./pages/Insights.jsx";
import Guide from "./pages/Guide.jsx";
import Planner from "./pages/Planner.jsx";
import Expert from "./pages/Expert.jsx";
import MapPage from "./pages/MapPage.jsx";
import Sources, { SourcesPanel, Restrictions } from "./pages/Sources.jsx";

const PAGES = { setup: Setup, dashboard: Dashboard, insights: Insights, guide: Guide, planner: Planner, expert: Expert, map: MapPage, sources: Sources };

/* Shared Data Sources & Methodology panel, opened from scientific pages */
function SourcesDrawer() {
  const { sourcesOpen, setSourcesOpen, t, go } = useApp();
  useEffect(() => {
    if (!sourcesOpen) return;
    const k = (e) => e.key === "Escape" && setSourcesOpen(false);
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [sourcesOpen]);
  if (!sourcesOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", justifyContent: "flex-end" }} role="dialog" aria-modal="true" aria-label={t("Data sources and methodology", "مصادر البيانات والمنهجية")}>
      <div onClick={() => setSourcesOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,25,13,.55)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", width: "min(560px, 100%)", background: "var(--limestone)", height: "100%", overflowY: "auto", padding: "22px 22px 40px", display: "grid", gap: 18, alignContent: "start", boxShadow: "-20px 0 50px rgba(0,0,0,.3)" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="display" style={{ fontSize: 26 }}>{t("Data sources & methodology", "مصادر البيانات والمنهجية")}</h2>
          <button className="btn sm" onClick={() => setSourcesOpen(false)} aria-label={t("Close", "إغلاق")}><Icon name="x" size={16} /></button>
        </div>
        <div className="card dark"><Restrictions /></div>
        <SourcesPanel compact />
        <button className="btn primary" onClick={() => { setSourcesOpen(false); go("sources"); }}>{t("Open the full methodology page", "افتح صفحة المنهجية كاملة")}<Icon name="arrow" size={17} className="flip" /></button>
      </div>
    </div>
  );
}

function Router() {
  const { route } = useApp();
  useEffect(() => {
    try { let l = document.querySelector("link[rel=icon]"); if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); } l.href = FAVICON_URI; } catch {}
  }, []);
  if (route === "intro") return <Intro />;
  if (route === "welcome") return <Welcome />;
  const Page = PAGES[route] || Dashboard;
  return <><Shell><Page /></Shell><SourcesDrawer /></>;
}

createRoot(document.getElementById("root")).render(<AppProvider><Router /></AppProvider>);
