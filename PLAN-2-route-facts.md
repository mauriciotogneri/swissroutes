# Route facts: difficulty, fitness, hiking time, start and end, photo credits

**Goal**: Show the route facts SchweizMobil already gives us in the route details: start, end and via, difficulty, fitness, hiking time, and a credit on each photo. Add Difficulty and Fitness filters under the existing Length and Ascent filters. This needs no data, `bin/` or `ids.js` changes.

## What the user sees

**Layer panel**
1. When at least one level of an activity is on, its filter block shows (unchanged rule, `toggleLayer` at `public/script.js:620`). Under Length and Ascent it now has:
   - Hiking: `Difficulty [Easy] [Medium] [ ]` and `Fitness [Easy] [Medium] [Difficult]`
   - Mountain biking: `Difficulty [Easy] [Medium] [Difficult]` and `Fitness [Easy] [Medium] [Difficult]`
   - Cycling: `Fitness` only. Cycling routes have no difficulty in the data, so there is no Difficulty row.
2. The chips look like the level chips, only smaller. Each chip sits in a 3-column grid, so the hiking Difficulty row lines up with the Fitness row below it.
3. With no chip pressed, the row doesn't filter. Pressing chips keeps routes that match any pressed chip. Pressing every chip in a row is the same as pressing none. Rows combine with each other and with Length and Ascent: a route must pass all of them.
4. The map redraws 250 ms after the last click, like today. Several quick clicks give one redraw. The row count shows "N of M" over the loaded files (for example, all hiking levels on with Difficulty Easy pressed shows **142 of 351**). When nothing is filtered out it shows the plain total.
5. Favorites "Hikes" ignore every filter, as today. A selected route stays on the map even when filtered out, as today.
6. Turning all levels of an activity off hides its block. The pressed chips stay pressed and apply again when a level is turned back on, the same as typed lengths today. Pressed filter chips never count toward the "Routes" section badge.

**Route details** (in order)
1. Kind line, then the title (unchanged).
2. **New subtitle** in soft ink under the title:
   - "Genève to La Plaine"
   - for loops: "Loop from Chancy"
   - with `via`: "Sauverny to Versoix via La Bâtie, Moulin-de-Richelien, Les Gravines"
3. Actions (unchanged).
4. Stats: Distance, Ascent, Descent, then **Hiking time** "5 h 25 min" on the 262 local hikes that have it. Bike routes keep Asphalt in that slot. Hiking never has Asphalt, so no route gets more than 4 tiles.
5. **New facts list**: two columns, soft labels on the left, values on the right:
   - `Difficulty`: "Easy · hiking trail" or "Medium · mountain hiking trail" (hiking); "Easy", "Medium" or "Difficult" (mountain biking); no row for cycling.
   - `Fitness`: Easy, Medium or Difficult (every route).
   - `Other direction`: "2 h 30 min", only when the time back differs (128 hikes).
6. Abstract and description (unchanged).

**Photo credit**: a small dark label at the bottom right of the photo, styled like the "3 / 18" counter at the bottom left, for example "© Vreni Braun; FotoPatin SchweizMobil". It changes with the previous and next arrows. It is hidden on photos with no credit. Long credits end in "…" and the full text shows on hover. Sightseeing places get credits too, because they share the gallery code and the credit fields (229 of 2,284 photos). Accommodation photos have no credit data, so they show none.

**Empty and edge states**
- National and regional hikes, and 12 local hikes, have no time: there is no Hiking time tile.
- A route missing `start` or `end` gets no subtitle (none today).
- A grade value not listed in the code gets no Difficulty or Fitness row, and is hidden while any chip in that row is pressed.
- 76 routes have no credit on any photo: the label never appears.
- Uploaded GPX details are unchanged.

## Data

Read-only checks over all 786 route files. Layer counts: hiking 7/70/274, cycling 9/54/65, mountain biking 3/18/286 (national/regional/local). The ids files and the data files match.

