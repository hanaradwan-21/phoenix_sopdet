import React, { useMemo } from "react";
import { useApp } from "../app-context.jsx";
import { CROPS, CROP_KEYS, DEFAULT_SCENARIOS, COUNTRIES, AREA_UNITS, FAMILY, analyzeScenario, profileOf, img } from "../data.js";
import { point, seasons, WINDOW_TEXT, fmt, sign } from "../nasa.js";
import Icon from "../components/Icon.jsx";
import { CropSeq, SourcesLink, Disclaimer, DataType, Meter } from "../components/ui.jsx";
import { GroupBars } from "../components/Charts.jsx";

const SC = [
  { id: "current", color: "#7a6a52", en: "Current practice", ar: "الممارسة الحالية", sub: { en: "Edit to match what you do today", ar: "عدّلها لتطابق ما تفعله اليوم" } },
  { id: "A", color: "#55693a", en: "Scenario A", ar: "السيناريو أ", sub: { en: "Example to edit, not a suggestion", ar: "مثال للتعديل، وليس اقتراحًا" } },
  { id: "B", color: "#b0553a", en: "Scenario B", ar: "السيناريو ب", sub: { en: "Example to edit, not a suggestion", ar: "مثال للتعديل، وليس اقتراحًا" } },
];

export default function Planner() {
  const { t, ar, mode, farm, scen, setScen, go, cc } = useApp();
  const expert = mode === "expert";
  const C = COUNTRIES[cc];
  const p = point(cc);
  const unit = AREA_UNITS.find((u) => u.k === farm.unit) ?? AREA_UNITS[0];
  const seasonUnknown = farm.season == null;
  const start = farm.season === "S" ? "S" : "W";

  const res = useMemo(() => Object.fromEntries(SC.map((s) => [s.id, analyzeScenario(cc, scen[s.id], start, unit.m2)])), [scen, cc, start, unit]);
  const ctx = useMemo(() => ({ W: seasons(cc, "W", "full"), S: seasons(cc, "S", "full") }), [cc]);
  const types = res.current.types;
  const slotLabel = types.map((ty, i) => ({ en: `Season ${i + 1} · ${C.seasons[ty].en}`, ar: `الموسم ${i + 1} · ${C.seasons[ty].ar}` }));
  const setCrop = (id, i, k) => setScen((x) => ({ ...x, [id]: x[id].map((c, j) => (j === i ? k : c)) }));

  const validTotals = SC.map((s) => res[s.id].mm).filter((x) => typeof x === "number" && Number.isFinite(x));
  const maxMm = Math.max(...validTotals, 1);

  /*
   * Unit & time-period compatibility check before comparing listed crop water with NASA rainfall:
   * - Crop profile `irrigationMm` is in mm per crop growing cycle (gross vs net unknown, reference years unspecified).
   * - NASA `PRECTOTCORR` is summed from mm/day across fixed 6-month calendar windows (Nov–Apr / May–Oct) in mm per window.
   * Because units/definitions and time windows do not match, we chart the three crop scenarios in mm/crop-cycle
   * separately from the 6-month NASA POWER window rainfall and never compute a net subtraction.
   */
  const cropWaterSeries = SC.map((s) => ({
    name: ar ? s.ar : s.en,
    color: s.color,
    values: res[s.id].perSlotMm,
  }));

  const canSyncFromSetup = Boolean(farm.current || farm.previous);
  const syncCurrentFromSetup = () => {
    setScen((prev) => {
      const next = [...prev.current];
      if (farm.current && farm.current in CROPS) next[0] = farm.current;
      if (farm.previous && farm.previous in CROPS) next[2] = farm.previous;
      return { ...prev, current: next };
    });
  };
  const resetAllScenarios = () => setScen({ ...DEFAULT_SCENARIOS });

  const row = (label, val, hint) => (
    <div className="metric">
      <div className="top"><span>{label}</span><b className="mono">{val}</b></div>
      {hint && <div className="tip">{hint}</div>}
    </div>
  );

  return (
    <>
      <section className="hero" style={{ "--img": img("flood"), "--pos": "50% 55%", minHeight: 260 }}>
        <div className="inner" style={{ maxWidth: 840 }}>
          <div className="row">
            <span className="pill dark">{t("Scenario explorer", "مستكشف السيناريوهات")}</span>
            <span className="pill dark">{ar ? C.place.ar : C.place.en}</span>
            <span className="pill dark">{t("Starting season:", "بداية التتابع:")} {ar ? C.seasons[start].ar : C.seasons[start].en}</span>
          </div>
          <h2>{t("Crop Rotation Planner", "مخطط الدورة الزراعية")}</h2>
          <p style={{ color: "rgba(241,233,214,.85)", fontSize: 16, maxWidth: "62ch" }}>{t("Put your current practice next to two alternatives over four seasons and see what can honestly be compared: rule checks, the team's listed water figures, and NASA POWER climate for each season. It does not score, rank or recommend.", "ضع ممارستك الحالية بجوار بديلين على أربعة مواسم، وشاهد ما يمكن مقارنته بصدق: فحوص القواعد وأرقام المياه المدرجة من الفريق ومناخ NASA POWER لكل موسم. لا يعطي درجات ولا ترتيبًا ولا توصية.")}</p>
        </div>
      </section>

      <div className="card flat row" style={{ justifyContent: "space-between", gap: 16 }}>
        <div className="row" style={{ gap: 20 }}>
          <div>
            <div className="eyebrow">{t("Active farm context", "سياق المزرعة النشط")}</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>
              <b>{ar ? C.ar : C.en}</b> ({p.region}) ·{" "}
              {farm.area != null
                ? <span className="mono">{farm.area} {ar ? unit.ar : unit.en} (≈ {Math.round(farm.area * unit.m2).toLocaleString()} m²)</span>
                : <span>{t("Area not set", "المساحة غير محددة")}</span>}
              {" · "}
              {t("Start:", "البداية:")} <b>{ar ? C.seasons[start].ar : C.seasons[start].en}</b>
              {seasonUnknown && <span className="tip"> ({t("defaulted; set in Farm Setup", "افتراضي؛ حدّده في إعداد المزرعة")})</span>}
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {canSyncFromSetup && (
            <button type="button" className="btn sm" onClick={syncCurrentFromSetup}>
              <Icon name="sprout" size={15} />
              {t("Use Farm Setup crops in Current", "استخدم محاصيل الإعداد في الحالية")}
            </button>
          )}
          <button type="button" className="btn sm ghost" onClick={resetAllScenarios}>
            <Icon name="replay" size={15} />
            {t("Reset all", "إعادة الكل")}
          </button>
          <button type="button" className="btn sm ghost" onClick={() => go("setup")}>
            <Icon name="pin" size={15} />
            {t("Farm Setup", "إعداد المزرعة")}
          </button>
        </div>
      </div>

      <div className="note" style={{ borderStyle: "solid" }}>
        <Icon name="info" size={18} />
        <span style={{ display: "grid", gap: 8 }}>
          <span>{t("Every block below is tagged with what it is:", "كل قسم أدناه موسوم بنوعه:")}</span>
          <span className="row" style={{ gap: 8 }}><DataType k="nasa" /><DataType k="calc" /><DataType k="unv" /><DataType k="pred" /></span>
          <span>{t("The prediction block is empty on purpose: no trained and tested model is connected.", "قسم التنبؤ فارغ عمدًا: لا يوجد نموذج مدرَّب ومُختبَر متصل.")}</span>
        </span>
      </div>

      <section className="grid g3" style={{ alignItems: "start" }}>
        {SC.map((s) => {
          const r = res[s.id];
          const famSubtitles = scen[s.id].map((k) => ({
            en: CROPS[k].fam,
            ar: CROPS[k].fam,
          }));
          return (
            <article key={s.id} className={`card scen ${s.id === "current" ? "current" : ""}`} style={{ borderTop: `4px solid ${s.color}` }}>
              <div className="scen-head">
                <h3>{ar ? s.ar : s.en}</h3>
                <div className="tip">{ar ? s.sub.ar : s.sub.en}</div>
              </div>
              <CropSeq seq={scen[s.id]} flags={r.flags} labels={slotLabel} subtitles={famSubtitles} />
              <details>
                <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)" }}>{t("Change crops", "غيّر المحاصيل")}</summary>
                <div className="grid g2" style={{ marginTop: 10, gap: 10 }}>
                  {slotLabel.map((se, i) => (
                    <label key={i} className="slot fl" style={{ fontSize: 11.5 }}>{ar ? se.ar : se.en}
                      <select className="input" aria-label={`${s.en} ${se.en}`} value={scen[s.id][i]} onChange={(e) => setCrop(s.id, i, e.target.value)}>
                        {CROP_KEYS.map((k) => {
                          const pr = profileOf(cc, k);
                          const sTag = pr?.season ? (ar ? C.seasons[pr.season].ar : C.seasons[pr.season].en) : "—";
                          return (
                            <option key={k} value={k}>
                              {(ar ? CROPS[k].ar : CROPS[k].en)} · {sTag}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ))}
                </div>
                <button type="button" className="btn sm ghost" style={{ marginTop: 8 }} onClick={() => setScen((x) => ({ ...x, [s.id]: DEFAULT_SCENARIOS[s.id] }))}>{t("Reset", "إعادة")}</button>
              </details>

              <div className="stack" style={{ gap: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="eyebrow">{t("Rule checks", "فحوص القواعد")}</span><DataType k="calc" /></div>
                {row(t("Crops outside their listed season", "محاصيل خارج موسمها المدرج"), `${r.off} / ${scen[s.id].length}`, t("by the team crop profile", "حسب ملف المحاصيل للفريق"))}
                {row(t("Same botanical family back-to-back", "نفس الفصيلة النباتية متتالية"), `${r.rep} / ${r.pairs}`, t("consecutive seasons", "مواسم متتالية"))}
                {row(t("Distinct crops · families", "محاصيل مختلفة · فصائل"), `${r.crops} · ${r.families}`)}
                {row(t("Cereal (Poaceae) seasons", "مواسم الحبوب (Poaceae)"), `${r.cereal} / ${scen[s.id].length}`)}
              </div>
              <hr className="divider" />
              <div className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="eyebrow">{t("Team-listed water figure", "رقم المياه المدرج من الفريق")}</span><DataType k="unv" /></div>
                {r.waterComplete ? (
                  <>
                    <div className="display" style={{ fontSize: 30 }}>{fmt(r.mm, 0)}<span className="tip" style={{ fontSize: 14 }}> mm · {t("4 seasons added up", "مجموع 4 مواسم")}</span></div>
                    <Meter value={(r.mm / maxMm) * 100} color={s.color} />
                    <div className="mono tip">≈ {Math.round(r.m3PerUnit).toLocaleString()} m³ / {ar ? unit.ar : unit.en}{farm.area != null && ` · ${Math.round(r.m3PerUnit * farm.area).toLocaleString()} m³ ${t("for your area", "لمساحتك")}`}</div>
                  </>
                ) : (
                  <>
                    <div className="display" style={{ fontSize: 30 }}>—</div>
                    <div className="pill warn">
                      <Icon name="alert" size={14} />
                      {t(`Incomplete water data (${r.waterKnownCount}/4 seasons listed) — 4-season total not computed`, `بيانات المياه غير مكتملة (${r.waterKnownCount} من 4 مواسم) — لا يُحسب مجموع المواسم الأربعة`)}
                    </div>
                  </>
                )}
                <div className="tip">{t("1 mm over 1 m² = 1 litre. Unverified: it is not known whether the listed figure is gross crop water or net irrigation.", "1 مم على 1 م² = 1 لتر. غير متحقق منه: لا يُعرف هل الرقم المدرج احتياج إجمالي للمحصول أم ري صافٍ.")}</div>
              </div>
              {expert && (
                <details>
                  <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{t("Listed profile per season (unverified)", "الملف المدرج لكل موسم (غير متحقق منه)")}</summary>
                  <table className="t" style={{ marginTop: 8 }}>
                    <thead><tr><th>#</th><th>{t("Crop", "المحصول")}</th><th>mm</th><th>t/ha</th></tr></thead>
                    <tbody>
                      {scen[s.id].map((k, i) => {
                        const pr = profileOf(cc, k);
                        return (
                          <tr key={i}>
                            <td className="mono">{i + 1}</td>
                            <td>
                              {ar ? CROPS[k].ar : CROPS[k].en}
                              <div className="tip">{pr?.seasonName ?? "—"} · {CROPS[k].fam}</div>
                            </td>
                            <td className="mono">{pr?.irrigationMm ?? "—"}</td>
                            <td className="mono">{pr?.yieldTHa ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </details>
              )}
              {r.off > 0 && <div className="pill warn"><Icon name="alert" size={14} />{t("A crop is placed outside its listed season", "يوجد محصول خارج موسمه المدرج")}</div>}
              {r.rep > 0 && <div className="pill"><Icon name="rotate" size={14} />{t("Same botanical family in consecutive seasons", "نفس الفصيلة النباتية في مواسم متتالية")}</div>}
            </article>
          );
        })}
      </section>

      <section className="grid g2">
        <div className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h3>{t("Team-listed crop water by season slot", "المياه المدرجة للمحاصيل حسب خانة الموسم")}</h3>
              <div className="sub">{t("mm per crop growing cycle (unverified). Only the three scenarios share the same input definition.", "مم لكل دورة نمو محصول (غير متحقق منه). السيناريوهات الثلاثة فقط تشترك في نفس تعريف المُدخل.")}</div>
            </div>
            <DataType k="unv" />
          </div>
          <GroupBars groups={slotLabel.map((s, i) => `${i + 1} · ${ar ? C.seasons[types[i]].ar : C.seasons[types[i]].en}`.slice(0, 16))} series={cropWaterSeries} unit="mm" />
          <div className="legend">{cropWaterSeries.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>
          <div className="note">
            <Icon name="alert" size={18} />
            <span>{t(
              "Unit & period check: Crop-profile water figures are in mm per crop cycle (gross vs net irrigation unknown; reference years unspecified), whereas NASA POWER rainfall is summed from mm/day over fixed 6-month windows (Nov–Apr / May–Oct). Because definitions and time spans differ, they are shown separately and no net water balance is computed.",
              "فحص الوحدة والفترة الزمنية: أرقام مياه المحاصيل بوحدة مم لكل دورة محصول (غير معروف هل هي إجمالية أم صافية وسنواتها غير محددة)، بينما أمطار NASA POWER تُجمع من مم/يوم على نوافذ تقويمية ثابتة من 6 أشهر (نوفمبر–أبريل / مايو–أكتوبر). لاختلاف التعريف والفترة الزمنية تُعرض كل منهما بشكل منفصل ولا يُحسب ميزان مائي صافٍ."
            )}</span>
          </div>
        </div>

        <div className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h3>{t("NASA POWER climate for each season", "مناخ NASA POWER لكل موسم")}</h3>
              <div className="sub">{t("Same for every scenario: it depends on the season window, not the crop.", "نفسه لكل السيناريوهات: يعتمد على نافذة الموسم لا المحصول.")}</div>
            </div>
            <DataType k="nasa" />
          </div>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>{t("Season", "الموسم")}</th><th>{t("Temp °C", "حرارة °م")}</th><th>{t("Rain mm / window", "أمطار مم / نافذة")}</th><th>{t("Root wetness", "رطوبة الجذور")}</th><th>{t("Solar", "إشعاع")}</th></tr></thead>
            <tbody>{["W", "S"].map((ty) => { const m = ctx[ty].mean; return <tr key={ty}><td><b>{ar ? C.seasons[ty].ar : C.seasons[ty].en}</b><div className="tip">{ar ? WINDOW_TEXT[ty].ar : WINDOW_TEXT[ty].en} · n={ctx[ty].count}</div></td><td className="mono">{fmt(m?.t2m, 1)}</td><td className="mono">{fmt(m?.rain, 0)}</td><td className="mono">{fmt(m?.wetRoot, 2)}</td><td className="mono">{fmt(m?.solar, 1)}</td></tr>; })}</tbody>
          </table></div>
          <p className="tip">{t(`Average over complete 6-month calendar windows in ${p.start} → ${p.end} (n shown; PRECTOTCORR summed from mm/day across each 181–184 day window). Solar is MJ/m²/day. Windows are illustrative, not sowing dates.`, `متوسط النوافذ التقويمية الكاملة ذات الـ 6 أشهر في ${p.start} ← ${p.end} (n معروضة؛ PRECTOTCORR مُجمَّعة من مم/يوم لكل نافذة من 181–184 يومًا). الإشعاع MJ/م²/يوم. النوافذ توضيحية وليست مواعيد زراعة.`)}</p>
        </div>
      </section>

      <section className="grid g-side" style={{ alignItems: "start" }}>
        <div className="card stack" style={{ borderColor: "var(--terra)" }}>
          <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Prediction", "التنبؤ")}</h3><DataType k="pred" /></div>
          <div className="display" style={{ fontSize: 24 }}>{t("No model connected", "لا يوجد نموذج متصل")}</div>
          <p className="muted" style={{ fontSize: 14 }}>{t("So there is no yield forecast, no risk score, no suitability score and no ranking here. To add a real prediction we would need:", "لذلك لا يوجد هنا توقع للإنتاجية ولا درجة مخاطر ولا درجة ملاءمة ولا ترتيب. لإضافة تنبؤ حقيقي نحتاج:")}</p>
          <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, fontSize: 13.5, display: "grid", gap: 4 }}>
            <li>{t("A documented yield or crop-growth model", "نموذج إنتاجية أو نمو محصول موثّق")}</li>
            <li>{t("Ground-truth yields for these regions to train and test it", "إنتاجية فعلية لهذه المناطق لتدريبه واختباره")}</li>
            <li>{t("Soil and field observations, not only gridded weather", "ملاحظات تربة وحقل وليس طقسًا شبكيًا فقط")}</li>
            <li>{t("A reported test error and uncertainty", "خطأ اختبار وعدم يقين مُعلنان")}</li>
          </ul>
        </div>

        <div className="summary-box stack" style={{ gap: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", position: "relative", zIndex: 1 }}><div className="eyebrow" style={{ color: "var(--gold-2)" }}>{t("What the comparison shows", "ماذا تُظهر المقارنة")}</div><DataType k="calc" /></div>
          <div className="stack" style={{ position: "relative", zIndex: 1, gap: 10 }}>
            {SC.filter((s) => s.id !== "current").map((s) => {
              const r = res[s.id], c = res.current;
              const waterSummary = r.waterComplete && c.waterComplete
                ? t(`listed water ${fmt(r.mm, 0)} mm (${sign(r.mm - c.mm, 0)} mm vs current practice).`, `المياه المدرجة ${fmt(r.mm, 0)} مم (${sign(r.mm - c.mm, 0)} مم مقارنة بالممارسة الحالية).`)
                : t("4-season water comparison unavailable because at least one season lacks a listed water value.", "مقارنة مياه المواسم الأربعة غير متاحة لوجود موسم واحد على الأقل بلا قيمة مياه مدرجة.");
              return (
                <p key={s.id} style={{ fontSize: 14.5 }}>
                  <b>{ar ? s.ar : s.en}:</b> {t(`${r.off} crop(s) outside listed season, ${r.rep} same-family pair(s), `, `${r.off} محصول خارج الموسم المدرج، ${r.rep} زوج من نفس الفصيلة، `)}{waterSummary}
                </p>
              );
            })}
            <p style={{ fontSize: 14.5, color: "rgba(241,233,214,.8)" }}>
              {res.current.waterComplete
                ? t(`Current practice: ${res.current.off} outside listed season, ${res.current.rep} same-family pair(s), listed water ${fmt(res.current.mm, 0)} mm.`, `الممارسة الحالية: ${res.current.off} خارج الموسم المدرج، ${res.current.rep} زوج من نفس الفصيلة، المياه المدرجة ${fmt(res.current.mm, 0)} مم.`)
                : t(`Current practice: ${res.current.off} outside listed season, ${res.current.rep} same-family pair(s), incomplete water data (${res.current.waterKnownCount}/4 seasons).`, `الممارسة الحالية: ${res.current.off} خارج الموسم المدرج، ${res.current.rep} زوج من نفس الفصيلة، بيانات المياه غير مكتملة (${res.current.waterKnownCount} من 4 مواسم).`)}
            </p>
          </div>
          <ul style={{ margin: 0, paddingInlineStart: 18, color: "rgba(241,233,214,.75)", fontSize: 13.5, position: "relative", zIndex: 1, display: "grid", gap: 4 }}>
            <li>{t("These are counts and sums of your inputs and the unverified team figures. They do not say which option is better.", "هذه عدّات ومجاميع لمُدخلاتك ولأرقام الفريق غير المتحقق منها. لا تقول أي خيار أفضل.")}</li>
            <li>{t("Soil, market, labour, pests and local advice are not in the data, so they are not in this comparison.", "التربة والسوق والعمالة والآفات والإرشاد المحلي ليست في البيانات، لذا ليست في هذه المقارنة.")}</li>
          </ul>
          <div className="row" style={{ position: "relative", zIndex: 1 }}>
            <button className="btn gold" onClick={() => go("guide")}><Icon name="star" size={17} />{t("Ask the Data Guide", "اسأل مرشد البيانات")}</button>
            <SourcesLink dark />
          </div>
        </div>
      </section>

      {expert && (
        <section className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}><h3>{t("Method note (Expert mode)", "ملاحظة المنهج (وضع الخبير)")}</h3><DataType k="calc" /></div>
          <div className="grid g3">
            <div><div className="eyebrow">{t("Rules used", "القواعد المستخدمة")}</div><p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{t("Off-season: the crop's season in the team profile differs from the slot's season. Same family: two consecutive crops share a botanical family (taxonomy lookup). Water: the listed irrigation figures are summed only when all 4 seasons have values. Nothing is weighted or scored.", "خارج الموسم: موسم المحصول في ملف الفريق يختلف عن موسم الخانة. نفس الفصيلة: محصولان متتاليان من فصيلة نباتية واحدة (بحث تصنيفي). المياه: تُجمع أرقام الري المدرجة فقط عند توفر قيم جميع المواسم الأربعة. لا شيء يُوزن أو يُقيَّم.")}</p></div>
            <div><div className="eyebrow">{t("Families in play", "الفصائل المستخدمة")}</div><p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{[...new Set(SC.flatMap((s) => scen[s.id].map((k) => CROPS[k].fam)))].map((f) => (ar ? FAMILY[f].ar : FAMILY[f].en)).join(" · ")}</p></div>
            <div><div className="eyebrow">{t("Model version", "إصدار النموذج")}</div><p className="mono" style={{ fontSize: 13, marginTop: 6 }}>{t("none connected", "لا يوجد نموذج متصل")}</p></div>
          </div>
        </section>
      )}
      <Disclaimer />
    </>
  );
}
