# GitHub 온보딩 HTML 슬라이드

[발표 슬라이드 보기](https://amnotyoung.github.io/github-onboarding/)

`index.html`을 브라우저로 열면 22장의 발표자료를 볼 수 있습니다. `slides.css`, `slides.js`, `assets` 폴더는 HTML과 함께 보관합니다. 설치나 인터넷 연결 없이 실행할 수 있으며, 노트의 외부 출처 링크는 인터넷 연결이 필요합니다.

## 사용 방법

- 이전·다음: 화면 버튼, 좌우 방향키, PageUp·PageDown
- 첫 장·마지막 장: Home·End
- 발표자 노트: 화면 버튼 또는 N, 닫기: Esc
- 발표·세로 읽기 전환: 화면 버튼 또는 R
- 전체화면: 화면 버튼, 해제: Esc
- 인쇄: 화면 버튼 또는 브라우저 인쇄 메뉴
- 흑백: 흑백 버튼 선택 후 인쇄

좁은 화면이나 세로 화면은 읽기 모드로 시작합니다. 넓은 표는 표 영역을 가로로 스크롤해 확인할 수 있습니다. 모바일에서 인쇄하려면 브라우저 메뉴를 사용합니다. 인쇄 시 브라우저의 머리글·바닥글을 끄고, 색상 보존을 위해 배경 그래픽을 켭니다. 인쇄 페이지는 16:9 가로, 슬라이드당 한 페이지입니다.

## 구성

- `index.html`: 편집 가능한 슬라이드 본문과 발표자 노트
- `slides.css`: ANY 색상·서체·레이아웃 및 읽기·인쇄 스타일
- `slides.js`: 슬라이드 탐색과 발표 기능
- `github-onboarding.md`: 전체 설명과 정정표를 담은 원고
- `assets/brand/any-logo-mono-reference.jpg`: 원본 ANY 흑백 로고
- `assets/fonts/PretendardVariable.woff2`: 오프라인 서체
- `assets/fonts/OFL.txt`: Pretendard 배포 라이선스

## 디자인 출처

[ANY 디자인 명세](https://github.com/amnotyoung/any-branding/blob/f2356d13601f0e587b2236cd794cd818028f0958/design.md), 참조 커밋 `f2356d13601f0e587b2236cd794cd818028f0958`.

순백 배경, forest `#101D14`, lime `#A1B61C`, Pretendard, 1280×720 작업 좌표 적용. 표지 제목 64px, 일반 제목 44px, 기본 본문 28px. 원본 JPG의 로고 도형 폭을 기준으로 표지 로고 약 80px 적용. 원본 로고의 재도안·필터·색상 변경 없음.

[Pretendard](https://github.com/orioncactus/pretendard/tree/v1.3.9): v1.3.9, SIL Open Font License 1.1. 로고는 사용자가 지정한 저장소의 원본이며 폰트 라이선스 적용 대상이 아닙니다.

## 시각 자료와 데모

- 2장: 같은 FAQ 파일의 수정 전·후 비교
- 4·8·12장: 실제 GitHub 공개 화면의 고해상도 확대 캡처
- 9장: 작업 브랜치 분기·commit·merge 데모
- 10장: 저장·staging·commit 데모
- 11장: Push 한 번의 실행 전·후 비교, main 유지 확인
- 15장: Pull 한 번의 실행 전·후 로컬 main 비교
- 21장: 30초 MP4 협업 흐름 영상, 무음·한국어 설명 자막

데모의 ‘재생’, ‘다음 단계’, ‘처음’ 버튼으로 조작합니다. 슬라이드를 넘기면 영상과 데모 재생이 멈춥니다. 인쇄에서는 영상 포스터와 데모의 정지 화면을 표시합니다. 좁은 화면의 도식은 영역 안에서 가로 스크롤할 수 있습니다.

실제 화면은 GitHub 공개 저장소 [github/docs](https://github.com/github/docs)와 [PR #45779](https://github.com/github/docs/pull/45779), [변경 비교](https://github.com/github/docs/pull/45779/files)에서 2026-09-08에 캡처한 발췌입니다. 해당 PR은 교육용 FAQ 예시와 별개의 실제 사례입니다. 당시 화면을 그대로 사용하며 이름·상태·코드의 합성 변경은 없습니다.

`demo.js`의 조작형 도식과 `assets/demo/workflow-captioned.mp4`는 이 자료를 위해 제작한 교육용 시뮬레이션입니다. 실제 GitHub 조작을 녹화한 영상과 구분합니다. 각 점은 기록된 버전을 뜻하며 라임색 점은 FAQ 변경의 기록입니다. 상세 개념은 발표자 노트와 원고를 참고합니다.

추가 파일: `demo.css`, `demo.js`, `assets/screens/`, `assets/demo/`. 영상에는 한글 설명이 화면에 포함되어 있으며 별도 자막 파일 `workflow.ko.vtt`도 제공합니다.

Push·Pull 비교 화면은 별도 작업 단계를 나열하지 않고, 한 명령을 실행하기 전과 실행한 후의 상태를 표시합니다. ‘Push 실행 보기’·‘Pull 실행 보기’는 슬라이드 안의 시뮬레이션 버튼으로, 실제 저장소를 변경하지 않습니다.

21장 영상의 6개 단계에 한국어 설명 자막을 직접 포함했습니다. CC 설정이나 별도 자막 파일 로딩 없이 표시됩니다. `assets/demo/workflow-captioned.mp4`를 단독 재생해도 자막이 보이며, 편집용 `workflow.ko.vtt`도 동봉합니다.

## GitHub Pages 배포

`main` 브랜치의 저장소 루트에서 배포합니다. `.nojekyll`로 정적 HTML·CSS·JavaScript와 미디어 파일을 그대로 게시합니다. `main`에 변경을 push하면 GitHub Pages가 사이트를 갱신합니다.