| Field | Hiking (351) | Cycling (128) | Mountain biking (307) |
|---|---|---|---|
| `category_grade` | easy 142, medium 209, never difficult | null on all | easy 81, medium 151, difficult 75 |
| `category_grade_text` | "hiking trail" 143, "mountain hiking trail" 202, "Mountain trail" 2, "sentiero di montagna" (Italian) 2, null 2 | null | null |
| `category_condition` | easy 29 (local only), medium 199, difficult 123 | easy 27, medium 73, difficult 28 | easy 125, medium 101, difficult 81 |
| `category_condition_text` | null on all 786 | | |
| `hiking_time`, `hiking_time_back` | 262 of 274 local hikes; none on national or regional | none | none |
| `start`, `end` | on all 786; 135 loops | 53 loops | 234 loops |
| `via` | 102 | 39 | 73 |

- **Grade versus its text.** For hiking, easy maps to "hiking trail" and medium to "mountain hiking trail" in 342 of 351 routes. The grade is on every hiking route; the text has 2 nulls, 2 Italian values, odd casing ("Mountain trail" twice, local/120 and regional/25), and 3 routes where the text contradicts the grade: local/109, local/263 and local/454 are "medium" with "hiking trail", and all three are favorites.
- **`hiking_time` is decimal hours** with float noise (5.4166665 is 5 h 25 min). All 524 values round to whole multiples of 5 minutes. They range from 1 h 5 min to 8 h 15 min. The time back differs on 128 routes, 17 of them loops. The 12 local hikes without a time are 261, 360, 381 (favorites), 478, 570, 599, 693, 712, 735, 737, 757 and 980.
- **`start`, `end` and `via`.** 3 values have stray whitespace, so trim them. `via` separates places with "–" (126), "-" (35) or "," (3); the longest is 58 characters. Values contain apostrophes and curly quotes, so escape them. A quirk: cycling/national/1 has end "Genève(–Mittelmeer)".
- **`cantons`** is on all 786 routes, 1 to 13 per route. These are SchweizMobil's own numbers 2–28, not the federal ones: Geneva is 22 and Liechtenstein is 28. See Decision 6.
- **Photos.** Routes have only `photo_gallery` and `photo_gallery_big`; there are no `_master` or `_small` lists. In every route, `photo_gallery`, `photo_gallery_big`, `photo_gallery_copyright`, `photo_gallery_author` and `photo_gallery_ids` have the same length. The big and standard lists name the same photos in the same order; the only differences are `.JPG` casing. `photo_gallery_big` has blank entries in 54 routes (257 blanks), so `getGallery` (`public/script.js:1736`) picks `photo_gallery` there and `photo_gallery_big` in the other 732. Either way the picked list is full length, so it lines up by index with the credit arrays. That alignment is only luck today, because `filterEmptyImages` drops entries without tracking their index.
- **Credits.** Of 42,215 route photos, the author and copyright fields are identical on 39,340. The other 2,875 differ mostly in punctuation (", " versus "; ", trailing ";"), and the author field is the tidier one.
  - Taking the author, else the copyright, gives a credit to 41,099 photos (97.4%). 1,116 photos have none, and 76 routes have none at all.
  - In 294 routes the credit changes from photo to photo.
  - Quirks: 8 credits have line breaks with a postal address or email (hiking/local/977 photo 2: "Rene Niederer\n9107 Urnaesch\n…@…"), 15 start with "(c)", and a few are junk ("Picasa", "Bitte für weitere Veröffentlichung anfrgaen.").
  - After keeping only the first line, the longest credit is 53 characters (hiking/local/107: "Alexandre Deslex; Parrain photographe de SuisseMobile").
- **Sightseeing.** 764 of 843 places have galleries with the same credit arrays; 229 of 2,284 photos are credited. In files 699 and 4307, `photo_gallery` is one entry shorter, and the credit arrays match `photo_gallery_big`, the list picked there. The 79 hand-made entries have no gallery.
- **Changes**: none to `bin/`, `bin/ids-generator.js`, `ids/` or `public/data/`. Data size impact is 0 bytes. Trimming and cleaning happen in the browser, so there is no re-download.

## Decisions

