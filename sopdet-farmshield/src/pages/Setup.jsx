import React, { useState } from "react";
import { useApp } from "../app-context.jsx";
import { COUNTRIES, COUNTRY_KEYS, AREA_UNITS, CROPS, CROP_KEYS, SOILS, DEFAULT_FARM, img } from "../data.js";
import { point, distKm, merraCell, fmt } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { PageHead } from "../components/ui.jsx";

export default function Setup() {
  const { t, ar, farm, setFarm, go, cc, setCountry } = useApp();
  const [, setSaved] = useState(false);
  const set = (k, v) => { setSaved(false); setFarm((f) => ({ ...f, [k]: v })); };
  const num = (v) => (v === "" || Number.isNaN(Number(v)) ? null : Number(v)); // empty stays null, never 0
  const unitM2 = AREA_UNITS.find((u) => u.k === farm.unit).m2;
  const p = point(cc), C = COUNTRIES[cc], cell = merraCell(p.lat, p.lon);
  const hasLoc = farm.lat != null && farm.lon != null && Math.abs(farm.lat) <= 90 && Math.abs(farm.lon) <= 180;
  const dist = hasLoc ? distKm(farm.lat, farm.lon, p.lat, p.lon) : null;

  const payload = {
    country: cc, nasa_power_point: { region: p.region, lat: p.lat, lon: p.lon },
    farm_location: hasLoc ? [farm.lat, farm.lon] : null, distance_to_point_km: dist == null ? null : Math.round(dist),
    area: farm.area, area_unit: farm.unit, crop_current: farm.current, crop_previous: farm.previous, season: farm.season,
    soil_type: farm.soil, soil_ph: farm.ph, soil_ec_dS_m: farm.ec, soil_organic_matter_pct: farm.om,
  };
  const CropSelect = ({ id, k }) => (
    <select id={id} className="input" value={farm[k] ?? ""} onChange={(e) => set(k, e.target.value || null)}>
      <option value="">{t("I don't know", "لا أعرف")}</option>
      {CROP_KEYS.map((c) => <option key={c} value={c}>{ar ? CROPS[c].ar : CROPS[c].en}</option>)}
    </select>
  );

  return (
    <>
      <PageHead eyebrow={t("Farm setup", "إعداد المزرعة")} title={t("Tell us about your field", "حدّثنا عن حقلك")}
        lead={t("Answer what you know. Anything you leave blank stays unknown and is never treated as zero.", "أجب عمّا تعرفه. أي حقل تتركه فارغًا يبقى «غير معروف» ولا يُعامل على أنه صفر.")} />
      <form className="grid g-main" onSubmit={(e) => { e.preventDefault(); setFarm((f) => ({ ...f, isSample: false })); go("dashboard"); }} style={{ alignItems: "start" }}>
        <div className="stack" style={{ gap: 18 }}>
          <section className="card stack">
            <h3>{t("Where is the farm?", "أين تقع المزرعة؟")}</h3>
            <label className="fl">{t("Country (selects the NASA POWER data)", "الدولة (تحدد بيانات NASA POWER)")}
              <select id="country" className="input" value={cc} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRY_KEYS.map((k) => <option key={k} value={k}>{ar ? COUNTRIES[k].ar : COUNTRIES[k].en}</option>)}
              </select>
            </label>
            <div className="note" style={{ borderStyle: "solid" }}><Icon name="pin" size={18} /><span>{t(`Only two NASA POWER points are in this project. For ${C.en} it is ${C.place.en} (${fmt(p.lat, 4)}°N, ${fmt(p.lon, 4)}°E), one grid cell of about ${fmt(cell.kmNS, 0)} × ${fmt(cell.kmEW, 0)} km. It does not represent the whole country or every governorate.`, `يوجد في المشروع نقطتان فقط من NASA POWER. لـ${C.ar} هي ${C.place.ar} (${fmt(p.lat, 4)}°ش، ${fmt(p.lon, 4)}°ق)، خلية شبكية بحجم نحو ${fmt(cell.kmNS, 0)} × ${fmt(cell.kmEW, 0)} كم. لا تمثل الدولة كلها ولا كل المحافظات.`)}</span></div>
            <div className="grid g2">
              <label className="fl">{t("Your latitude (optional)", "خط عرض موقعك (اختياري)")}
                <input id="lat" className="input mono" inputMode="decimal" placeholder={String(p.lat)} value={farm.lat ?? ""} onChange={(e) => set("lat", num(e.target.value))} />
              </label>
              <label className="fl">{t("Your longitude (optional)", "خط طول موقعك (اختياري)")}
                <input id="lon" className="input mono" inputMode="decimal" placeholder={String(p.lon)} value={farm.lon ?? ""} onChange={(e) => set("lon", num(e.target.value))} />
              </label>
            </div>
            {dist != null && <div className="tip">{t(`Your location is about ${fmt(dist, 0)} km from the data point. ${dist > 50 ? "That is farther than one grid cell, so these numbers describe a different area from yours." : "Inside roughly one grid cell, but the values are still an average over the whole cell."}`, `موقعك يبعد نحو ${fmt(dist, 0)} كم عن نقطة البيانات. ${dist > 50 ? "أبعد من خلية شبكية واحدة، فهذه الأرقام تصف منطقة مختلفة عن منطقتك." : "ضمن خلية شبكية واحدة تقريبًا، لكن القيم تظل متوسطًا لكامل الخلية."}`)}</div>}
            <div className="row">
              <button type="button" className="btn sm" onClick={() => setFarm((f) => ({ ...f, lat: p.lat, lon: p.lon }))}><Icon name="pin" size={15} />{t("Use the data point's location", "استخدم موقع نقطة البيانات")}</button>
              <button type="button" className="btn sm ghost" onClick={() => setFarm((f) => ({ ...f, lat: null, lon: null }))}>{t("I'd rather not say", "أفضّل عدم التحديد")}</button>
            </div>
            <p className="tip">{t("Coordinates are only used to show the distance above. Entering them does not fetch new data.", "الإحداثيات تُستخدم فقط لعرض المسافة أعلاه. إدخالها لا يجلب بيانات جديدة.")}</p>
          </section>

          <section className="card stack">
            <h3>{t("Size and crops", "المساحة والمحاصيل")}</h3>
            <div className="grid g2">
              <label className="fl">{t("Farm area", "مساحة المزرعة")}
                <input id="area" className="input mono" inputMode="decimal" value={farm.area ?? ""} placeholder={t("Unknown", "غير معروفة")} onChange={(e) => set("area", num(e.target.value))} />
              </label>
              <label className="fl">{t("Unit", "الوحدة")}
                <select id="unit" className="input" value={farm.unit} onChange={(e) => set("unit", e.target.value)}>
                  {AREA_UNITS.map((u) => <option key={u.k} value={u.k}>{ar ? u.ar : u.en}</option>)}
                </select>
              </label>
              <label className="fl">{t("Current crop", "المحصول الحالي")}<CropSelect id="cur" k="current" /></label>
              <label className="fl">{t("Previous crop", "المحصول السابق")}<CropSelect id="prev" k="previous" /></label>
            </div>
            {farm.area != null && <div className="tip mono">≈ {Math.round(farm.area * unitM2).toLocaleString()} m²</div>}
            <div className="tip">{t("Only the 8 crops that have a profile in the team's crop file are offered.", "تُعرض فقط المحاصيل الثمانية التي لها ملف في ملف المحاصيل الخاص بالفريق.")}</div>
            <div className="fl">{t("Season of your next planting", "موسم زراعتك القادمة")}
              <div className="chips" role="group">
                {[["W", t("Winter / Rabi", "شتوي / رابي")], ["S", t("Summer / Kharif", "صيفي / كاريف")]].map(([s, l]) => <button type="button" key={s} className="chip" aria-pressed={farm.season === s} onClick={() => set("season", s)}>{l}</button>)}
                <button type="button" className="chip unknown" aria-pressed={farm.season == null} onClick={() => set("season", null)}>{t("I don't know", "لا أعرف")}</button>
              </div>
            </div>
          </section>

          <section className="card stack">
            <h3>{t("Soil", "التربة")}</h3>
            <div className="chips" role="group" aria-label={t("Soil type", "نوع التربة")}>
              {SOILS.map(([k, en, a]) => <button type="button" key={k} className="chip" aria-pressed={farm.soil === k} onClick={() => set("soil", k)}>{ar ? a : en}</button>)}
              <button type="button" className="chip unknown" aria-pressed={farm.soil == null} onClick={() => set("soil", null)}>{t("I don't know", "لا أعرف")}</button>
            </div>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink-2)" }}>{t("Optional soil details (from a lab test, if you have one)", "تفاصيل التربة الاختيارية (من تحليل معملي إن وُجد)")}</summary>
              <div className="grid g3" style={{ marginTop: 14 }}>
                <label className="fl">pH<input id="ph" className="input mono" inputMode="decimal" value={farm.ph ?? ""} placeholder={t("Unknown", "غير معروف")} onChange={(e) => set("ph", num(e.target.value))} /></label>
                <label className="fl">{t("Salinity EC (dS/m)", "الملوحة EC (ديسيسيمنز/م)")}<input id="ec" className="input mono" inputMode="decimal" value={farm.ec ?? ""} placeholder={t("Unknown", "غير معروف")} onChange={(e) => set("ec", num(e.target.value))} /></label>
                <label className="fl">{t("Organic matter (%)", "المادة العضوية (%)")}<input id="om" className="input mono" inputMode="decimal" value={farm.om ?? ""} placeholder={t("Unknown", "غير معروف")} onChange={(e) => set("om", num(e.target.value))} /></label>
              </div>
            </details>
            <div className="note"><Icon name="info" size={18} /><span>{t("Soil inputs are kept as your notes. No calculation in this version uses them, because no soil model or soil dataset is connected.", "مُدخلات التربة تُحفظ كملاحظاتك. لا يستخدمها أي حساب في هذا الإصدار لأنه لا يوجد نموذج تربة ولا بيانات تربة متصلة.")}</span></div>
          </section>

          <div className="row">
            <button className="btn primary lg" type="submit">{t("Save and open dashboard", "احفظ وافتح اللوحة")}<Icon name="arrow" size={20} className="flip" /></button>
            <button type="button" className="btn ghost" onClick={() => setFarm({ ...DEFAULT_FARM, country: cc })}>{t("Reset to sample inputs", "إعادة المُدخلات التجريبية")}</button>
          </div>
        </div>

        <aside className="stack" style={{ position: "sticky", top: 76 }}>
          <div className="photo-tile" style={{ "--img": img("canal"), minHeight: 200 }}>
            <div className="in"><div className="eyebrow" style={{ color: "var(--gold-2)" }}>{t("NASA POWER point", "نقطة NASA POWER")}</div><h4>{ar ? C.place.ar : C.place.en}</h4></div>
          </div>
          <div className="card flat">
            <div className="card-head" style={{ marginBottom: 8 }}><h3 style={{ fontSize: 17 }}>{t("What the app holds", "ما يحتفظ به التطبيق")}</h3></div>
            <pre dir="ltr" className="mono" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--ink-2)" }}>{JSON.stringify(payload, null, 1)}</pre>
            <p className="tip" style={{ marginTop: 8 }}>{t("Unknown values stay null. They are never converted to 0. Stored only in this browser; there is no server.", "القيم غير المعروفة تبقى null ولا تتحول إلى 0. تُخزَّن في هذا المتصفح فقط؛ لا يوجد خادم.")}</p>
          </div>
        </aside>
      </form>
    </>
  );
}
