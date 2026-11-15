import React from "react";

/* Small stroke icon set (24×24, 1.8 stroke). Paths are editable here. */
const P = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  sprout: "M7 20h10M12 20v-9M12 11c0-4-3-6-7-6 0 4 3 6 7 6zM12 13c0-3 2-5 6-5 0 3-2 5-6 5z",
  star: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",
  rotate: "M21 12a9 9 0 0 1-15.5 6.2M3 12A9 9 0 0 1 18.5 5.8M18 2v4h-4M6 22v-4h4",
  gauge: "M4 18a8 8 0 1 1 16 0M12 18l4-6M3 21h18",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7",
  droplet: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  layers: "M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  volume: "M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9.5 9.5 0 0 1 0 14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l5 5L20 7",
  play: "M7 4l13 8-13 8z",
  skip: "M5 4l10 8-10 8zM19 5v14",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  flask: "M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  replay: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  alert: "M12 3l10 18H2zM12 10v5M12 18h.01",
  thermo: "M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z",
  rain: "M16 13v6M8 13v6M12 15v6M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3",
  pin: "M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  calendar: "M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4",
  down: "M6 9l6 6 6-6",
  leaf: "M5 20C5 11 11 5 20 4c0 9-6 15-15 16zM5 20c3-5 6-8 10-10",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  chart: "M3 3v18h18M7 15l4-5 3 3 5-7",
  sat: "M13 7l4 4-6 6-4-4zM17 3l4 4M3 17l4 4M14 14l4 4M10 4l2 2M4 10l2 2",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  pause: "M8 5v14M16 5v14",
  copy: "M9 9h11v11H9zM5 15V4h11",
  x: "M6 6l12 12M18 6L6 18",
};

export default function Icon({ name, size = 20, stroke = 1.8, className, style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(P[name] || "").split(/(?=M)/).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