1. **Filter control for Difficulty and Fitness**
   - **(a) One toggle chip per grade (recommended).** One click, and the options are visible. It reuses the `.chip` look. It fits: chips get about 178 px of the 240 px filter column after the 58 px label (an estimate), which is room for three "Difficult" chips. The costs are its own click binding, a narrower `updateBadges` selector, and the address feature has to save pressed chips, not just input values.
   - **(b) Min–Max `<select>` pair in a `.range` row.** This copies the "Mountain hikes" difficulty filter that `b263e9e` removed (`difficultySelect`). It reuses `readInt`, `inRange` and the existing `input, select` listener (`public/script.js:526`) unchanged, and the address feature saves it like the number inputs. But each select is about 67 px wide, and the native arrow leaves roughly 35–40 px for text, so "Medium" likely gets cut off (an estimate, not measured). It also takes two clicks per bound and hides the options.
   - **(c) One select (Any, Easy, Medium, Difficult).** It matches one grade only and can't express "easy or medium".
2. **Words**
   - **(a) Easy / Medium / Difficult on both scales (recommended).** These are the data's own ids, and one list serves both rows. Hiking difficulty also shows the trail type, derived from the grade (easy is "hiking trail", medium is "mountain hiking trail"). This keeps details and filter consistent and gives English on all 351 routes.
   - **(b) Fitness as Low / Medium / High.** "Fitness: High" reads better, but it is a second vocabulary for the same values.
   - **(c) Show `category_grade_text` as is.** That brings in the Italian, null and contradicting values listed in Data.
3. **Where facts go in the details**
   - **(a) Subtitle for start, end and via; Hiking time as a stat tile; Difficulty, Fitness and Other direction in a small facts list (recommended).**
   - **(b) All as stat tiles.** The grid holds 4 tiles in the 340 px body, so 5–6 tiles wrap into uneven rows, and "Medium · mountain hiking trail" doesn't fit in a tile.
   - **(c) Everything in the facts list.** One new element only, but the time is a headline number and start and end belong with the title.
4. **Where the credit shows**
   - **(a) A label laid over the photo at the bottom right (recommended).** Nothing moves when flipping between photos with and without a credit.
   - **(b) A caption line under the photo.** It is never cut off, but it adds about 20 px and makes the panel jump on photos without a credit, or leaves an empty line on the 76 routes with none.
5. **Gallery data**
   - **(a) Gallery entries become `{ src, credit }` (recommended).** `dropPhoto`'s `splice` keeps each credit with its photo, and the photo-spots feature adds `position` the same way.
   - **(b) A separate `item.credits` array.** Fewer lines change, but two arrays must be spliced together, and photo spots would add a third.
6. **Cantons**
   - **(a) Leave them out (recommended).** The numbers are SchweizMobil's own and appear nowhere in the repo; the map below is worked out from the data, and start and end already place the route.
   - **(b) Add a `CANTONS` map and a "Cantons" facts row** (for example "Valais, Bern"). The map, inferred from single-canton routes' place names (25 codes) and Basel, Aargau and Zug routes (8, 13, 21):
     2 Graubünden, 3 Zurich, 4 Uri, 5 Fribourg, 6 Thurgau, 7 Valais, 8 Basel-Stadt, 9 Basel-Landschaft, 10 Nidwalden, 11 Schwyz, 12 Bern, 13 Aargau, 14 Glarus, 15 Lucerne, 16 Solothurn, 17 Appenzell Innerrhoden, 18 Obwalden, 19 Ticino, 20 Schaffhausen, 21 Zug, 22 Geneva, 23 St. Gallen, 24 Jura, 25 Neuchâtel, 26 Appenzell Ausserrhoden, 27 Vaud, 28 Liechtenstein.
     All 27 codes occur in the data. This is an assumption: a SchweizMobil renumbering would silently mislabel cantons.

## Implementation steps

The code follows the file's existing style: double quotes, semicolons, string-built HTML, `let content = …; content += …`, and comments that say why.

### public/script.js

1. **Grade names**: new constant after `LEVELS` (`:15`).
   ```js
   // SchweizMobil rates every route easy, medium or difficult for fitness (category_condition), and hiking and mountain bike routes for difficulty too (category_grade)
   const GRADES = { easy: "Easy", medium: "Medium", difficult: "Difficult" };
   ```
   In `ACTIVITIES` (`:17–51`):
   - hiking (`:18–28`): add `grades: ["easy", "medium"]` and `trails: { easy: "hiking trail", medium: "mountain hiking trail" }`, with a comment that hiking routes are only easy or medium and the grade follows the trail type.
   - cycling: nothing, with a comment that cycling routes have no difficulty grade.
   - mountainbiking (`:40–50`): `grades: ["easy", "medium", "difficult"]`.
