import React from "react";

/*
 * SOPDET FARMSHIELD identity — every shape below is editable vector geometry.
 *
 *  Wordmark grid: letter height 60, stroke 6, baseline offset 6 (room for the star flare).
 *  - The "O" of SOPDET is a ring holding the Sirius star (4-point concave star + 45° minor rays).
 *  - Under the word a Nile curve flows left to right and splits into a three-armed delta;
 *    two fainter parallel curves echo furrows / field lines.
 *  - FARMSHIELD is set on the same width as SOPDET using textLength.
 *
 *  Palettes: tone="dark"  → for dark backgrounds (limestone letters, gold star)
 *            tone="light" → for light backgrounds (olive letters, deep-gold star)
 */
export const PALETTE = {
  dark: { ink: "#F1E9D6", star: "#E2BF6E", nile: "#D5B886", furrow: "#D5B886", ground: "#1D2414" },
  light: { ink: "#243019", star: "#A8832F", nile: "#6F8446", furrow: "#6F8446", ground: "#FAF6EC" },
};

/** 4-point concave star path centred on (cx,cy). r = long ray, k = waist pinch. */
export function starPath(cx, cy, r, k = 0.13) {
  const p = r * k;
  return `M${cx} ${cy - r}Q${cx + p} ${cy - p} ${cx + r} ${cy}Q${cx + p} ${cy + p} ${cx} ${cy + r}Q${cx - p} ${cy + p} ${cx - r} ${cy}Q${cx - p} ${cy - p} ${cx} ${cy - r}Z`;
}

/* Letter geometry (stroke paths, 0..60 tall, centre-line coordinates) */
const LETTERS = [
  { id: "S", x: 0, d: "M38 11C38 5 31 3 21 3C9 3 4 8.5 4 15.5C4 25 14 27 22 30C31 33 38 36 38 44.5C38 52 31 57 20 57C10 57 4.5 54 2 47" },
  { id: "O", x: 48, d: "M27 3A24 27 0 1 1 27 57A24 27 0 1 1 27 3Z" },
  { id: "P", x: 110, d: "M4 60V3H22C34 3 40 9 40 18C40 27 34 33 22 33H4" },
  { id: "D", x: 162, d: "M4 3H20C37 3 46 14 46 30C46 46 37 57 20 57H4Z" },
  { id: "E", x: 220, d: "M40 3H4V57H40M4 30H31" },
  { id: "T", x: 272, d: "M0 3H44M22 3V60" },
];

const NILE = "M0 84C34 70 62 96 104 84S176 72 214 84S272 94 298 82";
const DELTA = ["M298 82L316 71", "M298 82L317 82", "M298 82L315 93"];

/** Primary wordmark. `animate` plays the reveal (use `go` to start it). */
export function Wordmark({ tone = "dark", width = 360, animate = false, go = true, showSecondary = true, title = "SOPDET FARMSHIELD", glow = false, delay = 0 }) {
  const c = PALETTE[tone];
  const cls = ["lg-draw", animate ? "lg-anim" : "", animate && go ? "go" : "", glow ? "glow-idle" : ""].join(" ");
  const D = (s) => ({ "--d": `${delay + s}s` });
  return (
    <svg className={cls} width={width} viewBox="-2 -4 322 130" role="img" aria-label={title} style={{ display: "block", maxWidth: "100%", height: "auto", overflow: "visible" }}>
      <title>{title}</title>
      <g transform="translate(0 6)" fill="none" stroke={c.ink} strokeWidth="6" strokeLinejoin="miter" strokeLinecap="butt">
        {LETTERS.map((l, i) => (
          <g key={l.id} transform={`translate(${l.x} 0)`}>
            <path className="lt" pathLength="1" d={l.d} style={D(i * 0.14)} />
          </g>
        ))}
        {/* field furrows inside the D */}
        <g className="furrow" stroke={c.furrow} strokeWidth="1.4" opacity=".7" transform="translate(162 0)">
          <path d="M16 18H36" /><path d="M16 30H40" /><path d="M16 42H36" />
        </g>
      </g>
      {/* Sirius inside the O */}
      <g transform="translate(75 36)">
        <circle className="halo" r="17" fill={c.star} opacity="0" />
        <g className="star" style={D(0)}>
          <path d={starPath(0, 0, 17, 0.12)} fill={c.star} />
          <path d={starPath(0, 0, 8, 0.16)} fill={c.star} opacity=".75" transform="rotate(45)" />
        </g>
      </g>
      {/* Nile curve, furrow echoes, delta */}
      <g fill="none" strokeLinecap="round">
        <path className="nile" pathLength="1" d={NILE} stroke={c.nile} strokeWidth="2.6" style={D(2)} />
        {DELTA.map((d, i) => <path key={i} className="nile" pathLength="1" d={d} stroke={c.nile} strokeWidth="2" style={D(2.5 + i * 0.1)} />)}
        <path className="nile2" pathLength="1" d="M10 90C42 77 68 101 108 90S176 80 208 90" stroke={c.nile} strokeWidth="1.2" opacity=".5" style={D(2.4)} />
        <path className="nile2" pathLength="1" d="M22 95C52 84 74 106 110 96S170 88 196 96" stroke={c.nile} strokeWidth="1" opacity=".28" style={D(2.7)} />
      </g>
      {showSecondary && (
        <text className="sec" x="0" y="124" fontFamily="Marcellus, Georgia, serif" fontSize="23" fill={c.ink} textLength="316" lengthAdjust="spacing" style={{ letterSpacing: 0 }}>
          FARMSHIELD
        </text>
      )}
    </svg>
  );
}

