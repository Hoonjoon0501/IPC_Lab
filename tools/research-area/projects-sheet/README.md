# Projects sheet (live "Current projects" lists)

The research-area page and the five application pages load their project lists from a Google
Sheet through an Apps Script web app. If the web app is not set up or cannot be reached, the
pages show the copy built from `concept-v3/assets/partners/projects.json`.

## Columns (sheet tab `Projects`)

| column | meaning |
| --- | --- |
| `status` | `ongoing` or `completed` (completed rows go under the "Completed projects ▸" toggle) |
| `app` | `ai`, `ev`, `humanoids`, `rf`, `wpt`, or empty (shown only on the main page) |
| `area` | label shown on the main page when `app` is empty (e.g. Digital Twin, Aerospace) |
| `title` | project title (English) |
| `partner` | sponsor / partner as written on the page |
| `partner_short` | short name, shown when there is no logo |
| `logo` | a file name already on the site (`assets/partners/`, e.g. `samsung.png`) or a full image URL starting with `https://`. Logos are not stored in the sheet. |
| `start`, `end` | `yyyy.MM` (e.g. `2025.10`). Format these two columns as plain text (Format → Number → Plain text) so 2025.10 is not turned into 2025.1; the script also repairs that case. `end` empty = ongoing ("Since …") |
| `order` | sort order (smaller first) |
| `visible` | `N` hides a row without deleting it |
| `note` | free text, not shown |

## Setup

1. Google Sheets → new sheet → File → Import → upload `projects-template.csv` → "Replace current sheet". Rename the tab to `Projects`.
2. Extensions → Apps Script → replace the code with `Code.gs` → Save.
3. Deploy → New deployment → type **Web app** → Execute as **Me**, Who has access **Anyone** → Deploy → copy the URL ending in `/exec`.
4. Put that URL in `concept-v3/assets/projects-config.js`. (Current setup: the feed is served by the IPC Lab News web app — `<news URL>?type=projects`, code in `Projects-for-news.gs`, data in the news spreadsheet tab `Projects`.) (`window.IPC_PROJECTS_URL = '…/exec';`), rebuild and sync the preview.

Edits in the sheet appear on the pages within about a minute (Apps Script cache, `CACHE_SECONDS`).
After changing `Code.gs`, use Deploy → Manage deployments → edit → **New version** so the same URL keeps working.