2. **Filter rows**: `activityRow` (`:552`), after the Ascent line (`:563`).
   ```js
   if (activity.grades) {
     content += gradeFilter(activity, "grade", "Difficulty", activity.grades);
   }

   content += gradeFilter(activity, "fitness", "Fitness", Object.keys(GRADES));
   ```
   Add `gradeFilter` after `rangeFilter` (`:588–596`). It returns `<div class="range"><span>${label}</span><div class="range-chips" role="group" aria-label="${activity.name} ${label.toLowerCase()}">…</div></div>`, with one `<button type="button" class="chip" data-grade-filter="${activity.id}-${name}" data-grade="${grade}" aria-pressed="false">${GRADES[grade]}</button>` per grade. There is no `data-layer`, so the layer binding at `:522` skips these buttons.
3. **Chip clicks**: `buildPanel`, after the `input, select` loop (`:526–528`), add a loop over `[data-grade-filter]`. Each click flips `aria-pressed` and calls `onFilterChange()` (`:642`). That reuses the 250 ms debounce and the `sharedItem` reset.
4. **Section badge fix**: `updateBadges` (`:630`). Change the selector to `'.toggle[aria-pressed="true"], .row:has(.chip[data-layer][aria-pressed="true"])'`. Without this, a pressed filter chip would count the Routes row as on after its levels are turned off.
5. **Read the chips**: in `readFilters` (`:648–660`), add `grade: pressedGrades(\`${activity.id}-grade\`)` and `fitness: pressedGrades(\`${activity.id}-fitness\`)`. Add `pressedGrades(filter)` next to `readInt` (`:2246`): it returns the `dataset.grade` of `[data-grade-filter="${filter}"][aria-pressed="true"]`. For cycling there are no Difficulty chips, so it returns `[]` and nothing breaks.
6. **Match**: in `matchesFilter` (`:663–672`), add `&& inGrades(item.grade, filter.grade) && inGrades(item.fitness, filter.fitness)`. Add `inGrades(value, grades)` after `inRange` (`:674–684`): `return grades.length === 0 || grades.includes(value);` with the comment "No pressed chip means any grade".
7. **Route item**: `buildRoute`, after `climb` (`:825`), add `grade: properties.category_grade,` and `fitness: properties.category_condition,`.
8. **Details**: `routeDetails` (`:1351–1396`).
   - After the title (`:1358`): `if (properties.start && properties.end) content += \`<p class="details-subtitle">${escapeHtml(routeEnds(properties))}</p>\`;`
   - After Descent (`:1375`), before Asphalt: `if (typeof properties.hiking_time === "number") stats += stat("Hiking time", duration(properties.hiking_time), "");`
   - After the stats line (`:1385`), build `facts`:
     - `Difficulty` when `GRADES[item.grade]`, adding ` · ${item.activity.trails?.[item.grade]}` when that is defined.
     - `Fitness` when `GRADES[item.fitness]`.
     - `Other direction` when `typeof properties.hiking_time_back === "number" && duration(properties.hiking_time_back) !== duration(properties.hiking_time)`. Comparing the formatted text avoids comparing floats.
     - Output `<dl class="facts">${facts}</dl>` when `facts` is not empty.

   New helpers in the Details section, next to `stat` (`:1632`):
   ```js
   // Most routes are loops: "Loop from Thun" rather than "Thun to Thun"
   function routeEnds(properties) {
     const start = properties.start.trim();
     const end = properties.end.trim();
     const ends = start === end ? `Loop from ${start}` : `${start} to ${end}`;

     return properties.via ? `${ends} via ${properties.via.trim()}` : ends;
   }

   // Hiking times are stored in hours, in steps of 5 minutes: 5.4166665 is 5 h 25 min
   function duration(hours) {
     const minutes = Math.round(hours * 60);
     const parts = [];

     if (minutes >= 60) {
       parts.push(`${Math.floor(minutes / 60)}<span class="stat-unit">h</span>`);
     }

     if (minutes % 60 > 0) {
       parts.push(`${minutes % 60}<span class="stat-unit">min</span>`);
     }

     return parts.join(" ");
   }

   function fact(label, value) {
     return `<dt>${label}</dt><dd>${value}</dd>`;
   }
   ```
