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
    box.innerHTML = `<span class="r-cat">${a.cat}${a.ad ? `<span class="ad">광고</span>` : ""}</span><h1>${a.title}</h1><p class="r-sum">${a.sum}</p><p class="r-meta">에디터 · ${a.date} · ${a.min}분 읽기</p>${(BODY[no] || []).map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join("")}<p class="r-tags">${a.tags.map((t) => `<span>#${t}</span>`).join("")}</p><a class="r-go" href="index.html#comments" data-no="${no}">이 글에 댓글 남기기 →</a>`;
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
    if (e.target.closest(".r-go")) { el.hidden = true; document.documentElement.style.overflow = ""; const p = document.getElementById("pick"); if (p) p.value = e.target.closest(".r-go").dataset.no; }
  });
  addEventListener("keydown", (e) => e.key === "Escape" && close());
  addEventListener("popstate", () => close(true));
})();
