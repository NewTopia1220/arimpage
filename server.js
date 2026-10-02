// ARIM 매거진 — 의존성 없는 로컬 서버. 실행: node server.js → http://localhost:4173
// 댓글은 data/comments.json 에 저장한다.
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 4173;
const PUB = path.join(__dirname, "public");
const DB = path.join(__dirname, "data", "comments.json");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const read = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return []; } };
const send = (res, code, body, type = "application/json; charset=utf-8") => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(body); };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/comments") {
    if (req.method === "GET") return send(res, 200, JSON.stringify(read()));
    if (req.method === "POST") {
      let raw = "";
      req.on("data", (c) => { raw += c; if (raw.length > 4000) req.destroy(); });
      req.on("end", () => {
        try {
          const b = JSON.parse(raw);
          const name = String(b.name || "").trim().slice(0, 16);
          const text = String(b.text || "").trim().slice(0, 300);
          const article = /^0[1-9]$/.test(b.article) ? b.article : "01";
          if (!name || !text) return send(res, 400, JSON.stringify({ error: "이름과 내용을 적어 주세요" }));
          const list = read();
          list.unshift({ id: Date.now().toString(36), name, text, article, at: Date.now() });
          fs.writeFileSync(DB, JSON.stringify(list.slice(0, 500), null, 1));
          send(res, 200, JSON.stringify(list));
        } catch { send(res, 400, JSON.stringify({ error: "잘못된 요청이에요" })); }
      });
      return;
    }
    return send(res, 405, "{}");
  }
  const file = path.normalize(path.join(PUB, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(PUB)) return send(res, 403, "no", "text/plain");
  fs.readFile(file, (err, buf) => err ? send(res, 404, "not found", "text/plain") : send(res, 200, buf, TYPES[path.extname(file)] || "application/octet-stream"));
}).listen(PORT, () => console.log(`ARIM → http://localhost:${PORT}`));