/** Compact emblem: shielded stele holding Sirius, the Nile curve and field furrows. */
export function Emblem({ tone = "dark", size = 44, animate = false, go = true, plain = false }) {
  const c = PALETTE[tone];
  return (
    <svg className={animate ? `lg-anim ${go ? "go" : ""}` : ""} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="SOPDET FARMSHIELD emblem" style={{ display: "block", flex: "none" }}>
      <defs>
        <clipPath id={`shc-${tone}`}><path d={SHIELD} /></clipPath>
      </defs>
      <path d={SHIELD} fill={plain ? "none" : tone === "dark" ? "rgba(241,233,214,.06)" : "rgba(36,48,25,.06)"} stroke={c.ink} strokeWidth="3" strokeLinejoin="round" />
      <g clipPath={`url(#shc-${tone})`} fill="none" strokeLinecap="round">
        <path d="M2 49C14 40 22 56 33 47S50 40 62 47" stroke={c.nile} strokeWidth="2.6" />
        <path d="M2 55C14 47 22 62 33 54S50 48 62 54" stroke={c.nile} strokeWidth="1.4" opacity=".55" />
        <path d="M2 61C14 54 22 68 33 61S50 55 62 61" stroke={c.nile} strokeWidth="1.1" opacity=".3" />
      </g>
      <g transform="translate(32 25)">
        <circle className="halo" r="11" fill={c.star} opacity="0" />
        <g className="star">
          <path d={starPath(0, 0, 14, 0.12)} fill={c.star} />
          <path d={starPath(0, 0, 6.5, 0.16)} fill={c.star} opacity=".7" transform="rotate(45)" />
        </g>
      </g>
    </svg>
  );
}
const SHIELD = "M32 3C43 3 52 6.5 58 10V31C58 45 47 56 32 61C17 56 6 45 6 31V10C12 6.5 21 3 32 3Z";

/** App icon: rounded square, olive ground, gold star over cream Nile line. */
export function AppIcon({ size = 96, radius = 0.23 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="SOPDET app icon" style={{ display: "block", flex: "none" }}>
      <defs>
        <linearGradient id="aig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3c4a29" /><stop offset="1" stopColor="#1d2414" /></linearGradient>
        <radialGradient id="aih" cx="50%" cy="38%" r="40%"><stop offset="0" stopColor="#E2BF6E" stopOpacity=".5" /><stop offset="1" stopColor="#E2BF6E" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="96" height="96" rx={96 * radius} fill="url(#aig)" />
      <rect width="96" height="96" rx={96 * radius} fill="url(#aih)" />
      <path d={starPath(48, 38, 25, 0.12)} fill="#E2BF6E" />
      <path d={starPath(48, 38, 11.5, 0.16)} fill="#E2BF6E" opacity=".7" transform="rotate(45 48 38)" />
      <path d="M12 72C26 60 38 82 52 70S76 62 86 68" fill="none" stroke="#F1E9D6" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M18 82C30 73 40 90 52 81S72 76 80 80" fill="none" stroke="#D5B886" strokeWidth="2.2" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

/** Favicon-size mark, tuned for 16–32px: heavier star, one curve, no furrows. */
export function Favicon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="SOPDET favicon" style={{ display: "block", flex: "none", imageRendering: "auto" }}>
      <rect width="32" height="32" rx="7" fill="#1d2414" />
      <path d={starPath(16, 13, 10.5, 0.2)} fill="#E2BF6E" />
      <path d="M4 24C9 19 13 28 18 23S26 20 28 23" fill="none" stroke="#F1E9D6" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** Same favicon as a data URI so index.html and the running app can set <link rel=icon>. */
export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1d2414"/><path d="${starPath(16, 13, 10.5, 0.2)}" fill="#E2BF6E"/><path d="M4 24C9 19 13 28 18 23S26 20 28 23" fill="none" stroke="#F1E9D6" stroke-width="2.6" stroke-linecap="round"/></svg>`;
export const FAVICON_URI = "data:image/svg+xml," + encodeURIComponent(FAVICON_SVG);

/** Emblem + wordmark lockup used in the sidebar (wordmark kept to the primary mark). */
export function SideBrand({ tone = "dark" }) {
  return <Wordmark tone={tone} width={176} />;
}

/** Guide avatar: leaf whose midrib is the Nile curve, Sopdet star above. */
export function GuideAvatar({ size = 44, speaking = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Sopdet Guide" style={{ display: "block", flex: "none" }}>
      <defs>
        <radialGradient id="gav" cx="50%" cy="30%" r="80%"><stop offset="0" stopColor="#566a39" /><stop offset="1" stopColor="#1d2414" /></radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#gav)" stroke="#D8B463" strokeWidth="1.8" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#D8B463" strokeWidth=".6" strokeDasharray="1.5 3" opacity=".7" />
      {/* leaf */}
      <path d="M32 52C18 46 15 30 22 21C27 29 32 30 32 30C32 30 37 29 42 21C49 30 46 46 32 52Z" fill="#7b9150" opacity=".95" />
      {/* Nile curve as midrib */}
      <path d="M32 52C27 46 37 42 32 36S28 30 32 30" fill="none" stroke="#F1E9D6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M32 40L25 36M32 44L40 40M32 35L38 31" stroke="#F1E9D6" strokeWidth=".9" opacity=".6" strokeLinecap="round" />
      <g transform="translate(32 15)" className={speaking ? "glow-idle" : ""}>
        <g className="star"><path d={starPath(0, 0, 9, 0.14)} fill="#E2BF6E" /><path d={starPath(0, 0, 4, 0.18)} fill="#E2BF6E" opacity=".7" transform="rotate(45)" /></g>
      </g>
    </svg>
  );
}
