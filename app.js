/* 일상의 발견 (Marketing Magazine) — 스크롤 위치 → 챕터 진행값 T → 값 표 K 를 섞어 잡지 한 권의 자리·기울기·표지와 바탕색을 정한다 */
// 기사(예시). 여기만 바꾸면 화면과 댓글 선택지가 같이 바뀐다
// 기사(예시) — 일상의 발견. 사진은 자리를 보여 주는 임시 사진이에요
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("#pick").innerHTML = ARTICLES.map((a) => `<option value="${a.no}">${a.no} ${a.title}</option>`).join("");

// ── 3D 서가: 표지들이 깊이 방향으로 줄지어 있고, 스크롤하면 그 사이를 지나간다 ──
const N = ARTICLES.length, D = 950, P = 1100;
const world = $("#world"), tunnel = $(".tunnel"), info = $("#info"), root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
tunnel.style.setProperty("--n", N);
const POS = innerWidth < 760 ? [[-12, -3], [12, 4], [-8, 6], [10, -5], [-12, 3], [9, 6], [0, 0]] : [[14, -2], [22, 2], [12, 3], [24, -3], [13, 1], [21, 3], [0, 0]]; // 데스크톱은 왼쪽 아래 글을 피해 오른쪽으로 // 화면 폭·높이에 대한 % 자리(마지막은 가운데)
world.innerHTML = ARTICLES.map((a, i) => `<a class="card" href="#comments" data-i="${i}"><img src="${a.img}" alt="" draggable="false"><span class="k-no"><b>${a.cat}</b><span>${a.no}</span></span></a>`).join("");
const cards = [...world.children];
const catsList = ["전체", ...CATS];
$("#menu").innerHTML = CATS.map((c) => `<a href="category.html?c=${encodeURIComponent(c)}">${c}</a>`).join("");
$("#cats").innerHTML = catsList.map((c, i) => `<button aria-pressed="${!i}" data-c="${c}">${c}</button>`).join("");
let cat = "전체", active = -1, total = {}, z = reduced ? 0 : -2600, vel = 0, lastZ = 0, px = 0, py = 0, tx = 0, ty = 0;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = ARTICLES.map((a) => hex(a.bg));
const clamp = (x) => Math.min(1, Math.max(0, x));
function setInfo(i) {
  active = i; const a = ARTICLES[i];
  info.classList.add("swap");
  setTimeout(() => {
    $("#i-cat").innerHTML = a.cat + (a.ad ? `<span class="ad">광고</span>` : ""); $("#i-title .ln > span").textContent = a.title; $("#i-sum").textContent = a.sum;
    meta(); $("#count").innerHTML = `${a.no} <small>/ ${String(N).padStart(2, "0")}</small>`;
    info.classList.remove("swap");
  }, 260);
}
const meta = () => { const a = ARTICLES[Math.max(0, active)]; $("#i-meta").textContent = `${a.min}분 읽기 · 댓글 ${total[a.no] || 0}개`; };
const scrollToCard = (i) => scrollTo({ top: tunnel.offsetTop + (i / (N - 1)) * (tunnel.offsetHeight - innerHeight * 2.3), behavior: reduced ? "auto" : "smooth" });
world.addEventListener("click", (e) => { const c = e.target.closest(".card"); if (!c) return; const i = +c.dataset.i; $("#pick").value = ARTICLES[i].no; if (i !== active) { e.preventDefault(); scrollToCard(i); } });
$("#go").addEventListener("click", () => ($("#pick").value = ARTICLES[Math.max(0, active)].no));
$("#cats").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; cat = b.dataset.c; document.querySelectorAll("#cats button").forEach((x) => x.setAttribute("aria-pressed", x === b)); const i = ARTICLES.findIndex((a) => cat === "전체" || a.cat === cat); scrollToCard(Math.max(0, i)); });
addEventListener("pointermove", (e) => { px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; });
let last = performance.now(), t = 0;
(function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  const span = tunnel.offsetHeight - innerHeight * 2.3;
  const raw = (scrollY - tunnel.offsetTop) / span;            // 0 → 1 : 첫 표지 → 마지막 표지
  const target = clamp(raw) * (N - 1) * D + clamp((raw - 1) * span / (innerHeight * 1.1)) * P * 0.62; // 끝에서는 마지막 표지 속으로
  z = reduced ? target : z + (target - z) * (1 - Math.exp(-6 * dt));
  tx += (px - tx) * (1 - Math.exp(-4 * dt)); ty += (py - ty) * (1 - Math.exp(-4 * dt));
  world.style.transform = `translate3d(${-tx * 1.2}vw, ${-ty * 1.2}vh, ${z}px) rotateY(${tx * 3}deg) rotateX(${-ty * 2}deg)`;
  vel += ((z - lastZ) / Math.max(dt, 0.001) - vel) * (1 - Math.exp(-8 * dt)); lastZ = z;
  const tilt = reduced ? 0 : Math.max(-16, Math.min(16, vel * 0.006));
  const f = z / D, near = Math.min(N - 1, Math.max(0, Math.round(f)));
  cards.forEach((c, i) => {
    const d = i - f;                                          // 0 = 바로 앞, 양수 = 아직 멀리
    const fin = i === N - 1 ? clamp((raw - 1) * span / (innerHeight * 1.1)) : 0;
    const on = cat === "전체" || ARTICLES[i].cat === cat;
    const [x, y] = POS[i % POS.length];
    const bob = reduced ? 0 : Math.sin(t * 0.8 + i * 1.7) * 6;
    const far = clamp(d), e = far * far * (3 - 2 * far);       // 멀리 있을 땐 옆으로 돌아서 있다가 다가오며 정면으로
    c.style.transform = `translate3d(${x * (1 - fin) + (i % 2 ? 9 : -9) * e}vw, ${y * (1 - fin)}vh, ${-i * D}px) translateY(${bob}px) rotateY(${(i % 2 ? -1 : 1) * 62 * e * (1 - fin) + (i === near ? tx * 9 : 0) + tilt}deg) rotateX(${i === near ? -ty * 6 : 0}deg) rotateZ(${(i % 2 ? 5 : -5) * e}deg)`;
    c.style.opacity = (d < -0.12 && !fin ? clamp(1 + (d + 0.12) * 5) : clamp(1.15 - d * 0.3)) * (on ? 1 : 0.18);
    c.style.pointerEvents = Math.abs(d) < 1.2 ? "auto" : "none";
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
  const fo = clamp(((raw - 1) * span / (innerHeight * 1.1) - 0.55) / 0.3);
  $("#finale").style.setProperty("--fo", fo); info.style.visibility = fo > 0.1 ? "hidden" : "visible"; $("#count").style.opacity = 1 - fo; $("#cats").style.opacity = 1 - fo;
})(last);

// 아래쪽 덩어리: 들어올 때 제목 글줄이 올라오고 목록이 차례로 나타난다
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
document.querySelectorAll("[data-reveal]").forEach((s) => io.observe(s));

// ── 댓글 ──
const face = (name) => `<span class="face">${esc([...name][0] || "?")}</span>`;
const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "방금" : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`; };
let newest = null;
function render(list) {
  $("#list").innerHTML = list.length ? list.map((c) => `<li class="${c.id === newest ? "new" : ""}">${face(c.name)}<div><b>${esc(c.name)}</b><p>${esc(c.text)}</p></div><div><em>${c.article} ${esc(ARTICLES.find((a) => a.no === c.article)?.title || "")}</em><br><time>${ago(c.at)}</time></div></li>`).join("") : `<li class="empty" style="display:block">아직 댓글이 없어요. 첫 이야기를 남겨 주세요.</li>`;
  // 독자 벽: 사람마다 가장 최근 글 하나
  const seen = new Set(), people = list.filter((c) => !seen.has(c.name) && seen.add(c.name)).slice(0, 9);
  $("#wall").innerHTML = people.length ? people.map((c, i) => `<li style="--i:${i}">${face(c.name)}<div><b>${esc(c.name)}</b><span>${esc(c.text)}</span></div></li>`).join("") : `<li class="empty" style="display:block">아직 실린 독자가 없어요.<br>아래에서 첫 댓글을 남기면 이 자리에 이름이 실려요.</li>`;
  total = {};
  for (const a of ARTICLES) total[a.no] = list.filter((c) => c.article === a.no).length;
  meta();
}
// 서버(node server.js)가 있으면 서버에 저장하고, 없으면(깃허브 페이지 같은 정적 호스팅) 이 브라우저에만 저장한다
const LS = "arim-comments"; let local = false;
const lsRead = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
const load = () => fetch("api/comments").then((r) => { if (!r.ok) throw 0; return r.json(); }).then(render).catch(() => { local = true; render(lsRead()); $("#msg").textContent = "지금은 댓글이 이 브라우저에만 저장돼요."; });
load();
$("#form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const f = ev.target, btn = f.querySelector("button"), msg = $("#msg");
  btn.disabled = true; msg.textContent = "";
  try {
    const data = Object.fromEntries(new FormData(f));
    let j;
    if (local) {
      if (!data.name.trim() || !data.text.trim()) throw new Error("이름과 내용을 적어 주세요");
      j = [{ id: Date.now().toString(36), name: data.name.trim().slice(0, 16), text: data.text.trim().slice(0, 300), article: data.article, at: Date.now() }, ...lsRead()].slice(0, 200);
      try { localStorage.setItem(LS, JSON.stringify(j)); } catch {}
    } else {
      const r = await fetch("api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      j = await r.json();
      if (!r.ok) throw new Error(j.error);
    }
    newest = j[0].id; f.text.value = ""; render(j);
  } catch (e) { msg.textContent = e.message || "남기지 못했어요. 다시 시도해 주세요."; }
  btn.disabled = false;
});


// ── 매거진: 대표 기사 · 최신 발견 · 카테고리 ──
const lead = ARTICLES[1];
$("#lead").innerHTML = `<a class="lead-img" href="#" data-open="${lead.no}" style="background-image:url(${lead.img})"></a><div class="lead-txt"><span class="tag">${lead.cat}</span><h3>${lead.title}</h3><p>${lead.sum}</p><small>에디터 박 · ${lead.min}분 읽기</small></div>`;
$("#latest").innerHTML = ARTICLES.filter((a) => a !== lead).map((a, i) => `<li style="--i:${i}"><a href="#" data-open="${a.no}"><span class="ph" style="background-image:url(${a.img})"></span><span class="tag">${a.cat}${i === 2 ? ' <em class="ad">협찬</em>' : ""}</span><b>${a.title}</b><span class="sm">${a.sum}</span></a></li>`).join("");
$("#catlist").innerHTML = CATS.map((c) => `<li><b>${c}</b><span>${ARTICLES.filter((a) => a.cat === c).length}편</span></li>`).join("");