9. **Gallery entries and credits**
   - `getGallery` (`:1736–1770`): same rule, first longest list wins and `foto` comes last. It now builds its lists with `galleryPhotos(properties, list)`, and `foto` becomes `[{ src: properties.foto }]`. Return `candidates.find((photos) => photos.length === maxLength)`, which gives `[]` when everything is empty.
   - Replace `filterEmptyImages` (`:1772–1784`). Pairing happens before blanks are dropped, and only when the lengths agree:
     ```js
     // Each photo with its credit. The credit lists run alongside the photo lists, so a credit is matched by position before empty photos are dropped
     function galleryPhotos(properties, list) {
       const photos = [];

       if (list) {
         const credited = list.length === properties.photo_gallery_author?.length;

         list.forEach((src, index) => {
           if (src && src.trim().length > 0) {
             photos.push({ src: src.trim(), credit: credited ? photoCredit(properties, index) : undefined });
           }
         });
       }

       return photos;
     }

     // The author field is the tidier copy of the copyright field. Only the first line is kept: one photographer added a postal address
     function photoCredit(properties, index) {
       for (const credits of [properties.photo_gallery_author, properties.photo_gallery_copyright]) {
         const credit = String(credits?.[index] ?? "").split("\n")[0].replace(/^\s*(\(c\)|©)/i, "").replace(/[\s;,]+$/, "").trim();

         if (credit) {
           return credit;
         }
       }

       return undefined;
     }

     function creditText(photo) {
       return photo.credit ? `© ${photo.credit}` : "";
     }
     ```
   - `gallerySection` (`:1640`): use `gallery[0].src`. Right after the `<img>`, add `<span class="media-credit" id="galleryCredit" title="${escapeHtml(credit)}"${credit ? "" : " hidden"}>${escapeHtml(credit)}</span>`, where `credit = creditText(gallery[0])`.
   - `showPhoto` (`:1671–1690`): change `:1683` and `:1686` to use `.src`. After the branches, when `gallery.length > 0`, set `#galleryCredit`'s `textContent` and `title` to `creditText(gallery[galleryIndex])` and its `hidden` to `!credit`.
   - `dropPhoto` (`:1697`): compare with `gallery[galleryIndex]?.src`.
   - No other code reads `item.gallery`. The empty `gallery: []` on charging stations, OSM places and uploads stays valid.
10. **Analytics**: no new events. The existing filters send none (the only events are `layer_toggle`, `select_content`, `share`, `gpx_upload` and `gpx_download`).

### public/style.css

11. After `.range-dash` (`:418–420`). The color sits on the container so that `.chip[aria-pressed="true"]` (`:355`) still sets white text:
    ```css
    /* Difficulty and fitness chips fill the rest of a filter row, three to a row so the rows line up */
    .range-chips {
      display: grid;
      grid-column: 2 / -1;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      color: var(--ink);
    }
    ```
12. After `.details-title` (`:533–541`), bring back the old subtitle rule: `.details-subtitle { margin: 4px 0 0; color: var(--ink-soft); font-size: 15px; }`.
13. After `.stat-unit` (`:603–609`): `.facts { display: grid; grid-template-columns: max-content 1fr; align-items: baseline; gap: 6px 16px; margin: 0 0 18px; }`, `.facts dt { color: var(--ink-soft); font-size: 12.5px; }`, `.facts dd { margin: 0; font-weight: 560; }`.
14. Split `.media-counter` (`:490–500`) into:
    - a shared rule `.media-counter, .media-credit` with `position`, `bottom`, `padding`, `border-radius`, `background`, `color` and `font-size`;
    - `.media-counter { left: 10px; font-variant-numeric: tabular-nums; }`;
    - `.media-credit { right: 10px; max-width: calc(100% - 110px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`. The comment should say this keeps it clear of the counter, which is at most "283 / 283" (hiking/national/6).

