# 인수인계 (IPC Lab Research Area v3)

> 이 폴더(`research-area-v3/`)는 원래 `yunsu68/ipc-lab-research-area` 저장소의 `concept-v3/`를 옮긴 것입니다. 도구는 `tools/research-area/`에 있습니다. 아래 설명의 `concept-v3`는 이 폴더, `tools/`는 `tools/research-area/`로 읽어 주세요. 빌드 스크립트는 저장소 루트에서 `python -I tools/research-area/build-concept-v2.py . research-area-v3`처럼 실행합니다.

## 저장소 두 개

| 저장소 | 공개 | 역할 |
| --- | --- | --- |
| `yunsu68/ipc-lab-research-area` (이 저장소) | 비공개 | 원본 작업 저장소. 버전별 폴더, 렌더·빌드 도구 |
| `yunsu68/ipc-lab-research-area-preview` | 공개 | `concept-v3`만 올린 미리보기. GitHub Pages 주소 https://yunsu68.github.io/ipc-lab-research-area-preview/ 를 구글 사이트에 "삽입 → URL"로 넣어 사용 |

미리보기 저장소는 직접 고치지 않습니다. 이 저장소에서 고친 뒤 `python -I tools/sync-preview.py . <미리보기 저장소 경로>`로 복사하고 push합니다. 복사할 때 페이지 상단 바와 하단 연구실 이름은 빠집니다(구글 사이트에 이미 있음). `candidates/`(사진 후보 페이지)는 그대로 둡니다.

## 폴더

- `original/` 2026-09-21 첫 버전(비교 기준)
- `v1-requested/`, `proposals/A~D/`, `concept/`, `concept-v2/`(태그 `concept-v2-2026-11-01`로 고정): 이전 안
- **`concept-v3/` 현재 버전.** `index.html`과 `applications/*.html`은 빌드 결과이므로 직접 고치지 말고 아래 스크립트를 고칩니다.
- `research/` 대학 연구 페이지 조사 자료
- `tools/` 빌드·렌더·시트 도구

## 페이지 고치기

| 고칠 것 | 파일 |
| --- | --- |
| 메인 페이지 문구·구조 | `concept-v3/template.html` → `python -I tools/build-concept-v2.py . concept-v3` |
| 비전 도식, 4층 스택, 연구 카드 그림 연결 | `tools/build-concept-v2.py` |
| 응용 상세 페이지 문구·주제·그림 | `tools/build-apps.py` (APPS 목록) → `python -I tools/build-apps.py . concept-v3` |
| 공통 스타일 | `concept-v3/concept-v2.css`, `concept-v3/applications/applications.css` |
| 프로젝트 목록(빌드에 들어가는 예비본) | `concept-v3/assets/partners/projects.json` + `tools/projects_render.py` |

확인 폭: 1440 / 1024 / 768 / 390px. 가로 넘침과 깨진 이미지·링크가 없어야 합니다.

## 3D 그림 다시 만들기

- 필요한 것: Node.js, `tools/`에서 `npm i --no-save three@0.170.0 playwright-core`, 크롬 설치
- 연구 그림·스택·상세 페이지 그림: `tools/render-research.html` 장면 → `node tools/capture.mjs <출력폴더> circuit plate0 …` → `python -I tools/fit-renders.py <출력폴더> <맞춘폴더>` → 필요한 파일을 `concept-v3/assets/`로 복사
- 그림체: 네이비 기판, 검정 칩, 구리, 크림색 커패시터, 파란 강조색 하나. 여백과 비율은 기존 파일과 같게.

## 응용 분야 대표 이미지

ChatGPT 이미지 생성으로 만든 그림입니다(프롬프트: `tools/app-image-prompts.md`). 페이지 하단에 생성 이미지라고 표기되어 있습니다. 상세 상단용 1280px(`-photo.webp`)과 카드용 640px(`-card.webp`) 두 크기를 씁니다.

## 진행 중인 프로젝트 (구글 시트 연동)

- 시트: **"IPC Lab 뉴스 관리"** 의 `Projects` 탭(사용법은 `프로젝트 사용법` 탭). 뉴스(`뉴스관리` 탭)와 같은 시트입니다.
- 스크립트: Apps Script **"IPC Lab News"** 의 `Projects.gs`(원본: `tools/projects-sheet/Projects-for-news.gs`). `doGet`이 `?type=projects`일 때만 프로젝트 JSON을 내보내고, 그 외에는 기존 뉴스 화면 그대로입니다.
- 페이지 연결 주소: `concept-v3/assets/projects-config.js` (뉴스 웹 앱 주소 + `?type=projects`)
- 반영: 시트를 고치면 약 1분 뒤 반영(스크립트 캐시 60초). 불러오기에 실패하면 빌드에 들어 있는 예비본이 보입니다.
- 끝난 과제: `status`를 `completed`로 바꾸면 "Completed projects ▸" 접힘 목록으로 갑니다.
- 로고: `logo` 칸에 그림을 바로 넣거나(삽입 → 이미지 → 셀에 이미지 삽입), 사이트에 있는 파일 이름(`samsung.png` 등), 드라이브 `IPC_Homepage_Logos` 폴더의 파일 이름, https 주소 중 하나를 적습니다.
- 스크립트를 고친 뒤에는 **배포 → 배포 관리 → 연필(수정) → 버전 "새 버전" → 배포**. 그래야 주소가 바뀌지 않습니다.
- 예전 단독 시트 `IPC_Homepage_Projects`와 그 웹 앱은 더 이상 쓰지 않습니다(삭제 여부 확인 중).

## 윤수님이 정한 원칙

- 스타트업 홍보 페이지가 아닌 깔끔한 연구실 사이트. 홍보성·추상적 문구 금지, 실제 연구 내용 우선
- 장식과 애니메이션은 최소로, 글꼴·여백·이미지 비율 통일
- 반응형 1440 / 1024 / 768 / 390
- 없는 내용을 지어내지 않기. 확인 안 된 내용은 표시해 두고 확인받기
- 기업명·과제명은 공개 확인을 받은 것만(내일 검토에서 확인 예정)

변경 기록은 `CHANGELOG.md`에 있습니다.
