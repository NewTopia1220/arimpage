/* 저장소 — 댓글 · 글 신청이 지나가는 한 곳. 지금은 껍데기다.
   서버가 준비되면 API 에 주소만 넣으면 된다(요청 모양은 README 의 「서버 연결」).
   API 가 비어 있으면 이 브라우저(localStorage)에만 저장한다 — 다른 사람에게는 보이지 않는다 */
const Store = (() => {
  const API = ""; // 예: "https://api.example.com"
  const CM = "arim-comments-v2", AP = "arim-applications", TK = "arim-admin-token";
  const ls = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const token = () => { try { return sessionStorage.getItem(TK) || ""; } catch { return ""; } };
  async function call(path, method = "GET", body) {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (token()) headers.Authorization = `Bearer ${token()}`;
    const r = await fetch(API + path, { method, headers, body: body && JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "잠시 뒤에 다시 시도해 주세요");
    return j;
  }
  return {
    live: !!API,
    setToken: (t) => { try { sessionStorage.setItem(TK, t); } catch {} },
    // 댓글: 기사 번호를 주면 그 글의 댓글만, 안 주면 전부(관리 화면)
    comments: (article) => API ? call("/comments" + (article ? `?article=${article}` : "")) : Promise.resolve(ls(CM).filter((c) => !article || c.article === article)),
    async addComment({ article, name, text }) {
      name = String(name || "").trim().slice(0, 16); text = String(text || "").trim().slice(0, 300);
      if (!name || !text) throw new Error("이름과 내용을 적어 주세요");
      if (API) return call("/comments", "POST", { article, name, text });
      const c = { id: id(), article, name, text, at: Date.now() };
      save(CM, [c, ...ls(CM)].slice(0, 300));
      return c;
    },
    // 삭제는 관리 화면에서만 부른다
    removeComment: (cid) => API ? call(`/comments/${cid}`, "DELETE") : Promise.resolve(save(CM, ls(CM).filter((c) => c.id !== cid))),
    async apply(data) {
      const a = {}; for (const k of ["shop", "kind", "name", "contact", "text"]) a[k] = String(data[k] || "").trim().slice(0, k === "text" ? 600 : 40);
      if (!a.shop || !a.name || !a.contact || !a.text) throw new Error("빈 칸을 채워 주세요");
      if (API) return call("/applications", "POST", a);
      const row = { id: id(), ...a, at: Date.now() };
      save(AP, [row, ...ls(AP)].slice(0, 100));
      return row;
    },
    applications: () => API ? call("/applications") : Promise.resolve(ls(AP)),
    removeApplication: (aid) => API ? call(`/applications/${aid}`, "DELETE") : Promise.resolve(save(AP, ls(AP).filter((a) => a.id !== aid))),
  };
})();
