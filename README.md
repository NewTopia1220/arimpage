# ARIM 매거진 「일상의 발견」 (독립 페이지)

실행: `node server.js` → http://localhost:4173

- `public/data.js` — 카테고리(`CATEGORIES`)와 기사(`ARTICLES`, `BODY`). 기사·문구는 예시다.
  카테고리는 한 줄 더하면 첫 화면 회전목마 · 메뉴 · 카테고리 페이지에 같이 실린다.
- `public/index.html` · `style.css` · `app.js` — 첫 화면 회전목마(카테고리 표지가 둥글게 돈다)와 매거진 영역, 글 신청 폼
- `public/reader.js` — 기사 읽기. 댓글은 각 글 안에만 있다(지우는 버튼 없음)
- `public/admin.html` · `admin.js` — 관리 화면. 댓글 · 글 신청을 보고 지운다. 독자 화면 어디에도 링크하지 않는다
- `public/store.js` — 댓글 · 글 신청 저장이 지나가는 한 곳
- `public/img/credits.json` — 사진 출처와 라이선스

## 서버 연결 (아직 안 됨 — 껍데기 상태)

지금은 `store.js` 의 `API` 가 비어 있어서 댓글 · 신청이 **쓴 사람 브라우저에만** 저장된다.
서버가 준비되면 `API` 에 주소만 넣으면 된다. 서버는 아래 요청을 받으면 된다(`server.js` 가 같은 모양의 본보기다. 로컬에서는 `API = "api"`).

| 요청 | 보내는 것 | 받는 것 | 권한 |
|---|---|---|---|
| `GET /comments?article=01` | — | 그 글의 댓글 배열(최신순) `{id, article, name, text, at}` | 누구나 |
| `GET /comments` | — | 전체 댓글 배열 | 누구나(관리 화면이 씀) |
| `POST /comments` | `{article, name, text}` (이름 16자 · 내용 300자) | 만든 댓글 한 개 | 누구나 |
| `DELETE /comments/:id` | — | `{ok: true}` | 관리자 |
| `POST /applications` | `{shop, kind, name, contact, text}` | 만든 신청 한 개 | 누구나 |
| `GET /applications` | — | 신청 배열 | 관리자 |
| `DELETE /applications/:id` | — | `{ok: true}` | 관리자 |

- 관리자 요청에는 `Authorization: Bearer <비밀번호>` 가 붙는다(관리 화면이 물어서 붙인다).
- 실패하면 `{error: "사람이 읽을 문장"}` 과 4xx 를 돌려주면 화면에 그 문장이 보인다.
- 다른 주소에 서버를 두면 CORS 허용이 필요하다. 로그인 없이 받으므로 도배 막는 장치(횟수 제한)는 서버에서 건다.
