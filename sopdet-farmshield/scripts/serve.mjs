/* npm run preview → serves the built dist/ folder at http://localhost:4173 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
const DIR = "dist", port = Number(process.env.PORT) || 4173;
if (!fs.existsSync(path.join(DIR, "index.html"))) { console.error("dist/ not found. Run: npm run build"); process.exit(1); }
const types = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".mp4": "video/mp4" };
http.createServer((req, res) => {
  let f = path.join(DIR, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(path.resolve(DIR)) && !f.startsWith(DIR)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIR, "index.html");
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`SOPDET preview: http://localhost:${port}`));
