/* 기사 읽기 — 카드를 누르면 사진이 제자리에서 왼쪽으로 날아가 크게 펼쳐지고, 오른쪽에 글이 한 줄씩 올라온다 */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = "reader"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.hidden = true;
  el.innerHTML = `<div class="r-strips" aria-hidden="true">${"<i></i>".repeat(5)}</div><div class="r-photo"><img alt=""></div><article class="r-body"><button class="r-close" aria-label="닫기">닫기 ✕</button><div class="r-in"></div></article>`;
  document.body.appendChild(el);
  const photo = el.querySelector(".r-photo"), img = photo.querySelector("img"), box = el.querySelector(".r-in"), body = el.querySelector(".r-body");
  let from = null, opener = null;

  function open(no, src) {
    const a = ARTICLES.find((x) => x.no === no); if (!a) return;
    opener = src;
    const pic = src.querySelector("img, .ph") || (src.classList.contains("lead-img") ? src : null);
    from = (pic || src).getBoundingClientRect();
    img.src = a.img;
    box.innerHTML = `<span class="r-cat">${a.cat}${a.ad ? `<span class="ad">광고</span>` : ""}</span><h1>${a.title}</h1><p class="r-sum">${a.sum}</p><p class="r-meta">에디터 · ${a.date} · ${a.min}분 읽기</p>${(BODY[no] || []).map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join("")}<p class="r-tags">${a.tags.map((t) => `<span>#${t}</span>`).join("")}</p><section class="r-cm"><h2>이 글의 댓글 <small></small></h2><ul class="list"></ul><form class="form" autocomplete="off"><label>이름<input name="name" maxlength="16" required placeholder="이름 또는 별명"></label><label>내용<textarea name="text" maxlength="300" rows="3" required placeholder="읽고 떠오른 이야기를 남겨 주세요"></textarea></label><div class="row end"><span class="msg" role="status"></span><button type="submit">남기기</button></div></form></section>`;
    comments(no);
    [...box.children].forEach((c, i) => c.style.setProperty("--i", i));
    el.hidden = false; body.scrollTop = 0; document.documentElement.style.overflow = "hidden";
    // 사진: 누른 자리 → 왼쪽 큰 자리 (FLIP)
    const to = photo.getBoundingClientRect();
    const sx = from.width / to.width, sy = from.height / to.height;
    photo.style.transition = "none";
    photo.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`;
    el.classList.remove("on");
    photo.getBoundingClientRect();
    requestAnimationFrame(() => { photo.style.transition = ""; photo.style.transform = ""; el.classList.add("on"); });
    el.querySelector(".r-close").focus({ preventScroll: true });
    history.pushState({ reader: no }, "", "#read-" + no);
  }
  function close(pop) {
    if (el.hidden) return;
    el.classList.remove("on");
    if (from && !reduced) { const to = photo.getBoundingClientRect(); photo.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`; }
    setTimeout(() => { el.hidden = true; photo.style.transform = ""; document.documentElement.style.overflow = ""; opener?.focus?.({ preventScroll: true }); }, reduced ? 0 : 520);
    if (!pop && location.hash.startsWith("#read-")) history.back();
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open]");
    if (t) { e.preventDefault(); open(t.dataset.open, t); return; }
    if (e.target.closest(".r-close")) close();
  });
  // 댓글은 각 글에만 달린다. 지우는 버튼은 여기에 없다(관리 화면 admin.html 에서만)
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "방금" : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`; };
  async function comments(no, fresh) {
    const cm = box.querySelector(".r-cm"), msg = cm.querySelector(".msg");
    let list = [];
    try { list = await Store.comments(no); } catch { msg.textContent = "댓글을 불러오지 못했어요."; }
    if (!box.contains(cm)) return;                              // 그사이 다른 글을 열었다
    cm.querySelector("small").textContent = list.length || "";
    cm.querySelector(".list").innerHTML = list.length ? list.map((c) => `<li class="${c.id === fresh ? "new" : ""}"><span class="face">${esc([...c.name][0] || "?")}</span><div><b>${esc(c.name)}</b><p>${esc(c.text)}</p></div><time>${ago(c.at)}</time></li>`).join("") : `<li class="empty">아직 댓글이 없어요. 첫 이야기를 남겨 주세요.</li>`;
    if (!Store.live && !msg.textContent) msg.textContent = "지금은 댓글이 이 브라우저에만 저장돼요.";
    cm.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault();
      const f = ev.target, btn = f.querySelector("button");
      btn.disabled = true; msg.textContent = "";
      try { const c = await Store.addComment({ article: no, name: f.name.value, text: f.text.value }); f.text.value = ""; await comments(no, c.id); }
      catch (e) { msg.textContent = e.message || "남기지 못했어요. 다시 시도해 주세요."; }
      btn.disabled = false;
    };
  }
  addEventListener("keydown", (e) => e.key === "Escape" && close());
  addEventListener("popstate", () => close(true));
})();
