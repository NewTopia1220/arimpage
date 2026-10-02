/* 카테고리 페이지 — category.html?c=맛과 공간 */
const DESC = { "맛과 공간": "맛집, 카페, 도서관, 머물기 좋은 장소", "여행과 나들이": "당일치기, 여행 코스, 숙박, 지역 명소", "운동과 취미": "러닝, 배드민턴, 골프, 다양한 체험", "생활과 발견": "생활용품, 사용기, 생활 서비스, 실용 정보", "사람과 생각": "에세이, 인터뷰, 교육 경험, 브랜드 이야기" };
const q = new URLSearchParams(location.search).get("c");
const cat = CATS.includes(q) ? q : CATS[0];
document.title = `${cat} — 일상의 발견`;
document.getElementById("menu").innerHTML = CATS.map((c) => `<a href="category.html?c=${encodeURIComponent(c)}"${c === cat ? ' aria-current="page"' : ""}>${c}</a>`).join("");
document.querySelector("#c-title .ln > span").textContent = cat;
const list = ARTICLES.filter((a) => a.cat === cat);
document.getElementById("c-desc").textContent = `${DESC[cat]} · 글 ${list.length}편`;
document.getElementById("c-grid").innerHTML = list.length
  ? list.map((a, i) => `<a class="g-card" href="#" data-open="${a.no}" style="--i:${i}"><figure><img src="${a.img}" alt=""></figure><span class="g-cat">${a.tags.join(" · ")}${a.ad ? `<span class="ad">광고</span>` : ""}</span><h3>${a.title}</h3><p>${a.sum}</p><span class="meta">${a.date} · ${a.min}분 읽기</span></a>`).join("")
  : `<p class="g-empty">이 주제의 글은 준비 중이에요.</p>`;
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("in")));
