/* 일상의 발견 (Marketing Magazine) — 첫 화면 갈래 판(카테고리) · 아래 매거진 영역 · 글 신청 */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const catHref = (c) => `category.html?c=${encodeURIComponent(c)}`;
const countOf = (c) => ARTICLES.filter((a) => a.cat === c).length;
const no = (i) => String(i + 1).padStart(2, "0");

// ── 첫 화면 갈래 판 ──
// 카테고리 판이 처음부터 전부 보인다. 하나만 펼쳐져 있고 나머지는 띠로 접혀 있다.
// 스크롤하면 펼쳐진 판이 접히면서 다음 판이 펼쳐진다 → 지나간 갈래도 띠로 남아 몇 갈래인지 · 무엇이 있는지 늘 보인다.
// 기울이거나 돌리지 않는다. 움직이는 것은 판의 폭(휴대폰은 높이)뿐이다.
const N = CATEGORIES.length;
const deck = $("#deck"), tunnel = $(".tunnel");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x) => Math.min(1, Math.max(0, x));
tunnel.style.setProperty("--n", N);
deck.innerHTML = CATEGORIES.map((c, i) => `<a class="pane" href="${catHref(c.name)}" data-i="${i}"><img src="${c.img}" alt="" draggable="false" style="object-position:${c.pos || "50% 50%"}"><span class="p-spine"><i>${no(i)}</i><b>${c.name}</b></span>${i ? "" : `<span class="p-hint">아래로 내리면 다음 갈래 <i aria-hidden="true">↓</i></span>`}<span class="p-body"><small>카테고리 ${no(i)} / ${no(N - 1)}</small><strong>${c.name}</strong><em>${c.desc}</em><u>글 ${countOf(c.name)}편 보기 ↗</u></span></a>`).join("");
const panes = [...deck.children];
$("#menu").innerHTML = CATS.map((c) => `<a href="${catHref(c)}">${c}</a>`).join("");
// 접힌 띠의 굵기와 펼친 판의 크기. 사진과 글은 펼친 크기에 고정해 두어서, 판이 접혀도 다시 줄 바꿈되거나 늘어나지 않는다
function measure() {
  const col = innerWidth < 760, spine = col ? 54 : 78, gap = col ? 8 : 10;
  deck.style.setProperty("--spine", spine + "px"); deck.style.setProperty("--gap", gap + "px");
  deck.style.setProperty("--open", Math.max(120, (col ? deck.clientHeight : deck.clientWidth) - (N - 1) * (spine + gap)) + "px");
}
measure(); addEventListener("resize", measure);
const span = () => tunnel.offsetHeight - innerHeight * 1.2;
const scrollToPane = (i) => scrollTo({ top: tunnel.offsetTop + (i / (N - 1)) * span(), behavior: reduced ? "auto" : "smooth" });
let f = 0, drawn = -1, active = 0;
// 펼쳐진 판을 누르면 그 카테고리로, 접힌 띠를 누르면 그 판을 펼친다
deck.addEventListener("click", (e) => { const p = e.target.closest(".pane"); if (!p) return; const i = +p.dataset.i; if (i !== active) { e.preventDefault(); scrollToPane(i); } });
addEventListener("scroll", () => scrollY > 60 && (document.body.dataset.moved = "1"), { passive: true });
let last = performance.now();
(function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const target = clamp((scrollY - tunnel.offsetTop) / span()) * (N - 1);
  f = reduced ? target : f + (target - f) * (1 - Math.exp(-9 * dt));
  const past = scrollY > tunnel.offsetTop + tunnel.offsetHeight - innerHeight * 0.6 ? "1" : "0";
  if (document.body.dataset.past !== past) document.body.dataset.past = past;
  if (Math.abs(f - drawn) < 0.0004) return; drawn = f;
  const b = Math.min(N - 2, Math.floor(f)), k = f - b, fe = b + k * k * (3 - 2 * k);   // 판 사이에서는 부드럽게 넘어가고, 판 위에서는 머문다
  active = Math.round(fe);
  panes.forEach((p, i) => p.style.setProperty("--w", Math.max(0, 1 - Math.abs(i - fe)).toFixed(4)));
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