### Not changed
`public/index.html` (no new icon names), `bin/*`, `ids/`, `public/data/`, `AGENTS.md`.

## Interactions with the other planned features

- **Elevation profile (`PLAN-4-elevation-profile.md`)** also edits `routeDetails`. Agreed order: title, subtitle, actions, stats, facts, elevation profile, abstract, description. Any stat tile it added would push routes past the 4-tile row (hiking now has Hiking time; bikes have Asphalt); it adds none. Its GPX elevation work in `gpxData` and its changes to `uploadDetails` don't overlap with this feature.
- **View in the address (`PLAN-3-url-state.md`)**: the new filters are buttons with `aria-pressed`, not inputs. That plan reserves the keys `<activity>.difficulty` (for the `-grade` chips) and `<activity>.fitness`, saved as SchweizMobil ids (`easy`, `medium`, `difficult`), which make stable tokens. On restore it sets `aria-pressed` before the first render and calls `scheduleRender` itself, because setting the attribute fires no event. It should ignore a cycling `difficulty` value, since there are no chips for it. It depends on the `updateBadges` fix (step 4), or restored chips would light the badge. The chip clicks go through `onFilterChange`, so the address updates with no extra hook.
- **Saved list (`PLAN-1-saved-list.md`)** adds its Save button to the same `actions([...])` call in `routeDetails`. Its saved layers have no `filter`, like `favorites.hiking` (`:403`), so these filters skip saved routes.
- **Photo spots are already built, with their own list, so step 9 folds that list into the gallery entries.** Today `buildRoute` sets `item.spots`, one `{ position, marker, key }` per gallery photo, made by `photoSpots`. `galleryIndexes` lines it up with the gallery by finding each photo's raw index again, and `dropPhoto` splices `selected.spots` alongside `gallery`. In step 9:
  - `galleryPhotos` also sets `position` on each entry from `photo_gallery_coords[index]`, with the same index pairing, using the regex in `photoSpots`. The strings look like `"[(6.11894, 46.19983)]"`, longitude first, the reverse of the project's `[lat, lng]`. mountainbiking/local/302 has `[]` for its 1 photo.
  - `getGallery` doesn't know the route's box, so `buildRoute` then clears any `position` more than `SPOT_MARGIN` outside `item.bounds`, the check `photoSpots` makes today.
  - Each pin lives on its entry (`photo.marker`, `photo.key`). `drawPhotoSpots`, `hidePhotoSpots`, `showSpotPhoto` and `plusSlides` use `selected.gallery` instead of `selected.spots`.
  - Delete `item.spots`, `photoSpots` and `galleryIndexes`. In `dropPhoto`, remove the extra `selected.spots` splice, but keep taking the dropped photo's pin off the map.
  - A photo pin click sets `galleryIndex` and calls `showPhoto()`, so the credit follows.

## Edge cases and risks

- The three favorites local/109, 263 and 454 will read "Medium · mountain hiking trail", although SchweizMobil's text says "hiking trail". Taking the grade keeps details and filter in agreement.
- A new grade value after a data refresh, such as a "difficult" hike: there is no chip for it and no details row, and the route is hidden while any chip in that row is pressed. Rerun the count check under Verification after `/update-data`.
- Credits are shown as SchweizMobil gives them, including German and French program names ("FotoPate SchweizMobil") and the odd junk value. Credits by "Alexandre Deslex; Parrain photographe de SuisseMobile" are cut off with "…", and the full text shows on hover.
- Text widths are estimates, not measured: three chips per row, "5 h 25 min" in a 76 px tile, and "Difficulty" in the 58 px label column. Check them visually.
- With all three activities on, the filter blocks are taller (4 rows each). The panel already scrolls (`.layers-body`, `overflow-y: auto`).
- All new text goes through `escapeHtml` or `textContent`. Credits never become links, so the email in hiking/local/977 is dropped by the first-line rule.

## Verification

Run `scripts/serve.sh` and open http://localhost:5000. Open single routes with `?url=<path>&type=<activity>`, for example `?url=hiking/local/101.json&type=hiking`.

