import React, { useState } from "react";
import { useApp } from "../app-context.jsx";
import { COUNTRIES, COUNTRY_KEYS, img } from "../data.js";
import { POINTS, point, merraCell, distKm, toRad, fmt, iso } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { Demo, PageHead, SourcesLink, DataType, Disclaimer } from "../components/ui.jsx";
import { NOT_INTEGRATED } from "./Sources.jsx";

const W = 160, H = 104;

export default function MapPage() {
  const { t, ar, cc, farm } = useApp();
  const [grid, setGrid] = useState(true);
  const p = point(cc), C = COUNTRIES[cc], cell = merraCell(p.lat, p.lon);

  /* Schematic frame, 3° of latitude tall, drawn with true proportions at this latitude. No coastlines: no geographic data is provided. */
  const latSpan = 3, kmH = latSpan * 111.32, kmW = kmH * (W / H), cosLat = Math.cos(toRad(p.lat)), lonSpan = kmW / (111.32 * cosLat);
  const lat1 = p.lat + latSpan / 2, lon0 = p.lon - lonSpan / 2;
  const X = (lon) => ((lon - lon0) / lonSpan) * W, Y = (lat) => ((lat1 - lat) / latSpan) * H;
  const latLines = [], lonLines = [];
  for (let j = Math.ceil((p.lat - latSpan / 2 + 90) / 0.5); -90 + 0.5 * j <= lat1; j++) latLines.push(-90 + 0.5 * j);
  for (let k = Math.ceil((lon0 + 180) / 0.625); -180 + 0.625 * k <= lon0 + lonSpan; k++) lonLines.push(-180 + 0.625 * k);

  const hasFarm = farm.lat != null && farm.lon != null && Math.abs(farm.lat) <= 90 && Math.abs(farm.lon) <= 180;
  const inFrame = hasFarm && farm.lat <= lat1 && farm.lat >= lat1 - latSpan && farm.lon >= lon0 && farm.lon <= lon0 + lonSpan;
  const dist = hasFarm ? distKm(farm.lat, farm.lon, p.lat, p.lon) : null;
  const scale100 = (100 / kmW) * W;

  return (
    <>
      <PageHead eyebrow={t("Location & coverage", "الموقع والتغطية")} title={t("Where the numbers come from", "من أين تأتي الأرقام")}
        lead={t("This is not a satellite map. No satellite imagery or spatial layers are in the project. It shows the one NASA POWER grid cell behind each country's numbers, drawn from its real coordinates.", "هذه ليست خريطة أقمار صناعية. لا توجد في المشروع صور أقمار ولا طبقات مكانية. تعرض الخلية الشبكية الواحدة من NASA POWER خلف أرقام كل دولة، مرسومة من إحداثياتها الحقيقية.")} right={<SourcesLink />} />

      <div className="mapwrap">
        <div className="stack">
          <div className="map" role="img" aria-label={t("Schematic of the NASA POWER grid cell and your location", "رسم تخطيطي لخلية NASA POWER وموقعك")} style={{ background: "var(--olive-900)" }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ direction: "ltr" }}>
              <rect width={W} height={H} fill="#1d2414" />
              {grid && <g stroke="rgba(216,180,99,.25)" strokeWidth=".25">
                {latLines.map((la) => <line key={"a" + la} x1="0" x2={W} y1={Y(la)} y2={Y(la)} />)}
                {lonLines.map((lo) => <line key={"o" + lo} y1="0" y2={H} x1={X(lo)} x2={X(lo)} />)}
              </g>}
              <rect x={X(cell.lonMin)} y={Y(cell.latMax)} width={X(cell.lonMax) - X(cell.lonMin)} height={Y(cell.latMin) - Y(cell.latMax)} fill="rgba(216,180,99,.18)" stroke="#E2BF6E" strokeWidth=".6" strokeDasharray="2 1.2" />
              <text x={X(cell.lonMin)} y={Y(cell.latMax) - 1.6} fontSize="3.2" fill="#E2BF6E" fontFamily="IBM Plex Mono, monospace">MERRA-2 cell ≈ {fmt(cell.kmNS, 0)}×{fmt(cell.kmEW, 0)} km</text>
              <circle cx={X(p.lon)} cy={Y(p.lat)} r="2" fill="#E2BF6E" stroke="#1d2414" strokeWidth=".6" />
              <text x={X(p.lon) + 3} y={Y(p.lat) + 1.2} fontSize="3.2" fill="#F1E9D6" fontFamily="IBM Plex Mono, monospace">NASA POWER point</text>
              {inFrame && <g><circle cx={X(farm.lon)} cy={Y(farm.lat)} r="1.8" fill="#cd7b56" stroke="#F1E9D6" strokeWidth=".5" /><text x={X(farm.lon) + 3} y={Y(farm.lat) + 1.2} fontSize="3.2" fill="#f0b49a" fontFamily="IBM Plex Mono, monospace">{ar ? "موقعك" : "your location"}</text></g>}
              <g stroke="#F1E9D6" strokeWidth=".7"><line x1="6" x2={6 + scale100} y1={H - 6} y2={H - 6} /><line x1="6" x2="6" y1={H - 7.5} y2={H - 4.5} /><line x1={6 + scale100} x2={6 + scale100} y1={H - 7.5} y2={H - 4.5} /></g>
              <text x="6" y={H - 9} fontSize="3.2" fill="#F1E9D6" fontFamily="IBM Plex Mono, monospace">100 km</text>
              <text x={W - 4} y="6" textAnchor="end" fontSize="3" fill="rgba(241,233,214,.7)" fontFamily="IBM Plex Mono, monospace">{fmt(p.lat, 4)}°N {fmt(p.lon, 4)}°E</text>
            </svg>
            <div className="tools"><div className="glass" style={{ padding: "6px 10px", fontSize: 12.5 }}>{t("Schematic · no coastlines or imagery", "رسم تخطيطي · بلا سواحل أو صور")}</div></div>
          </div>
          <div className="card row" style={{ gap: 14, justifyContent: "space-between" }}>
            <div className="chips">{COUNTRY_KEYS.map((k) => <span key={k} className="pill" style={k === cc ? { background: "var(--olive-700)", color: "var(--limestone)" } : undefined}>{ar ? COUNTRIES[k].ar : COUNTRIES[k].en}: {ar ? COUNTRIES[k].place.ar : COUNTRIES[k].place.en}</span>)}</div>
            <button className="chip" aria-pressed={grid} onClick={() => setGrid(!grid)}>{t("MERRA-2 grid lines", "خطوط شبكة MERRA-2")}</button>
          </div>
          <p className="tip">{t("The cell is drawn from the MERRA-2 grid definition (0.5° latitude × 0.625° longitude), so its edges are approximate. Switch country in the top bar to move the frame.", "الخلية مرسومة من تعريف شبكة MERRA-2 (0.5° عرض × 0.625° طول) لذا حدودها تقريبية. بدّل الدولة من الشريط العلوي لتنتقل اللوحة.")}</p>
        </div>

        <aside className="stack">
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3 style={{ fontSize: 18 }}>{t("Selected point", "النقطة المحددة")}</h3><DataType k="nasa" /></div>
            <dl className="mono" style={{ margin: 0, fontSize: 12.5, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }} dir="ltr">
              <dt>region</dt><dd style={{ margin: 0 }}>{p.region}</dd><dt>lat, lon</dt><dd style={{ margin: 0 }}>{p.lat}, {p.lon}</dd><dt>elevation</dt><dd style={{ margin: 0 }}>{p.elevation_m} m (cell avg)</dd><dt>dates</dt><dd style={{ margin: 0 }}>{p.start} → {p.end}</dd>
            </dl>
          </div>
          <div className="card stack">
            <h3 style={{ fontSize: 18 }}>{t("Your farm location", "موقع مزرعتك")}</h3>
            {hasFarm ? <p style={{ fontSize: 14.5 }}>{t(`${fmt(dist, 0)} km from the data point. ${dist > 50 ? "Outside this grid cell's scale: the numbers describe another area." : "Near the point, but values average the whole cell."}`, `تبعد ${fmt(dist, 0)} كم عن نقطة البيانات. ${dist > 50 ? "خارج مقياس هذه الخلية: الأرقام تصف منطقة أخرى." : "قريبة من النقطة، لكن القيم متوسط للخلية كلها."}`)}</p> : <p className="muted" style={{ fontSize: 14 }}>{t("Not entered. Add coordinates in Farm Setup to see the distance.", "لم تُدخل. أضف الإحداثيات في إعداد المزرعة لترى المسافة.")}</p>}
          </div>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3 style={{ fontSize: 18 }}>{t("Map layers", "طبقات الخريطة")}</h3><DataType k="none" /></div>
            <div className="layers">
              {NOT_INTEGRATED.map((d) => <button key={d.name} disabled aria-disabled="true" style={{ opacity: .6, cursor: "not-allowed" }}><span className="sw" style={{ background: "repeating-linear-gradient(45deg,#e7d5b1,#e7d5b1 4px,#f1e9d6 4px,#f1e9d6 8px)" }} /><span><b style={{ fontSize: 14 }}>{d.name}</b><br /><span className="tip">{t("No data file provided", "لا يوجد ملف بيانات")}</span></span></button>)}
            </div>
          </div>
          <div className="photo-tile" style={{ "--img": img("satellite"), minHeight: 150 }}><div className="in"><Demo dark>{t("Illustrative image", "صورة توضيحية")}</Demo><span className="tip" style={{ color: "rgba(241,233,214,.8)" }}>{t("Decorative. Not a satellite observation and not this farm.", "تزيينية. ليست رصدًا فضائيًا وليست هذه المزرعة.")}</span></div></div>
        </aside>
      </div>
      <Disclaimer />
    </>
  );
}
