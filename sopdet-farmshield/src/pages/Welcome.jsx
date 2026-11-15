import React from "react";
import { useApp } from "../app-context.jsx";
import { img } from "../data.js";
import { Wordmark } from "../components/Logo.jsx";
import Icon from "../components/Icon.jsx";
import { LangSwitch } from "../components/ui.jsx";

export default function Welcome() {
  const { t, mode, setMode, go } = useApp();
  const enter = () => go(mode === "expert" ? "expert" : "setup");
  return (
    <div className="welcome">
      <header>
        <Wordmark tone="dark" width={220} />
        <div className="row" style={{ gap: 10 }}>
          <button className="btn dark sm" onClick={() => go("intro")}><Icon name="replay" size={15} />{t("Replay intro", "إعادة المقدمة")}</button>
          <LangSwitch dark />
        </div>
      </header>

      <div className="body">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="eyebrow" style={{ color: "var(--gold-2)" }}>{t("Crop-rotation exploration · NASA POWER climate data", "استكشاف الدورة الزراعية · بيانات NASA POWER المناخية")}</div>
          <h1>{t("Plan the next harvest from the sky above the last one.", "خطّط للحصاد القادم من السماء التي رأت الحصاد السابق.")}</h1>
          <p className="lede">{t(
            "SOPDET FARMSHIELD brings real NASA POWER climate data and your own farm details together so you can explore crop-rotation scenarios side by side. It keeps NASA data apart from illustrative calculations, says clearly what is missing, and makes no predictions.",
            "يجمع سوبدت فارم شيلد بيانات مناخية حقيقية من NASA POWER مع تفاصيل مزرعتك لتستكشف سيناريوهات الدورة الزراعية جنبًا إلى جنب. يفصل بين بيانات ناسا والحسابات التوضيحية، ويوضح ما هو غير متوفر، ولا يقدّم أي تنبؤات."
          )}</p>
        </div>

        <div>
          <div className="eyebrow" style={{ color: "rgba(241,233,214,.6)", marginBottom: 12 }}>{t("Choose how you want to work", "اختر طريقة عملك")}</div>
          <div className="modes">
            <button className="mode" aria-pressed={mode === "farmer"} onClick={() => setMode("farmer")} style={{ "--img": img("fields") }}>
              <span className="tick"><Icon name="check" size={16} stroke={2.6} /></span>
              <div className="in">
                <Icon name="sprout" size={26} style={{ color: "var(--gold-2)" }} />
                <h3>{t("Farmer Mode", "وضع المزارع")}</h3>
                <p>{t("Plain language, large controls, and one clear next step for each field.", "لغة بسيطة وأزرار كبيرة وخطوة تالية واضحة لكل حقل.")}</p>
              </div>
            </button>
            <button className="mode" aria-pressed={mode === "expert"} onClick={() => setMode("expert")} style={{ "--img": img("satellite") }}>
              <span className="tick"><Icon name="check" size={16} stroke={2.6} /></span>
              <div className="in">
                <Icon name="flask" size={26} style={{ color: "var(--turq-2)" }} />
                <h3>{t("Expert Mode", "وضع الخبير")}</h3>
                <p>{t("Variable codes, units, dates, grid resolutions, data quality and limitations, with the data sources in view.", "أكواد المتغيرات والوحدات والتواريخ ودقة الشبكة وجودة البيانات والقيود، مع عرض مصادر البيانات.")}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="row" style={{ gap: 14 }}>
          <button className="btn gold lg" onClick={enter}>{mode === "expert" ? t("Continue as Expert", "تابع كخبير") : t("Continue as Farmer", "تابع كمزارع")}<Icon name="arrow" size={20} className="flip" /></button>
          <button className="btn dark lg" onClick={() => go("dashboard")}>{t("Skip to dashboard", "اذهب إلى اللوحة")}</button>
        </div>
      </div>

      <footer>
        <span>{t("Student project using public NASA POWER data. Not affiliated with or endorsed by NASA.", "مشروع طلابي يستخدم بيانات NASA POWER العامة. غير تابع لناسا ولا معتمد منها.")}</span>
        <span>{t("No ML model · no predictions.", "لا نموذج تعلّم آلي · لا تنبؤات.")}</span>
      </footer>
    </div>
  );
}
