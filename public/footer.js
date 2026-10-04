/* 하단 — 메인과 카테고리 페이지가 같이 쓴다. 화면에 들어오면 큰 글자가 한 자씩 닦이듯 나타난다 */
(() => {
  const el = document.getElementById("foot");
  const word = "discoveries";
  el.innerHTML = `
    <div class="f2-top">
      <nav class="f2-links">${CATS.map((c) => `<a href="category.html?c=${encodeURIComponent(c)}">${c}</a>`).join("")}</nav>
      <nav class="f2-links"><a href="index.html#about">매거진 소개</a><a href="index.html#apply">글 신청하기</a></nav>
      <div class="f2-cta"><p>가보고, 써보고, 해보며 발견한 일상의 쓸모.<br>광고주 콘텐츠와 취재 문의도 받아요.</p><a class="f2-btn" href="index.html#apply">글 신청하기 <span>→</span></a></div>
    </div>
    <div class="f2-word" aria-label="Daily Discoveries"><small>daily</small><b>${[...word].map((ch, i) => `<i style="--i:${i}">${ch}</i>`).join("")}</b></div>
    <div class="f2-end"><span><a href="#">이용약관</a><a href="#">개인정보처리방침</a></span><span>MARKETING MAGAZINE</span><span>© 일상의 발견 2026 · 기사와 사진은 예시예요</span></div>`;
  const w = el.querySelector(".f2-word");
  // 들어올 때마다 다시 나타나고, 화면 밖으로 나가면 접힌다(올렸다 내렸다 하면 계속 반복)
  new IntersectionObserver((es) => es.forEach((e) => w.classList.toggle("in", e.isIntersecting)), { threshold: 0.3 }).observe(w);
})();
