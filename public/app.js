/* 일상의 발견 (Marketing Magazine) — 첫 화면 3D 서가(카테고리 표지) · 아래 매거진 영역 · 글 신청 */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const catHref = (c) => `category.html?c=${encodeURIComponent(c)}`;
const countOf = (c) => ARTICLES.filter((a) => a.cat === c).length;
const no = (i) => String(i + 1).padStart(2, "0");

// ── 3D 서가: 카테고리 표지들이 깊이 방향으로 줄지어 있고, 스크롤하면 그 사이를 지나간다 ──
// 지나간 표지는 사라지지 않고 왼쪽 위 서가(#shelf)의 제 칸으로 날아가 꽂힌다 → 몇 갈래인지 · 무엇이 있는지 한눈에 남는다
const N = CATEGORIES.length, D = 950, P = 1100;
const world = $("#world"), tunnel = $(".tunnel"), info = $("#info"), shelf = $("#shelf"), next = $("#next"), root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
tunnel.style.setProperty("--n", N);
// 화면 폭·높이에 대한 % 자리. 데스크톱은 왼쪽 글을 피해 오른쪽으로, 마지막 표지는 가운데
const SIDE = innerWidth < 760 ? [[-12, -2], [12, 1], [-8, 2], [10, -2]] : [[14, -2], [22, 2], [12, 3], [24, -3]];
const pos = (i) => (i === N - 1 ? [0, 0] : SIDE[i % SIDE.length]);
world.innerHTML = CATEGORIES.map((c, i) => `<a class="card" href="${catHref(c.name)}" data-i="${i}"><img src="${c.img}" alt="" draggable="false"><span class="k-no"><b>${c.name}</b><span>${no(i)}</span></span></a>`).join("");
shelf.innerHTML = CATEGORIES.map((c, i) => `<button type="button" data-i="${i}" aria-label="${c.name} 보기"><span class="slot">${no(i)}<img src="${c.img}" alt=""></span><span class="nm">${c.name}</span></button>`).join("");
const cards = [...world.children], slots = [...shelf.children], thumbs = slots.map((b) => $("img", b));
$("#menu").innerHTML = CATS.map((c) => `<a href="${catHref(c)}">${c}</a>`).join("");
let active = -1, z = reduced ? 0 : -2600, vel = 0, lastZ = 0, px = 0, py = 0, tx = 0, ty = 0;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = CATEGORIES.map((c) => hex(c.bg));
const clamp = (x) => Math.min(1, Math.max(0, x));
function setInfo(i) {
  active = i; const c = CATEGORIES[i];
  slots.forEach((b, k) => b.setAttribute("aria-current", k === i));
  $("#n-label").textContent = i === N - 1 ? "글 보러 가기" : "다음";
  info.classList.add("swap");
  setTimeout(() => {
    $("#i-cat").textContent = `카테고리 ${no(i)} / ${no(N - 1)}`; $("#i-title .ln > span").textContent = c.name; $("#i-sum").textContent = c.desc;
    $("#i-meta").textContent = `글 ${countOf(c.name)}편 보기`; $("#go").href = catHref(c.name);
    info.classList.remove("swap");
  }, 260);
}
const span = () => tunnel.offsetHeight - innerHeight * 2.3;
const scrollToCard = (i) => scrollTo({ top: tunnel.offsetTop + (i / (N - 1)) * span(), behavior: reduced ? "auto" : "smooth" });
// 앞에 온 표지를 누르면 그 카테고리로, 뒤에 있는 표지를 누르면 그 표지 앞으로 간다
world.addEventListener("click", (e) => { const c = e.target.closest(".card"); if (!c) return; const i = +c.dataset.i; if (i !== active) { e.preventDefault(); scrollToCard(i); } });
shelf.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) scrollToCard(+b.dataset.i); });
next.addEventListener("click", () => active < N - 1 ? scrollToCard(active + 1) : $("#lead-sec").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }));
addEventListener("scroll", () => scrollY > 60 && (document.body.dataset.moved = "1"), { passive: true });
addEventListener("pointermove", (e) => { px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; });
let last = performance.now(), t = 0;
(function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  const sp = span();
  const raw = (scrollY - tunnel.offsetTop) / sp;              // 0 → 1 : 첫 표지 → 마지막 표지
  const finP = clamp((raw - 1) * sp / (innerHeight * 1.1));   // 끝에서는 마지막 표지 속으로
  const target = clamp(raw) * (N - 1) * D + finP * P * 0.62;
  z = reduced ? target : z + (target - z) * (1 - Math.exp(-6 * dt));
  tx += (px - tx) * (1 - Math.exp(-4 * dt)); ty += (py - ty) * (1 - Math.exp(-4 * dt));
  world.style.transform = `translate3d(${-tx * 1.2}vw, ${-ty * 1.2}vh, ${z}px) rotateY(${tx * 3}deg) rotateX(${-ty * 2}deg)`;
  vel += ((z - lastZ) / Math.max(dt, 0.001) - vel) * (1 - Math.exp(-8 * dt)); lastZ = z;
  const tilt = reduced ? 0 : Math.max(-16, Math.min(16, vel * 0.006));
  const f = z / D, near = Math.min(N - 1, Math.max(0, Math.round(f)));
  cards.forEach((c, i) => {
    const d = i - f;                                          // 0 = 바로 앞, 양수 = 아직 멀리
    const fin = i === N - 1 ? finP : 0;
    const [x, y] = pos(i);
    const bob = reduced ? 0 : Math.sin(t * 0.8 + i * 1.7) * 6;
    const far = clamp(d), e = far * far * (3 - 2 * far);       // 멀리 있을 땐 옆으로 돌아서 있다가 다가오며 정면으로
    c.style.transform = `translate3d(${x * (1 - fin) + (i % 2 ? 9 : -9) * e}vw, ${y * (1 - fin)}vh, ${-i * D}px) translateY(${bob}px) rotateY(${(i % 2 ? -1 : 1) * 62 * e * (1 - fin) + (i === near ? tx * 9 : 0) + tilt}deg) rotateX(${i === near ? -ty * 6 : 0}deg) rotateZ(${(i % 2 ? 5 : -5) * e}deg)`;
    c.style.opacity = d < -0.12 && !fin ? clamp(1 + (d + 0.12) * 5) : clamp(1.15 - d * 0.3);
    c.style.pointerEvents = Math.abs(d) < 1.2 ? "auto" : "none";
    // 서가: 표지가 지나가면 무대 가운데에서 제 칸으로 줄어들며 꽂힌다(스크롤을 되돌리면 다시 빠져나온다)
    const p = i === N - 1 ? clamp(finP * 1.6) : clamp((-d - 0.16) / 0.5), k = 1 - (1 - p) ** 3, im = thumbs[i];
    if (p > 0 && p < 1) {
      const r = slots[i].firstChild.getBoundingClientRect(), s = Math.min(5, c.offsetWidth / r.width);
      im.style.transform = `translate(${(innerWidth * (0.5 + x / 100) - r.left - r.width / 2) * (1 - k)}px, ${(innerHeight * 0.5 - r.top - r.height / 2) * (1 - k)}px) scale(${1 + (s - 1) * (1 - k)})`;
    } else im.style.transform = "";
    im.style.opacity = clamp(p * 2.5);
    slots[i].classList.toggle("done", p >= 1);
  });
  if (near !== active) setInfo(near);
  const a = Math.floor(clamp(f / (N - 1)) * (N - 1) * 0.9999), k = f - a;
  const bg = [0, 1, 2].map((ch) => Math.round(BG[a][ch] + (BG[Math.min(N - 1, a + 1)][ch] - BG[a][ch]) * clamp(k)));
  const inTunnel = scrollY < tunnel.offsetTop + tunnel.offsetHeight - innerHeight * 0.5;
  root.style.setProperty("--bgc", inTunnel ? `rgb(${bg})` : "#F8F6F1");
  const lum = inTunnel ? (bg[0] * 299 + bg[1] * 587 + bg[2] * 114) / 1000 : 200;
  const tone = lum > 110 ? "light" : "dark";
  if (document.body.dataset.tone !== tone) document.body.dataset.tone = tone;
  const past = inTunnel ? "0" : "1"; if (document.body.dataset.past !== past) document.body.dataset.past = past;
  const fo = clamp((finP - 0.55) / 0.3);
  $("#finale").style.setProperty("--fo", fo); info.style.visibility = fo > 0.1 ? "hidden" : "visible"; next.style.opacity = shelf.style.opacity = 1 - fo; next.style.visibility = fo > 0.9 ? "hidden" : "visible";
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
