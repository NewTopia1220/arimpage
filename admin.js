/* 관리 화면 — 댓글 · 글 신청을 보고 지운다. 독자 화면에는 지우는 버튼이 없고 여기에만 있다.
   서버 연결 전에는 이 브라우저에 저장된 것만 보인다. 서버가 붙으면 비밀번호(토큰)를 물어서 요청에 실어 보낸다 */
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const when = (t) => new Date(t).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
  const title = (no) => ARTICLES.find((a) => a.no === no)?.title || "(없는 글)";
  $("#a-note").textContent = Store.live ? "서버에 저장된 댓글과 신청이에요. 지우면 되돌릴 수 없어요." : "서버 연결 전이에요. 지금은 이 브라우저에 저장된 것만 보이고, 다른 사람이 남긴 것은 보이지 않아요.";
  async function draw() {
    let cs = [], ps = [];
    try { [cs, ps] = await Promise.all([Store.comments(), Store.applications()]); }
    catch (e) {
      if (!Store.live) return;
      const t = prompt("관리자 비밀번호"); if (!t) return ($("#a-note").textContent = "비밀번호가 있어야 볼 수 있어요.");
      Store.setToken(t); return draw();
    }
    $("#c-n").textContent = cs.length; $("#p-n").textContent = ps.length;
    $("#c-rows").innerHTML = cs.length ? cs.map((c) => `<li><div><small>${c.article} ${esc(title(c.article))} · ${when(c.at)}</small><b>${esc(c.name)}</b><p>${esc(c.text)}</p></div><button class="del" data-c="${esc(c.id)}">삭제</button></li>`).join("") : `<li class="none">댓글이 없어요.</li>`;
    $("#p-rows").innerHTML = ps.length ? ps.map((a) => `<li><div><small>${esc(a.kind)} · ${when(a.at)}</small><b>${esc(a.shop)}</b> — ${esc(a.name)} · ${esc(a.contact)}<p>${esc(a.text)}</p></div><button class="del" data-p="${esc(a.id)}">삭제</button></li>`).join("") : `<li class="none">신청이 없어요.</li>`;
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".del"); if (!b || !confirm("지울까요? 되돌릴 수 없어요.")) return;
    b.disabled = true;
    try { await (b.dataset.c ? Store.removeComment(b.dataset.c) : Store.removeApplication(b.dataset.p)); } catch (err) { alert(err.message); }
    draw();
  });
  draw();
})();