**Filters**
1. Turn on all hiking levels. The block shows Length, Ascent, Difficulty (2 chips) and Fitness (3 chips).
   - Difficulty Easy: the hiking row reads **142 of 351**. Add Medium: it reads **351**.
   - Clear those, then Fitness Easy + Medium: **228 of 351**.
2. Turn on hiking Local only, Difficulty Easy: **110 of 274**.
3. Turn on all cycling levels: there is no Difficulty row. Fitness Difficult: **28 of 128**.
4. Mountain biking Local:
   - Difficulty Difficult + Fitness Easy: **23 of 286**.
   - Clear those, then Difficulty Easy + Length max 20: **31 of 286**.
5. Press a chip, then turn off all levels of that activity. The block hides and the Routes badge disappears. Turn a level back on: the chip is still pressed and still applies.
6. With `?favorites=1`, turn on Favorites "Hikes" and hiking Local with Difficulty Easy. The Favorites row stays at 91 and favorite routes stay drawn.
7. Keyboard: Tab reaches the chips, Space toggles them, and the pressed state is announced. Length and Ascent still work and combine with the chips.

**Details**
8. `hiking/local/101`:
   - subtitle "Genève to La Plaine";
   - tiles: 20 km, 460 m, 480 m, Hiking time 5 h 25 min;
   - Difficulty "Easy · hiking trail", Fitness "Difficult", no Other direction;
   - credit "© Vreni Braun; FotoPatin SchweizMobil".
9. `hiking/local/102`: "Loop from Chancy via Vers Veaux–Bois de Chancy–Champlong", "3 h", Fitness Medium.
10. `hiking/local/104`: Hiking time 2 h 25 min, Other direction 2 h 30 min.
11. `hiking/local/261`: no Hiking time tile.
12. `hiking/local/187` and `hiking/regional/25`: "Medium · mountain hiking trail".
13. `mountainbiking/local/114`: Difficulty "Difficult" with no trail text, Fitness "Easy", Asphalt tile.
14. `cycling/national/1`: no Difficulty row; subtitle "Andermatt to Genève(–Mittelmeer)".

**Credits**
15. `hiking/national/2`: the credit comes and goes while flipping photos, and nothing moves.
16. `hiking/local/977`, photo 2: "© Rene Niederer" only.
17. `hiking/local/127`: never a credit.
18. `hiking/local/107`: the credit ends in "…", and hover shows the full text.
19. `hiking/local/820` (gallery taken from `photo_gallery`): compare two credits with the JSON by index.
20. `?url=other/sightseeing/151.json&type=visibility`: a credit shows on the photo that has one. Accommodation places show none.
21. In DevTools, block the URL of the current photo, then flip. The photo and its credit are dropped together, and the counter updates.

**Read-only data checks** (rerun after `/update-data`)
- Grade and fitness counts per layer: `node -e "const fs=require('fs');for(const a of ['hiking','cycling','mountainbiking'])for(const l of ['national','regional','local']){const d='public/data/'+a+'/'+l,c={};for(const f of fs.readdirSync(d)){const p=JSON.parse(fs.readFileSync(d+'/'+f)).properties;for(const k of ['category_grade','category_condition'])c[k+'='+p[k]]=(c[k+'='+p[k]]||0)+1}console.log(a+'/'+l,JSON.stringify(c))}"`
- Photo array alignment, expected 0: `node -e "const fs=require('fs');let bad=0;for(const a of ['hiking','cycling','mountainbiking'])for(const l of ['national','regional','local'])for(const f of fs.readdirSync('public/data/'+a+'/'+l)){const p=JSON.parse(fs.readFileSync('public/data/'+a+'/'+l+'/'+f)).properties;const n=p.photo_gallery.length;if(![p.photo_gallery_big,p.photo_gallery_author,p.photo_gallery_copyright].every(x=>x.length===n))bad++}console.log('misaligned routes:',bad)"`

## Out of scope

- Cantons (unless Decision 6 changes to b).
- Mountain hut `beds`, `pricefrom` and `priceto` (on 242 of 243 hut files).
- `length_unsurfaced` and `length_singletrail` (434 and 307 routes).
- Analytics events for filters.
- Sorting or ranking by difficulty.
- Trimming fields in `bin/helpers.js`.
- Translating credit suffixes.
- Credits for accommodation photos (no data).
