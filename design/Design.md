# Design.md

이 문서는 `design/tokens.yaml`의 사람이 읽는 설명입니다. 디자인 결정을 바꾸려면 여기 원칙을
참고해서 tokens.yaml을 수정하세요. AI 에이전트도 디자인 관련 요청을 받으면 이 파일을 먼저
읽습니다.

## 방향

Hydejack의 "인상적인 개인 사이트"라는 정신을 오마주하되, 정적 사이트 + 인쇄물(PDF/Word) 양쪽에서
동일한 디자인 언어가 유지되는 것을 최우선으로 합니다. 웹에서만 예쁘고 인쇄하면 무너지는 디자인은
피합니다.

## 색상

- `accent` 하나만 바꿔서 브랜드 아이덴티티를 표현하도록 설계. 나머지는 중립톤 유지.
- 인쇄본은 배경색을 쓰지 않는 것을 기본으로 함 (잉크 절약, 흑백 인쇄 대응). 필요하면
  `print.use_background: false`를 tokens에 추가해 오버라이드.

## 타이포그래피

- 본문/제목 폰트를 분리해 위계를 명확히 함 (Hydejack의 Roboto Slab + Noto Sans 조합 오마주).
- 한글 웹폰트는 Pretendard를 기본으로 하고, 인쇄본은 시스템 폰트 폴백을 반드시 테스트할 것
  (PDF는 웹폰트 로딩 타임아웃 문제가 있음 — `pdf-config.yml`의 `timeout.fonts` 참고).

## 레이아웃

- 이력서는 단일 컬럼, 최대 폭 720px 기준으로 설계 — A4 인쇄 시 좌우 여백이 자연스럽게 맞음.
- 포트폴리오/지식기반 탭은 사이드바 + 콘텐츠 2컬럼 구조 허용 (Hydejack 사이드바 오마주).

## 변경 시 체크리스트

1. `design/tokens.yaml` 수정
2. `npm run build:design` — CSS 변수 파일 + reference.docx 재생성
3. `npm run build` — 웹/PDF/DOCX 전체 재빌드
4. 웹, PDF, DOCX 세 출력물을 나란히 비교해서 확인
