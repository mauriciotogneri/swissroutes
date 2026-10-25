# Elevation profile for routes and uploaded GPX tracks

**Goal**: Show an elevation chart in the details panel for every SchweizMobil route and every uploaded GPX track that has heights. Hovering the chart marks the spot on the map. Route GPX downloads gain `<ele>` on every point. The heights come from data SchweizMobil already sends: the downloader throws them away today.

## What the user sees

1. **Selecting a route** (map line, number plate, shared link, Favorites → Hikes). The panel stays the same down to the stats (Distance, Ascent, Descent, Hiking time, Asphalt), which keep their current values, and the Difficulty / Fitness / Other direction list under them. Below that list, and above the abstract, is a new **Elevation** block:
   - A header row: "Elevation" on the left (same look as the stat labels) and the height range on the right, e.g. `1,543–2,030 m`.
   - A chart the full text width of the panel: a filled area in the route colour, outlined in the same colour.
   - Two dashed rule lines labelled with rounded heights (`1,500 m` at the bottom, `2,100 m` at the top). The labels sit at the left inside the chart, the top one just under the top line and the bottom one just above the bottom line, so neither is cut off at the edge.
   - `0` under the left end and the line length under the right end (`9.2 km`).
2. **Hovering the chart**. A thin vertical cursor and a dot follow the pointer along the curve. The header changes to `4.3 km · 1,872 m`. A dot in the route colour with a white ring (styled like the uploaded track's start/end dots) appears on the map at that point and follows the pointer. Leaving the chart puts the range text back and removes the map dot. The map never pans.
3. **Touch** (the site only runs at 1024 px and wider, so touch laptops and tablets). Pressing the chart shows the dot at that spot right away, without moving. Dragging sideways then scrubs the chart. Dragging up or down still scrolls the panel. Lifting the finger removes the dot.
4. **Routes with several lines**. There is one chart for the main line, from start to end across all stages. The extra short lines are variants or other-direction pieces (see Data). They stay on the map and in the GPX file but are not in the chart.
5. **Gondola, train or boat sections** show as a straight, often steep, segment. The chart is measured along the line, so its length can be longer than the Distance stat (Vorab Trail: 27.2 km against 21 km).
6. **Uploaded GPX**. The same block appears below the track's stats when the file has at least 2 `<ele>` values. Segments are joined in file order, and the gaps between them are not counted, so the chart's length equals the track's Distance stat. Points without `<ele>` are skipped and the line joins the neighbouring points that have one. With no heights there is no block, just as Ascent and Descent are missing today.
7. **Download GPX** writes `<ele>` (whole metres) inside every `<trkpt>`.
8. **No block, nothing else changes**, when the route file has no heights. That covers data not yet refreshed and a route logged as `MISSING HEIGHTS`.
9. **Flat routes** get a height scale of at least 100 m, so a lakeside route draws as a flat line instead of magnified noise.
10. **The map dot goes away** on close, Escape, selecting something else, or removing the upload.

## Data

### Today (measured with read-only node over `public/data`)

- **Size**: 786 route files: hiking 351, cycling 128, mountain biking 307. Together 158.5 MB of the 172 MB `public/data`.
- **Points**: 3,553,207 points on 37,913 km of line, about 8–15 m apart (hiking about 8–9 m, cycling about 15 m). 278,833 points repeat the point before them.
- **Format**: `geometry.coordinates` is a MultiLineString of `[lat, lng]` with full float precision. That is about 38 bytes per point, 135.5 MB in total.
- **Biggest file**: `hiking/national/6.json`, 4.16 MB, 105,999 points.
- **Line 0** has 434 to 105,999 points, median 2,214.
- **Multi-line routes**: 82 files have more than one line, up to 15. They are **not stages in order**:
  - Line 0 is always the longest line (786 of 786) and is the whole route. Its length divided by `properties.length` is 1.003 at the median (from 0.958 to 1.163 between the 1st and 99th percentile).
  - The other lines are short pieces whose ends lie on line 0, at 0 m from one of its points. Examples: Rhone Route (`cycling/national/1`) has line 0 of 350.9 km plus 14 pieces of 0.1–2.4 km. ViaJacobi (`hiking/national/4`) has branches of 25–124 km.
  - Their order in the file is meaningless: consecutive lines are up to 207 km apart.
  - What they are is an inference: return-direction pieces or variants.
- **Line 0 runs from start to end**: 71 of the 77 multi-stage hiking routes start at the federal stage 1, none start at the last stage, and the other 6 are loops.
- **Jumps**: 158 routes have gaps over 200 m between consecutive points in line 0. These are transport sections, for example `mountainbiking/local/247` (gondola, 0.6–1 km jumps in the first 5 km) and `hiking/national/2` (6.9 km at km 92). They are why 21 routes are more than 8% longer than `properties.length`.
- **`properties.height_difference` / `height_difference_back`** are SchweizMobil's official totals, rounded. `route-checker.log` reports 0 differences from the federal files.
- **`heightprofile_file`** is `null` on all 786 routes.

### Height source: SchweizMobil's own response (chosen)

| Source | Evidence | Verdict |
| :-- | :-- | :-- |
| **SchweizMobil `featuresmultilayers`** | One sample call each for `WanderlandRoutenLokal=109`, `VelolandRoutenNational=1` (15 lines, 23,057 points) and `MtblandRoutenLokal=114` (4,111 points). Every coordinate has 3 values, e.g. `[582054.966523,133607.972646,1544.5]`, with no missing or non-positive heights. `helpers.js:79-81` keeps only `parseInt(point[0])` and `parseInt(point[1])`: the saved first point of 109 is exactly `getPoint(582054,133607)`. | **Chosen.** No extra requests, same response, same points as the saved line. |
| Federal Roads Office GeoPackages (`logs/*_2056.gpkg`, read with `node:sqlite`) | `gpkg_geometry_columns` says `z: 1` and the blobs are WKB 1005 (MultiLineString Z), LV95, with decimetre heights. Over all 4,412,100 points none is NaN or ≤ 0, and the range is 193.5–3,145.6 m. LV95 minus 2,000,000 / 1,000,000 equals SchweizMobil's LV03 points exactly: route 109 matches 1,436 of 1,436 points at 0.00 m with identical heights. Keyed through `getPoint(parseInt(...))`, 100.00% of saved points find a federal height; 26 routes miss a few points (worst 99.9%). | Same dataset. Kept as a **cross-check** in Verification, not saved. AGENTS.md says nothing from it is saved, and it needs a 330 MB download. |
| swisstopo `api3.geo.admin.ch/rest/services/profile.json` (docs.geo.admin.ch, "Get Elevation Profile") | GET or POST. `geom` is a GeoJSON LineString of "generally 5'000 coordinates" at most. `sr` must be 2056 or 21781, not WGS84. `nb_points` defaults to 200 (the line is resampled) and `distinct_points` keeps your own points. Returns `alts` (COMB, DTM2, DTM25) and `dist`. Fair use: a search result quoting swisstopo's API FAQ gave 20 requests a minute; geo.admin.ch says limits doubled from 1 Jan 2025, with no exact figure (**not verified**). Bulk use by bots is discouraged. | Rejected. At least 711 requests for 3.55M points, more because long lines need splitting. At about 20 a minute that is 35+ minutes on top of the route download, under a fair-use cap, for heights that differ from SchweizMobil's own. |
| SchweizMobil profile endpoint | None documented. `heightprofile_file` is always null. | Not needed: the route response already carries the heights. |
| Google Elevation service at runtime | Elevation SKU "Pro", billed per request, 512 locations per request (Google usage-and-billing page). | Rejected. It breaks the no-runtime-calls rule and costs money. Not even a fallback, since every route already has heights. |

### Changes to scripts and data

- **`bin/helpers.js` `downloadFile` route branch**: keeps the height as a third value, `[lat, lng, height]`, in whole metres. Points of place layers (`isPoint`) are unchanged. `route-downloader.js`, `ids-generator.js`, `cleanup.js` and `route-checker.js` need no change. `osm-downloader.js` reads only place files.
- **Requests**: the same 3,300 SchweizMobil requests and the same 30–40 minutes. Rerunnable as today.
- **Size**: measured in memory with the federal heights, which are identical to SchweizMobil's. Firebase compressing responses is an **assumption**.

  | | Raw | Gzip |
  | :-- | --: | --: |
  | Route files today | 158.5 MB | 52.9 MB |
  | With whole metres (chosen) | 174.6 MB (+10.1%) | 57.2 MB (+8.2%) |
  | With decimetres | 181.0 MB (+14.2%) | 60.7 MB (+14.8%) |

  - `public/data` grows from 172 MB to about 188 MB.
  - The biggest file goes from 4.16 to 4.69 MB raw and from 1.53 to 1.69 MB gzipped.
  - Turning on a route layer downloads about 8% more.
- **Failure handling**: a missing height does not fail the request. The route is saved with heights only on the points that have one, and the script logs one grep-able line, `MISSING HEIGHTS: <url> (<n> points)`. The id list is written as today.

## Decisions

| # | Choice | Options | Pick |
| :-- | :-- | :-- | :-- |
| 1 | Where heights live | **(a) Third value per coordinate.** Index matches the map path, follows the GeoJSON altitude slot, no reader breaks: `buildRoute` reads `[0]` and `[1]` at `script.js:861`. (b) A separate `geometry.heights` array: same size, and the two arrays must be kept in step. (c) Separate `<id>.profile.json` files fetched on selection: layer loads stay the same size, but `cleanup.js:35` would delete them (they are not `<id>.json`), `route-checker.js:103-106` would read them as routes, and it adds one fetch per selection. | (a) recommended |
| 2 | Precision | **(a) Whole metres:** +4.3 MB gzipped. (b) Decimetres as sent: +7.8 MB gzipped, no visible gain. | (a) recommended |
| 3 | How existing files get heights | **(a) Rerun `route-downloader.js` through the update-data skill:** one code path, fresh data, no new script. (b) A one-off backfill from the GeoPackages in `logs/`: fast and offline, but a second code path for data AGENTS.md says is never saved, 26 routes end up partial, and the script is thrown away afterwards. | (a) recommended |
| 4 | Which lines the route chart covers | **(a) Line 0 only:** the whole route in order (evidence above). (b) All lines joined: adds unrelated pieces at the end. (c) One chart per line: 15 charts for the Rhone Route. | (a) recommended |
| 5 | Horizontal scale | **(a) Distance measured along the line:** the hover point and the map dot always agree. Off by more than 8% on 21 routes with transport sections. (b) Stretched to `properties.length`: the end label matches the stat, but km readings are wrong at those routes. | (a) recommended |
| 6 | Drawing | **(a) Inline SVG built as a string**, like the rest of the panel. Styled with the CSS variables, sharp, about 120 lines, no library. The page loads no chart library today, only `supercluster@8.0.1` from unpkg. (b) Canvas: needs high-DPI handling, can't use the CSS variables. (c) A library, e.g. Chart.js 4 from jsdelivr pinned: an extra script for one chart, styled away from the panel. | (a) recommended |
| 7 | Downloader when a height is missing | **(a) Log `MISSING HEIGHTS` and save:** the route still shows on the map and the chart just drops out. (b) Throw and stop: one bad route would block a 40-minute refresh. | (a) recommended |

## Implementation steps

### `bin/helpers.js` (single quotes, no semicolons)

1. **`downloadFile`, route branch (`helpers.js:73-88`)**. Add `let missingHeights = 0` before the stage loop. Then change the inner loop like this:

   ```js
   const point = stage[j]
   const y = parseInt(point[0])
   const x = parseInt(point[1])
   const height = parseFloat(point[2])
   const newPoint = getPoint(y, x)

   // SchweizMobil sends the height in meters as a third value. Whole meters are enough for the elevation chart
   if (Number.isFinite(height)) {
     newPoint.push(Math.round(height))
   } else {
     missingHeights++
   }
   ```

   After the stage loop (before `element.geometry.coordinates = newCoordinates`, `:90`), add `if (missingHeights > 0) console.log(`MISSING HEIGHTS: ${url} (${missingHeights} points)`)`. This uses the same style as `MORE THAN ONE FEATURE` at `:58`.

### `public/script.js` (double quotes, semicolons, HTML as template strings)

2. **Constants**, after `ELEVATION_NOISE` (`:64-65`):

   ```js
   // The elevation chart is drawn one column per pixel of the panel's text width (384 − 1 border − 2 × 22)
   const PROFILE = { width: 339, height: 128, top: 8, bottom: 110 };
   ```

3. **State**, after `let uploaded` (`:341`): `let profileMarker = undefined;`
4. **`pathLength` (`:2324-2344`)**. Move the haversine into `kilometersBetween(a, b)` and have `pathLength` add those up. `buildProfile` reuses it.
5. **New section `// Elevation profile`**, inserted after the `// Photo spots` section and before `// Controls` (`:2043`):
   - **`routeProfile(item)`** returns `buildProfile([item.paths[0]], [item.json.geometry.coordinates[0].map((coordinate) => coordinate[2])])`. Only line 0 (Decision 4).
   - **`buildProfile(paths, elevations)`** takes arrays of `{lat,lng}` paths and matching height arrays, the shape `parseGpx` already returns at `:2235-2239`.
     - Walk every point, adding up distance with `kilometersBetween` inside each path only, so gaps between segments are not counted. Keep `{ distance, height, position }` for points where `Number.isFinite(height)`.
     - Return `undefined` when fewer than 2 points have a height or the length is 0.
     - Downsample: `column = Math.min(PROFILE.width - 1, Math.floor((distance / length) * PROFILE.width))`. Keep the lowest and highest point of each column, in distance order. That is at most 678 points and keeps both peaks and valleys.
     - Compute `min` and `max` over all points. Set `low = Math.floor(min / 100) * 100` and `high = Math.ceil(max / 100) * 100`; if they are equal, add 100 to `high`.
     - Return `{ length, min, max, low, high, points }`. Only the reduced points are kept, so caching it on the item is cheap.
   - **`profileY(profile, height)`** maps a height to the plot area between `PROFILE.top` and `PROFILE.bottom`.
   - **`profileSection(item)`** returns `""` when there is no `item.profile`. Otherwise it returns `<div class="profile" style="--color:${item.color}">` containing:
     - A `.profile-head`: `<span>Elevation</span>` and `<span class="profile-readout" id="profileReadout" data-default="1,543–2,030 m">` (built with `toLocaleString()`).
     - `<svg class="profile-chart" viewBox="0 0 339 128" role="img" aria-label="Elevation profile, 1,543 to 2,030 m over 9.2 km">`, holding:
       - two `.profile-grid` lines at `top` and `bottom`;
       - a `.profile-area` path (the line closed down to `bottom`) and a `.profile-line` path;
       - `.profile-label` texts, all inside the viewBox so none is cut off. The rounded `high` height (`2,100 m`) sits at x = 0 just under the top rule, and the rounded `low` height (`1,500 m`) at x = 0 just above the bottom rule; the halo keeps both readable where the curve passes under them. `0` (at x = 0) and the length (at x = `width`, `text-anchor="end"`) sit in the strip below `bottom`. The length has 1 decimal, `toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })` as in `uploadDetails` `:2384-2387`;
       - a hidden `#profileCursor` line and a hidden `#profileDot` circle.
     - Ids follow the gallery pattern (`galleryImage`, `galleryIndex`).
   - **`showProfilePoint(chart, event)`**:
     - Take `fraction` from `event.clientX` and `chart.getBoundingClientRect()`, clamped to 0–1. Find the reduced point nearest to `fraction * profile.length` with a simple loop.
     - Move the cursor and dot in viewBox units and set the readout to `${km} km · ${height} m`.
     - Create `profileMarker` on first use: `new google.maps.marker.AdvancedMarkerElement({ content, zIndex: 200000 })` with a `div.profile-marker` as content. The z-index keeps it above the selected pin (2000, `:1221`), the bubbles (1000 plus their count, `:1028`) and the photo pins (`PHOTO_ZINDEX`, 100000–100001, `:333-334`). Then set `content.style --color` to `selected.color`, `position` to the point, and `map` to `map`.
   - **`hideProfilePoint()`** sets `profileMarker.map = null` if it exists. If `#profileCursor` exists, it hides the cursor and dot and resets the readout from `dataset.default`.
6. **`routeDetails`, after the facts `dl` (`:1489-1491`) and before the abstract (`:1493`)**: `item.profile ??= routeProfile(item);` then `content += profileSection(item);`. It is computed when the route is selected, never in `buildRoute`, which runs for thousands of routes.
7. **`buildUpload` item (`:2245-2258`)**: add `profile: buildProfile(parsed.paths, parsed.elevations),` after `descent`.
8. **`uploadDetails` (`:2396`)**: `return content + `<dl class="stats">${stats}</dl>` + profileSection(item);`
9. **`selectItem`**: call `hideProfilePoint()` next to `hidePhotoSpots(selected)` (`:1315`), which runs before `details.innerHTML = ...` (`:1327`). **`closeDetails`**: call it next to `hidePhotoSpots(selected)`, right after the `if (!selected)` guard (`:1346-1350`). This also covers Escape (`:2121-2126`) and `removeUpload` (`:2316-2318`).
10. **`bindControls`**, next to the other `#details` listeners (`:2083-2119`):
    - `pointerdown` and `pointermove` share one handler, with `const chart = event.target.closest(".profile-chart")`: if there is a chart call `showProfilePoint(chart, event)`, otherwise `hideProfilePoint()`. `pointerdown` is what shows the dot on a touch press that doesn't move.
    - `pointerup` with `event.pointerType === "touch"` calls `hideProfilePoint`, so lifting the finger always removes the dot.
    - `pointerleave` and `pointercancel` call `hideProfilePoint`. `pointerleave` doesn't bubble, so on `#details` it fires only when the pointer leaves the whole panel; moving off the chart inside the panel is caught by the `pointermove` branch.
    - `scroll`, caught on `#details` in the capture phase (it doesn't bubble), calls `hideProfilePoint`. A wheel scroll moves the chart away from a mouse that stays still without any `pointermove`, which otherwise left the cursor, readout and map dot showing over the text.
    - These are delegated because the panel's HTML is rebuilt on every selection.
11. **`gpxData` (`:2484-2495`)**: `const ele = Number.isFinite(point[2]) ? `<ele>${point[2]}</ele>` : "";` then write `<trkpt lat='${lat}' lon='${lon}'>${ele}</trkpt>`. `<ele>` is the only child, so the GPX 1.1 child order holds.

### `public/style.css`

12. **After `.facts dd` (`:640-643`)**, so the rules follow the panel order (stats, facts, elevation):
    - `.profile { margin: 0 0 18px; }`
    - `.profile-head`: flex, space-between, `font-size: 12px`, `color: var(--ink-soft)`, like `.stats dt` at `:605-608`.
    - `.profile-readout`: `color: var(--ink)`, `font-weight: 560`, `font-variant-numeric: tabular-nums`.
    - `.profile-chart`: `display: block`, `width: 100%`, `height: auto`, `margin-top: 6px`, `touch-action: pan-y`.
    - `.profile-grid`: `stroke: var(--rule)`, `stroke-dasharray: 3 3`.
    - `.profile-area`: `fill: var(--color)`, `fill-opacity: 0.14`.
    - `.profile-line`: `fill: none`, `stroke: var(--color)`, `stroke-width: 1.5`, `stroke-linejoin: round`.
    - `.profile-label`: `font-size: 11px`, `fill: var(--ink-soft)`, tabular-nums, with a halo of `paint-order: stroke; stroke: var(--paper); stroke-width: 6px; stroke-linejoin: round`. A 3 or 4 px halo left the curve showing between the digits of `1,500 m` on route 109, which starts near its lowest point.
    - `.profile-cursor`: `stroke: var(--ink-soft)`.
    - `.profile-dot`: `fill: var(--color)`, `stroke: var(--paper)`, `stroke-width: 2`.
13. **After `.track-end-end` (`:872-874`)**: `.profile-marker` copies `.track-end` (`:858-866`, a 16px circle with a 3px white border, the same shadow and `translateY(50%)`) with `background: var(--color)` and `pointer-events: none`.

### `public/index.html`

No change: no library, no new icon.

### `AGENTS.md`

14. **`:9`** (SchweizMobil row): add "with the height of every route point".
15. **`:44`**: "Route coordinates are stored as `[lat, lng, height]`, with the height in whole metres from SchweizMobil's own response. Place coordinates are `[lat, lng]`."
16. **`:50`** (`route-downloader.js` row): it keeps SchweizMobil's height of each point and logs `MISSING HEIGHTS: <url>` for a route whose points lack one. Such a route is still saved.
17. **"When a download fails" (`:84-89`)**: add a bullet: "A route without heights is not a failure: it is saved and logged as `MISSING HEIGHTS`, and the site shows it without an elevation chart."

### `.claude/skills/update-data/SKILL.md`

18. **Step 1 grep (`:92`)**: add `|MISSING HEIGHTS` to the pattern.
19. **Step 1 "When it didn't" (`:97-102`)**: add a bullet. One or a few `MISSING HEIGHTS` lines: report them, then continue. On every route: SchweizMobil changed its response format; the script needs updating; don't commit.
20. **Step 7 checks (`:354-361`)**: add "Click a route: the Elevation chart appears below the stats, and hovering it moves a dot along the route on the map. Download its GPX: the points have `<ele>`."
21. **Step 7 summary note (`:435`)**: the first update after this change rewrites all 786 route files (heights added), and route data grows by about 16 MB.

### Order of work

1. `helpers.js`.
2. The front end, which works with old files (no chart).
3. You run `/update-data` (it is user-invoked only; step 1 alone takes 30–40 minutes), at least step 1 and the step 4 checks.
4. Verify. Commit the code with the refreshed data and deploy only after you say so.

## Interactions with the other planned features

- **Route facts** has landed: the stats include Hiking time, and the facts list (Difficulty, Fitness, Other direction) follows them (`:1445-1491`). Panel order: title, start/end/via subtitle, actions, stats, facts list, then the Elevation block (step 6), then the abstract and description. The route-facts filters (`activityRow`, `readFilters`, `matchesFilter`) don't touch this feature. Ascent stays the official `height_difference` for both the stat and the filters.
- **Photo spots** has landed: `selectItem` and `closeDetails` already clear the photo pins with `hidePhotoSpots`, and the profile dot is cleared right next to that call (step 9). The profile dot (z-index 200000) sits above the photo pins (`PHOTO_ZINDEX`, 100000–100001). Photo spots read `photo_gallery_coords` as saved and don't touch `helpers.downloadFile`, so the route download for this feature is the only one needed.
- **View in the address (`PLAN-3-url-state.md`)**: the profile never moves the map and isn't stored in the address. A selected item restored from the address goes through `selectItem`, so its chart appears on its own.
- **Saved list (`PLAN-2-saved-list.md`)**: selecting a saved route goes through `selectItem`, so the chart appears. Its Save action edits the same `actions([...])` call (`:1436-1443`), a separate line. No other overlap.

## Edge cases and risks

- **SchweizMobil stops sending heights**: `MISSING HEIGHTS` on every route, charts disappear quietly, the GPX has no `<ele>`. Mitigated by the step 1 grep.
- **`map.schweizmobil.ch` now 301-redirects to `schweizmobil.ch`** (seen 2026-10-25). Node's `fetch` follows redirects, so nothing breaks today; it is worth knowing if downloads fail later.
- **Branches** (ViaJacobi's 25–124 km lines) are not in the chart (Decision 4).
- **Transport sections** draw as straight segments, and the chart length differs from Distance on about 21 routes (Decision 5).
- **Uploads**: a GPS spike stretches the height scale (no smoothing; `ELEVATION_NOISE` applies only to ascent). Re-uploading a downloaded route GPX that has variant segments adds them after the main line.
- **The map dot can be off-screen** when the route is bigger than the view; the map doesn't pan (left out on purpose).
- **Panel width**: a visible scrollbar makes the panel narrower, and the SVG scales down evenly through its viewBox.
- **Speed**: `buildProfile` is one pass over up to 105,999 points. Measured 22–43 ms on `hiking/national/6` (5 runs, synthetic heights), once per route on its first selection.
- **Size**: +8% to every route layer download (Decision 1).

## Verification

**Read-only node checks** (run after the route download):

1. Every point of every route file has a third value that is a whole number from 150 to 3,200. Expect 100%, or only the routes named in `MISSING HEIGHTS` lines.
2. Cross-check against `logs/*_2056.gpkg`, opened read-only with `node:sqlite` and parsed as WKB 1005. Key the federal points by `getPoint(parseInt(x - 2e6), parseInt(y - 1e6))`. Expect at least 99.9% of points matched and `|saved − Math.round(federal)| = 0` on every matched point.
3. Route data totals about 174.6 MB, and `du -sh public/data` shows about 188M.
4. `height_difference` and `height_difference_back` are unchanged against the baseline commit, apart from real SchweizMobil updates.

**At http://localhost:5000** (`./scripts/serve.sh`):

5. **Hiking local 109, Tour de la Palette**: range `1,543–2,030 m`, labels `1,500 m` / `2,100 m`, end `9.2 km`. Hovering moves a red dot around the loop on the map; leaving removes it.
6. **Cycling national 1, Rhone Route**: one chart of 350.9 km, starting at about 1,436 m, highest 2,429 m, labels `300 m` / `2,500 m`. The 14 short extra lines are still drawn on the map.
7. **Mountain biking local 247, Vorab Trail**: a steep straight gondola climb at the start, and the chart ends at 27.2 km while Distance says 21 km.
8. **Hiking national 2, Trans Swiss Trail**: a 6.9 km straight segment around km 92.
9. **Download GPX of 109**: every `<trkpt>` has `<ele>`. Upload that file: the same chart in the upload colour, and the Distance stat equals the chart's end label. Upload a GPX without `<ele>`: no block and no console error.
10. **The map dot goes away** on Escape, the close button, selecting another route, and Remove on an uploaded track.
11. **Touch**: Chrome DevTools device mode with touch, width ≥ 1024. A press without moving shows the dot, a sideways drag scrubs, a vertical drag scrolls the panel, and lifting the finger removes the dot.
12. **Old data**: before the route download, routes show no chart and no errors. The console has no errors throughout.

## Out of scope

- Stage boundaries or names on the chart (the federal `Etappe` table has them, but nothing from that source is saved).
- Hovering the map line to move the chart cursor; keyboard scrubbing.
- Recomputing ascent or descent from the heights; filters on elevation.
- Smoothing GPS noise in uploaded tracks.
- Charts for branch or variant lines.
- Panning to keep the dot in view; an analytics event for chart use.
- Rounding lat/lng to fewer decimals to make up the size: today each point takes about 38 bytes, so that would save more than the heights add. It is a separate change.

Sources consulted: [Get Elevation Profile (docs.geo.admin.ch)](https://docs.geo.admin.ch/access-data/get-elevation-profile.html), [geo.admin.ch fair-use change](https://geo.admin.ch/en/change-limits-fair-use), [Google Elevation usage and billing](https://developers.google.com/maps/documentation/elevation/usage-and-billing), plus 4 single sample calls to `map.schweizmobil.ch/api/4/query/featuresmultilayers` (one of them for route number 103, which turned out not to exist).
