/* npm run dev → http://localhost:5173  (esbuild bundle + live rebuild; refresh the page to see changes) */
import { context } from "esbuild";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/build-data.mjs"], { stdio: "inherit" });
const OUT = ".dev";
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
fs.cpSync("public/media", path.join(OUT, "media"), { recursive: true });
const ctx = await context({ entryPoints: ["src/main.jsx"], bundle: true, format: "iife", jsx: "automatic", outdir: OUT, sourcemap: true, loader: { ".css": "css", ".json": "json" }, define: { "process.env.NODE_ENV": '"development"' }, external: ["media/*"], logLevel: "info" });
await ctx.watch();
const fonts = "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Marcellus&family=Noto+Kufi+Arabic:wght@400;600&display=swap";
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SOPDET FARMSHIELD</title><link rel="stylesheet" href="${fonts}"><link rel="stylesheet" href="main.css"></head><body><div id="root"></div><script src="main.js"></script></body></html>`);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".map": "application/json" };
http.createServer((req, res) => {
  let f = path.join(OUT, decodeURIComponent(req.url.split("?")[0])); if (f.endsWith(path.sep) || !fs.existsSync(f)) f = path.join(OUT, "index.html");
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(5173, () => console.log("SOPDET dev server: http://localhost:5173"));
