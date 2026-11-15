import React, { useState } from "react";

/* Dependency-free SVG charts. All colours come from series props or CSS variables. */
const txt = { fontFamily: "var(--f-mono)", fontSize: 11, fill: "var(--ink-3)" };

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function LineChart({ labels, series, height = 240, yMin, yMax, unit = "", every = 3, decimals = 0, bars }) {
  const W = 640, H = height, L = 44, R = 18, T = 14, B = 28;
  const all = series.flatMap((s) => s.values);
  const lo = yMin ?? Math.min(0, ...all);
  const hi = yMax ?? niceMax(Math.max(...all));
  const n = labels.length;
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, n - 1);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = 4;
  const [hover, setHover] = useState(null);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1)))));
  };
  return (
    <div dir="ltr" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = lo + ((hi - lo) * i) / ticks;
          return (
            <g key={i}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={i ? "2 4" : ""} />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" style={txt}>{v.toFixed(decimals)}</text>
            </g>
          );
        })}
        {labels.map((l, i) => (i % every === 0 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" style={txt}>{l}</text> : null))}
        {bars && bars.values.map((v, i) => {
          const bh = (v / bars.max) * (H - T - B) * 0.5;
          return <rect key={i} x={x(i) - 5} y={H - B - bh} width="10" height={bh} fill={bars.color} opacity=".38" rx="1.5" />;
        })}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`);
          const area = `M${x(0)},${y(lo)} L${pts.join(" L")} L${x(n - 1)},${y(lo)}Z`;
          return (
            <g key={si}>
              {s.area && <path d={area} fill={s.color} opacity=".12" />}
              {s.band && (
                <path d={`M${s.values.map((v, i) => `${x(i)},${y(v + s.band)}`).join(" L")} L${[...s.values].map((v, i) => `${x(n - 1 - i)},${y(s.values[n - 1 - i] - s.band)}`).join(" L")}Z`} fill={s.color} opacity=".14" />
              )}
              <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "5 4" : ""} />
              <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r="4.2" fill={s.color} stroke="var(--paper)" strokeWidth="2" />
            </g>
          );
        })}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--ink-3)" strokeDasharray="3 3" />
            {series.map((s, si) => <circle key={si} cx={x(hover)} cy={y(s.values[hover])} r="4" fill={s.color} stroke="var(--paper)" strokeWidth="1.5" />)}
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{ position: "absolute", top: 6, insetInlineStart: `${Math.min(70, (x(hover) / W) * 100)}%`, transform: "translateX(8px)", background: "var(--olive-900)", color: "var(--limestone)", padding: "6px 10px", borderRadius: 8, fontSize: 12, pointerEvents: "none", fontFamily: "var(--f-mono)" }}>
          <div style={{ opacity: .7 }}>{labels[hover]}</div>
          {series.map((s, i) => <div key={i}><span style={{ color: s.color === "var(--ink)" ? "#fff" : s.color }}>●</span> {s.name}: {s.values[hover].toFixed(decimals)}{unit}</div>)}
        </div>
      )}
    </div>
  );
}

export function GroupBars({ groups, series, height = 230, unit = "", decimals = 0, showValues = true, every = 1 }) {
  const W = 640, H = height, L = 48, R = 12, T = 26, B = 30;
  const finiteVals = series.flatMap((s) => s.values).filter((v) => typeof v === "number" && Number.isFinite(v));
  const hi = niceMax(Math.max(...finiteVals, 0.0001));
  const gw = (W - L - R) / Math.max(1, groups.length);
  const bw = Math.min(26, (gw - 14) / Math.max(1, series.length));
  const y = (v) => T + (1 - v / hi) * (H - T - B);
  const [hover, setHover] = useState(null);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(groups.length - 1, Math.floor((px - L) / gw))));
  };
  return (
    <div dir="ltr" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (hi * i) / 4;
          return <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={i ? "2 4" : ""} /><text x={L - 8} y={y(v) + 4} textAnchor="end" style={txt}>{v.toFixed(decimals)}</text></g>;
        })}
        {groups.map((g, gi) => (
          <g key={gi}>
            {hover === gi && <rect x={L + gi * gw + 2} y={T} width={Math.max(0, gw - 4)} height={H - T - B} fill="var(--ink)" opacity=".04" rx="4" />}
            {series.map((s, si) => {
              const raw = s.values[gi];
              const hasVal = typeof raw === "number" && Number.isFinite(raw);
              const bx = L + gi * gw + (gw - bw * series.length) / 2 + si * bw;
              if (!hasVal) {
                return showValues ? <text key={si} x={bx + (bw - 3) / 2} y={H - B - 6} textAnchor="middle" style={{ ...txt, fontSize: 9.5 }}>—</text> : null;
              }
              return <g key={si}><rect x={bx} y={y(raw)} width={bw - 3} height={Math.max(0, H - B - y(raw))} fill={s.color} rx="2" opacity={hover === null || hover === gi ? 1 : 0.72} />{showValues && raw > 0 && <text x={bx + (bw - 3) / 2} y={y(raw) - 4} textAnchor="middle" style={{ ...txt, fontSize: 9.5 }}>{Number(raw).toFixed(decimals)}</text>}</g>;
            })}
            {gi % every === 0 && <text x={L + gi * gw + gw / 2} y={H - 10} textAnchor="middle" style={txt}>{g}</text>}
          </g>
        ))}
        {unit && <text x={4} y={12} style={txt}>{unit}</text>}
      </svg>
      {hover != null && (
        <div style={{ position: "absolute", top: 6, insetInlineStart: `${Math.min(68, ((L + hover * gw) / W) * 100)}%`, transform: "translateX(8px)", background: "var(--olive-900)", color: "var(--limestone)", padding: "6px 10px", borderRadius: 8, fontSize: 12, pointerEvents: "none", fontFamily: "var(--f-mono)", zIndex: 2 }}>
          <div style={{ opacity: .75 }}>{groups[hover]}</div>
          {series.map((s, i) => {
            const v = s.values[hover];
            return <div key={i}><span style={{ color: s.color }}>●</span> {s.name}: {typeof v === "number" && Number.isFinite(v) ? `${Number(v).toFixed(decimals)}${unit ? " " + unit : ""}` : "—"}</div>;
          })}
        </div>
      )}
    </div>
  );
}

/* Single-series bar chart (monthly totals such as rainfall). */
export function BarChart({ labels, values, color = "var(--turq)", height = 220, yMax, unit = "", every = 6, decimals = 0 }) {
  const W = 640, H = height, L = 44, R = 14, T = 14, B = 28;
  const hi = yMax ?? niceMax(Math.max(...values, 0.0001));
  const n = values.length, gw = (W - L - R) / n, bw = Math.max(2, Math.min(24, gw - 3));
  const y = (v) => T + (1 - v / hi) * (H - T - B);
  const [hover, setHover] = useState(null);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.floor((px - L) / gw))));
  };
  return (
    <div dir="ltr" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
        {[0, 1, 2, 3, 4].map((i) => { const v = (hi * i) / 4; return <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={i ? "2 4" : ""} /><text x={L - 8} y={y(v) + 4} textAnchor="end" style={txt}>{v.toFixed(hi < 10 ? 1 : 0)}</text></g>; })}
        {values.map((v, i) => <rect key={i} x={L + i * gw + (gw - bw) / 2} y={y(v)} width={bw} height={Math.max(0, H - B - y(v))} rx="1.5" fill={color} opacity={hover === i ? 1 : 0.78} />)}
        {labels.map((l, i) => (i % every === 0 ? <text key={i} x={L + i * gw + gw / 2} y={H - 8} textAnchor="middle" style={txt}>{l}</text> : null))}
        {unit && <text x={4} y={12} style={txt}>{unit}</text>}
      </svg>
      {hover != null && (
        <div style={{ position: "absolute", top: 6, insetInlineStart: `${Math.min(70, ((L + hover * gw) / W) * 100)}%`, transform: "translateX(8px)", background: "var(--olive-900)", color: "var(--limestone)", padding: "6px 10px", borderRadius: 8, fontSize: 12, pointerEvents: "none", fontFamily: "var(--f-mono)" }}>
          <div style={{ opacity: .7 }}>{labels[hover]}</div><div>{Number(values[hover]).toFixed(decimals)}{unit ? " " + unit : ""}</div>
        </div>
      )}
    </div>
  );
}

export function Radar({ axes, series, size = 320 }) {
  const c = size / 2, R = size / 2 - 78, n = axes.length;
  const pt = (i, v) => { const a = (-Math.PI / 2) + (i * 2 * Math.PI) / n; return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)]; };
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", maxWidth: 400, margin: "0 auto" }} role="img">
        {[25, 50, 75, 100].map((r) => <polygon key={r} points={axes.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="var(--line)" />)}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 100), [lx, ly] = pt(i, 120);
          return <g key={i}><line x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" /><text x={lx} y={ly + 4} textAnchor={lx < c - 4 ? "end" : lx > c + 4 ? "start" : "middle"} style={{ ...txt, fontSize: 11.5, fill: "var(--ink-2)", fontFamily: "var(--f-body)" }}>{a}</text></g>;
        })}
        {series.map((s, si) => (
          <g key={si}>
            <polygon points={s.values.map((v, i) => pt(i, v).join(",")).join(" ")} fill={s.color} fillOpacity=".16" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.dashed ? "5 4" : ""} />
            {s.values.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r="3" fill={s.color} />; })}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Ring({ value, size = 96, color = "var(--moss)", label, sub }) {
  const r = size / 2 - 8, C = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(C * value) / 100} ${C}`} style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", lineHeight: 1.1 }}>
        <div><div className="display" style={{ fontSize: size / 3.4 }}>{label ?? value}</div>{sub && <div className="tip">{sub}</div>}</div>
      </div>
    </div>
  );
}

export function Spark({ values, color = "var(--moss)", w = 120, h = 36 }) {
  const lo = Math.min(...values), hi = Math.max(...values);
  const pts = values.map((v, i) => [(i * (w - 6)) / (values.length - 1) + 3, h - 4 - ((v - lo) / (hi - lo || 1)) * (h - 10)]);
  return (
    <svg dir="ltr" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={`M${pts[0][0]},${h} L${pts.map((p) => p.join(",")).join(" L")} L${pts[pts.length - 1][0]},${h}Z`} fill={color} opacity=".14" />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.2" fill={color} />
    </svg>
  );
}
