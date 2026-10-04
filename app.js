/* 일상의 발견 (Marketing Magazine) — 첫 화면 회전목마(카테고리 표지) · 아래 매거진 영역 · 글 신청 */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const catHref = (c) => `category.html?c=${encodeURIComponent(c)}`;
const countOf = (c) => ARTICLES.filter((a) => a.cat === c).length;
const no = (i) => String(i + 1).padStart(2, "0");

// ── 첫 화면 회전목마 ──
// 카테고리 표지가 둥근 고리 위에 놓여 있다. 스크롤하면 고리가 한 칸씩 돌아 다음 표지가 앞으로 온다.
// 지나간 표지는 사라지지 않고 뒤쪽으로 돌아가 작게 남는다 → 몇 갈래인지 · 무엇이 있는지 늘 보인다.
// 표지는 늘 앞을 본다(고리만 돈다). 손가락 · 마우스 위치에 따라 기울이지 않는다.
const N = CATEGORIES.length, TAU = Math.PI * 2;
const ring = $("#ring"), tunnel = $(".tunnel"), info = $("#info"), next = $("#next"), root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x) => Math.min(1, Math.max(0, x));
tunnel.style.setProperty("--n", N);
ring.innerHTML = CATEGORIES.map((c, i) => `<a class="cv" href="${catHref(c.name)}" data-i="${i}"><img src="${c.img}" alt="" draggable="false"><span class="cv-tag"><b>${c.name}</b><span>${no(i)}</span></span></a>`).join("");
const cards = [...ring.children];
$("#menu").innerHTML = CATS.map((c) => `<a href="${catHref(c)}">${c}</a>`).join("");
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = CATEGORIES.map((c) => hex(c.bg));
let f = 0, drawn = -1, active = -1, R = 0, H = 0;
// 고리의 반지름(R)과 뒤쪽이 올라가는 높이(H). 휴대폰은 좁아서 옆 표지가 화면 가장자리에 걸친다
function measure() { const col = innerWidth < 760; R = col ? innerWidth * 0.4 : Math.min(innerWidth * 0.21, 340); H = innerHeight * (col ? 0.36 : 0.54); drawn = -1; }
measure(); addEventListener("resize", measure);
function setInfo(i) {
  active = i; const c = CATEGORIES[i];
  $("#n-label").textContent = i === N - 1 ? "글 보러 가기" : "다음";
  info.classList.add("swap");
  setTimeout(() => {
    $("#i-cat").textContent = `카테고리 ${no(i)} / ${no(N - 1)}`; $("#i-title .ln > span").textContent = c.name; $("#i-sum").textContent = c.desc;
    $("#i-meta").textContent = `글 ${countOf(c.name)}편 보기`; $("#go").href = catHref(c.name);
    info.classList.remove("swap");
  }, 260);
}
const span = () => tunnel.offsetHeight - innerHeight * 1.2;
const scrollToCard = (i) => scrollTo({ top: tunnel.offsetTop + (i / (N - 1)) * span(), behavior: reduced ? "auto" : "smooth" });
// 앞에 온 표지를 누르면 그 카테고리로, 뒤에 있는 표지를 누르면 그 표지가 앞으로 돌아온다
ring.addEventListener("click", (e) => { const c = e.target.closest(".cv"); if (!c) return; const i = +c.dataset.i; if (i !== active) { e.preventDefault(); scrollToCard(i); } });
next.addEventListener("click", () => active < N - 1 ? scrollToCard(active + 1) : $("#lead-sec").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }));
addEventListener("scroll", () => scrollY > 60 && (document.body.dataset.moved = "1"), { passive: true });
let last = performance.now();
(function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const target = clamp((scrollY - tunnel.offsetTop) / span()) * (N - 1);
  f = reduced ? target : f + (target - f) * (1 - Math.exp(-7 * dt));
  const inTunnel = scrollY < tunnel.offsetTop + tunnel.offsetHeight - innerHeight * 0.6;
  const past = inTunnel ? "0" : "1"; if (document.body.dataset.past !== past) { document.body.dataset.past = past; drawn = -1; }
  if (Math.abs(f - drawn) < 0.0004) return; drawn = f;
  cards.forEach((c, i) => {
    const a = (i - f) * TAU / N, depth = (1 - Math.cos(a)) / 2;   // 0 = 맨 앞, 1 = 맨 뒤
    c.style.transform = `translate3d(${Math.sin(a) * R}px, ${-depth * H}px, ${(Math.cos(a) - 1) * R}px) rotateY(${-Math.sin(a) * 14}deg) scale(${1 - depth * 0.5})`;
    c.style.setProperty("--fog", (depth * 0.55).toFixed(3));
    c.style.zIndex = Math.round((1 - depth) * 100);
  });
  const near = Math.min(N - 1, Math.max(0, Math.round(f)));
  if (near !== active) setInfo(near);
  // 바탕색은 앞에 온 표지를 따라 천천히 바뀐다
  const b = Math.min(N - 2, Math.floor(f)), k = f - b;
  const bg = [0, 1, 2].map((ch) => Math.round(BG[b][ch] + (BG[b + 1][ch] - BG[b][ch]) * clamp(k)));
  root.style.setProperty("--bgc", inTunnel ? `rgb(${bg})` : "#F8F6F1");
  const tone = !inTunnel || (bg[0] * 299 + bg[1] * 587 + bg[2] * 114) / 1000 > 110 ? "light" : "dark";
  if (document.body.dataset.tone !== tone) document.body.dataset.tone = tone;
})(last);

// 아래쪽 덩어리: 들어올 때 제목 글줄이 올라오고 목록이 차례로 나타난다
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
document.querySelectorAll("[data-reveal]").forEach((s) => io.observe(s));

// ── 매거진: 대표 기사 · 최신 발견 · 카테고리 ──
const lead = ARTICLES[1];
$("#lead").innerHTML = `<a class="lead-img" href="#" data-open="${lead.no}" style="background-image:url(${lead.img})"></a><div class="lead-txt"><span class="tag">${lead.cat}</span><h3>${lead.title}</h3><p>${lead.sum}</p><small>에디터 박 · ${lead.min}분 읽기</small></div>`;
$("#latest").innerHTML = ARTICLES.filter((a) => a !== lead).map((a, i) => `<li style="--i:${i}"><a href="#" data-open="${a.no}"><span class="ph" style="background-image:url(${a.img})"></span><span class="tag">${a.cat}${a.ad ? ' <em class="ad">협찬</em>' : ""}</span><b>${a.title}</b><span class="sm">${a.sum}</span></a></li>`).join("");
$("#cat-count").textContent = `${["한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟"][N - 1] || N} 갈래의`;
$("#catlist").innerHTML = CATEGORIES.map((c) => `<li><a href="${catHref(c.name)}"><b>${c.name}</b><span>${countOf(c.name)}편 →</span></a></li>`).join("");

// ── 글 신청 ── 저장은 store.js 가 맡는다(서버 연결 전에는 이 브라우저에만 남는다)
$("#apply-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const f = ev.target, btn = f.querySelector("button"), msg = $("#apply-msg");
  btn.disabled = true; msg.textContent = "";
  try {
    await Store.apply(Object.fromEntries(new FormData(f)));
    f.reset();
    msg.textContent = Store.live ? "신청이 접수됐어요. 확인하고 연락드릴게요." : "미리보기 화면이라 실제로 접수되지는 않았어요. 서버 연결 뒤에 접수돼요.";
  } catch (e) { msg.textContent = e.message || "보내지 못했어요. 다시 시도해 주세요."; }
  btn.disabled = false;
});
