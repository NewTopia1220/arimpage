// ARIM 매거진 — 의존성 없는 로컬 서버. 실행: node server.js → http://localhost:4173
// 화면을 띄워 보는 용도이자, 실제 서버가 따라야 할 요청 모양(README 「서버 연결」)의 본보기다.
// 댓글은 data/comments.json, 글 신청은 data/applications.json 에 저장한다. 지우기·신청 목록은 ADMIN_TOKEN 이 맞아야 한다.
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 4173;
const ADMIN = process.env.ADMIN_TOKEN || "";
const PUB = path.join(__dirname, "public");
const FILE = { comments: path.join(__dirname, "data", "comments.json"), applications: path.join(__dirname, "data", "applications.json") };
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const read = (k) => { try { return JSON.parse(fs.readFileSync(FILE[k], "utf8")); } catch { return []; } };
const write = (k, list) => fs.writeFileSync(FILE[k], JSON.stringify(list, null, 1));
const send = (res, code, body, type = "application/json; charset=utf-8") => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
const str = (v, n) => String(v || "").trim().slice(0, n);
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const body = (req) => new Promise((ok, no) => { let raw = ""; req.on("data", (c) => { raw += c; if (raw.length > 8000) req.destroy(); }); req.on("end", () => { try { ok(JSON.parse(raw)); } catch { no(); } }); req.on("error", no); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const m = url.pathname.match(/^\/api\/(comments|applications)(?:\/([a-z0-9]+))?$/);
  if (m) {
    const [, kind, id] = m, admin = ADMIN && req.headers.authorization === `Bearer ${ADMIN}`;
    try {
      if (req.method === "DELETE" && id) {
        if (!admin) return send(res, 401, { error: "관리자만 지울 수 있어요" });
        write(kind, read(kind).filter((x) => x.id !== id));
        return send(res, 200, { ok: true });
      }
      if (req.method === "GET" && !id) {
        if (kind === "applications" && !admin) return send(res, 401, { error: "관리자만 볼 수 있어요" });
        const article = url.searchParams.get("article");
        return send(res, 200, read(kind).filter((x) => !article || x.article === article));
      }
      if (req.method === "POST" && !id) {
        const b = await body(req);
        const row = kind === "comments"
          ? { id: newId(), article: /^\d{2}$/.test(b.article) ? b.article : "", name: str(b.name, 16), text: str(b.text, 300), at: Date.now() }
          : { id: newId(), shop: str(b.shop, 40), kind: str(b.kind, 40), name: str(b.name, 40), contact: str(b.contact, 40), text: str(b.text, 600), at: Date.now() };
        if (Object.values(row).some((v) => v === "")) return send(res, 400, { error: "빈 칸을 채워 주세요" });
        write(kind, [row, ...read(kind)].slice(0, 500));
        return send(res, 200, row);
      }
    } catch { return send(res, 400, { error: "잘못된 요청이에요" }); }
    return send(res, 405, {});
  }
  const file = path.normalize(path.join(PUB, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(PUB)) return send(res, 403, "no", "text/plain");
  fs.readFile(file, (err, buf) => err ? send(res, 404, "not found", "text/plain") : send(res, 200, buf, TYPES[path.extname(file)] || "application/octet-stream"));
}).listen(PORT, () => console.log(`ARIM → http://localhost:${PORT}`));
