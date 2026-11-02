# Live Publications

Public page: https://hoonjoon0501.github.io/IPC_Lab/publications/

Source: the `Publications` tab in the existing IPC Lab management spreadsheet. The page refreshes on load, every 30 seconds while visible, when returning to the tab, and when Refresh is clicked. No GitHub commit is required for content edits. Network failures show a refresh warning rather than claiming that old data is current.

The page requests `images=deferred`: this returns metadata and opaque image references without downloading cell-image bytes. Cards render first; an IntersectionObserver loads nearby images separately, with at most two requests at a time. Images retain their original resolution and proportions. Browser memory, browser Cache Storage, and the Apps Script cache reuse image responses for up to five minutes. Storage denial or eviction falls back to fetching the image. The manual **Refresh** button bypasses both image caches, including when an image is replaced in the same sheet cell. Normal refreshes only revalidate expired images. Images for rows that become drafts or whose identity changes cannot be requested from the server cache. Older clients without `images=deferred` retain the previous inline-image response.

## Apps Script

Add `Publications.gs` to the existing **IPC Lab News** project. Add this line at the beginning of the existing `doGet(e)` without replacing the news or projects branches:

```javascript
if (e && e.parameter && e.parameter.type === 'publications') return publicationsFeed_(e);
```

Keep the existing `cellImage_` helper for optional in-cell illustrations. The feed also supports HTTPS image URLs. It emits only rows whose status is exactly `공개`; internal notes are excluded. No publication illustrations have been seeded.

Update the existing main deployment through **Deploy > Manage deployments > Edit > New version**. Keep its existing URL. The page uses that URL with `?type=publications`.

## Editing

The public page includes journals and conference papers only. Patent rows are retained in the sheet as drafts and are excluded by the feed even if accidentally marked public. The sheet includes status, type, year, title, authors, venue, paper link, recognition badges, optional image, sort month, internal notes and source ID. Separate multiple badges with `|`. Journals and conferences have separate venue selectors. The year buttons are 2026–2022 and the grouped 2015–2021 archive. Column J stores the verified issue/event month as `YYYYMM` (for example, `202610`), sorted newest first within each year; use `0` for an unknown month so it appears last. After sorting each complete public category, the page assigns descending display numbers (J29…J1, C44…C1). Filters retain those numbers. Column L remains the original source ID for tracing CV records; it does not control the display number. New papers or corrected dates automatically update display numbering.

Illustrations retain their original proportions and full content, vertically centered beside the publication with no surrounding frame, background or padding; alt text uses the publication title. Full names in the Researchers page are bolded automatically. Verified abbreviations for Jaeil Baek, Chaeyoung Moon and Doyeon Eom are also recognized; other ambiguous initials are not automatically attributed to a lab member.

The initial records were transcribed from the supplied CV, updated March 2026: 29 journal papers, 40 conference papers and 11 registered/applied/in-preparation patent entries. Seminar talks and private contact information were not included. Patent statuses describe that CV snapshot, not a live legal-status lookup. Unknown links remain blank. The J24 award-year discrepancy in the CV is recorded in the internal sheet notes, and the badge omits the year.

## Checks

Run `node tests/publications.cjs` and `node tests/publication-images.cjs`. These check metadata without image downloads, draft exclusion, row identity checks, chunked server caching, browser cache reuse, expiry, forced refresh and storage/network failure recovery. For visual review, serve the repository with any static server and open `/publications/`; the production feed is used by default. Verify type/year/search filters, recognition badges, empty results, keyboard access and mobile layout. For future illustration tests, use a draft row first and publish only an approved image.
