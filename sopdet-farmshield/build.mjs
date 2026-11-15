/*
 * Production build (esbuild only):  npm run build
 *   1. regenerates src/data/*.json from data/nasa/*.csv (and re-validates them)
 *   2. bundles src/main.jsx → dist/index.html (+ dist/page.html, the same app as one fragment)
 *   3. copies public/media → dist/media
 * Output opens directly from disk (file://) or from any static host; no server, API or database is needed.
 */
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/build-data.mjs"], { stdio: "inherit" });

const r = await build({
  entryPoints: ["src/main.jsx"], bundle: true, minify: true, format: "iife", jsx: "automatic", write: false, outdir: "dist",
  loader: { ".css": "css", ".json": "json" }, define: { "process.env.NODE_ENV": '"production"' }, external: ["media/*"], logLevel: "warning",
});
let js = "", css = "";
for (const f of r.outputFiles) { if (f.path.endsWith(".js")) js = f.text; if (f.path.endsWith(".css")) css = f.text; }
js = js.replace(/<\/script/gi, "<\\/script");

const fonts = "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Marcellus&family=Noto+Kufi+Arabic:wght@400;600&display=swap";
const page = `<title>SOPDET FARMSHIELD</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/page.html", page);
fs.writeFileSync("dist/index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${page}</body></html>`);
fs.cpSync("public/media", "dist/media", { recursive: true });
console.log("built dist/index.html  " + (fs.statSync("dist/index.html").size / 1024).toFixed(0) + " KB  (+ dist/media)");
