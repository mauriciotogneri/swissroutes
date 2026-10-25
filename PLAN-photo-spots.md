# Photo spots on the map for the selected route

**Goal**: When a route is selected, show a small camera pin at each photo's location along it. Clicking a pin shows that photo in the gallery, and moving through the gallery marks the matching pin.

## What the user sees

1. **Selecting a route.** This covers clicking its line or number plate, a share link, the Favorites list or the saved list. Round camera pins then appear along the route:
   - Each pin is 20 px, in the route's color (red, blue or green), with a white border and a white filled camera glyph. They look like the place pins, which are 26 px and dark.
   - The pin of the photo on show is marked the way a selected place pin is: a grey ring and a slight enlargement. It is always drawn on top. On open that is photo 1.
2. **Overlapping pins.** Where pins would overlap at the current zoom, only one is drawn, and the earlier photo wins. Zooming in shows more. Using the 22 px spacing simulation from the Data section:
   - at zoom 9 (all of Switzerland), about 7% of spots get a pin;
   - at a route's own fitted zoom, about 56%;
   - at street level, nearly all of them.
3. **Hover.** The browser tooltip reads "Photo 12 of 52", or "Photo 12 of 52, on show" for the marked pin. This is the same mechanism place pins use.
4. **Click, or Enter on a focused pin.**
   - The gallery jumps to that photo and its counter reads "12 / 52".
   - The panel scrolls back to the top so the photo is visible.
   - The ring moves to the clicked pin.
   - Screen readers hear "Photo 12 of 52" through the existing status region.
   - Focus stays on the pin.
5. **Previous / Next.**
   - The ring follows the gallery.
   - If the new photo's spot is outside the visible map, the map pans to it without zooming.
   - For a photo with no spot, no pin is ringed.
6. **Several photos at one spot.** The visible pin is the first of them, and Next walks through the rest. In 2,638 of 2,643 such stacks the photos are consecutive in the gallery.
7. **Pins disappear** when the panel closes (close button, Escape, a click on the map) or another item is selected (another route, a place pin, a GPX upload). Selecting the route again brings them back with photo 1 marked.
8. **Empty and thin cases.**
   - 88 routes get no pins; the gallery works as today and no message is shown.
   - 7 routes get 1–2 pins and 6 routes get 3–9.
   - In the 26 routes with partial coverage, photos without a spot just mark no pin.
9. **A photo that fails to load.** The gallery drops it as today (`dropPhoto`), its pin disappears with it, and the pin of the photo now shown is marked. Pin titles renumber.
10. **No pins for** places, charging stations, OpenStreetMap places or uploaded GPX tracks. None of them has photo coordinates.

## Data

All counts cover the 786 route files listed in `ids/`. Each was measured with read-only node one-liners.

**Which list the gallery uses**
- Every route file has these as arrays: `photo_gallery`, `photo_gallery_big`, `photo_gallery_urls`, `_ids`, `_copyright`, `_author`, `_coords` and `_abstract`.
- `photo_gallery_master` and `photo_gallery_small` are missing from every route file.
- `getGallery` (`public/script.js:1736`) compares, after `filterEmptyImages`, these lists in this order: `photo_gallery_big`, `photo_gallery_master`, `photo_gallery`, `photo_gallery_small`, `[foto]`. The first longest list wins.
  - It picks `photo_gallery_big` in 732 routes.
  - It picks `photo_gallery` in 54 routes. In those, `photo_gallery_big` holds 257 empty strings.
- `filterEmptyImages` removes nothing from the list that gets picked, in any route. So gallery index i is raw index i everywhere today.
- `photo_gallery[i]` and `photo_gallery_big[i]` name the same image in all 41,958 pairs.

**Alignment of the parallel lists**
- All parallel lists have the same length in every file except `mountainbiking/local/302`. There `photo_gallery_coords` is `[]` while the route has 1 photo.

**Coverage**
- 42,215 photos in total; every route has at least one.
- 41,584 have a coordinate, 630 have `""`, and 1 is missing (route 302).
- Every photo with an empty `photo_gallery_big` entry also has no coordinate (257 photos). Another 374 photos lack one too.
- By route: 676 full, 26 partial, 84 with none (77 mountain-bike local, 6 hiking local, 1 cycling local).
- Every national and regional route is fully covered.

**Format**
- Every non-empty value matches `^\[\((\d+\.?\d*), (\d+\.?\d*)\)\]$`: one point, longitude first.
- None has a minus sign, an exponent or extra whitespace, and none holds more than one point.
- About half carry float noise to 15–16 decimals, e.g. `9.387270000000001`.
- All points fall inside the Swiss box.

**Distance from the route line**

| Distance | Photos |
|---|---|
| < 25 m | 41,462 (99.7%) |
| 25–100 m | 1 |
| 100–250 m | 50 |
| 250–500 m | 27 |
| 0.5–1 km | 18 |
| 1–5 km | 16 |
| > 5 km | 10 |

The 10 beyond 5 km:
- 4 lone points 107–125 km away, each being its route's only coordinate: mountain-bike local 242, 277, 278 and 602.
- 6 photos of mountain-bike local 410, stacked at one point 12 km away.

A check against the route's box widened by 0.01° (about 1 km) drops exactly 20 points, all at least 1.3 km from the line. It keeps every point closer than that.

**Duplicates and crowding**
- 3,364 photos share an exact spot (to 5 decimals) with an earlier photo of the same route, in 502 routes. That leaves 38,220 unique spots.
- 2,643 spots hold 2 or more photos, at most 15 (`cycling/local/412`).
- 39 repeated photo URLs within 15 routes: 23 repeat at the same spot, 16 at a different one.
- With 22 px spacing, these spots fit without overlapping:

| Zoom | Spots that fit (of 38,220) |
|---|---|
| 9 | 2,832 |
| 12 | 12,072 |
| Each route's fitted zoom | 21,273 |

**Captions**: `photo_gallery_abstract` is empty for all 42,215 photos.

**Places**: no file in `accommodation/*` or `other/*` has `photo_gallery_coords`. Sightseeing has `photo_gallery` without coordinates, and OSM entries are `{id, coordinates, tags, name}`. So this feature is for routes only.

**Result with the recommended options**
- 41,564 pins across 698 routes.
- 88 routes get none: 84 have no coordinates, and 4 have only the far-off point.
- The largest is `hiking/national/6` (Alpine Passes Trail): 283 photos, 259 unique spots, 106k line vertices.

**Size**: `photo_gallery_coords` takes 1,392,688 bytes of the 158.5 MB of route JSON. Normalized to `[[lat,lng]|null]` at 5 decimals it would be about 786 KB, a saving of 606 KB (0.4%).

**Data change in this plan**: none. Neither `bin/` nor `public/data` changes.

**Not verifiable offline**: which photo URLs fail to load. That would mean fetching 42k images.

## Decisions

**D1. Where the coordinates are parsed**
- **(a) In the browser, in `buildRoute` (recommended).**
  - Works with the committed data today, with no re-download.
  - Costs one regex per photo of a loaded route, at most 283.
  - The raw format stays, so a change at SchweizMobil means editing one regex.
- **(b) Normalize in `bin/helpers.js` `downloadFile`.**
  - Done in the route branch (`!isPoint`), next to `const properties = element.properties` at line 92: write `[lat, lng]` or `null`, rounded to 5 decimals, and drop far-off points by exact distance.
  - Saves 606 KB and makes the browser code simpler.
  - But the site only gets the new field after re-running `route-downloader.js` (about 3,300 requests), unless the string parser is kept as well.
  - `downloadFile` is shared with place downloads, so the change has to stay in the route branch.

**D2. Spots far from the route**
- **(a) Drop a spot more than `SPOT_MARGIN` = 0.01° outside `item.bounds` (recommended).** This uses the existing box, takes constant time per photo, and removes exactly the 20 points that are 1.3 km or more off.
- **(b) Show everything.** Four routes would get a lone pin 107–125 km away, and route 410 a stack 12 km away.
- **(c) Exact distance to the line in the browser.** Precise, but 283 × 106k segment checks when the Alpine Passes Trail is selected.

**D3. Overlapping pins**
- **(a) Google's marker collision handling (recommended).**
  - Normal pins use `OPTIONAL_AND_HIDES_LOWER_PRIORITY` with `zIndex = PHOTO_ZINDEX - i`, so earlier photos win.
  - The marked pin uses `REQUIRED_AND_HIDES_OPTIONAL` at `PHOTO_ZINDEX + 1`.
  - This needs no screen-space code. Google's docs say marker-to-marker collision works on raster maps too, and the constants come from the `marker` library already loaded.
  - It depends on Maps behavior that couldn't be checked offline; see Risks.
- **(b) Thinning in our own code.**
  - On map `idle`, run a per-route Supercluster index (about 22 px radius), following the existing `setPoints`/`drawPins` pattern.
  - Draw one pin per group, at that photo's own position, because a group's centre can fall off the route. Always draw the marked pin.
  - About 30 lines; predictable and independent of Maps behavior.
  - This is the fallback if the checks for (a) fail.
- **(c) Draw every pin.** Simplest, but at zoom 9 a local route becomes a heap of 50 pins.

**D4. Hover**
- **(a) Text only, through the marker `title` (recommended).** Same as place pins, and no extra downloads.
- **(b) A thumbnail in `#tooltip`.**
  - Route files have no small image size, so each hover would download the standard `photo_gallery` image.
  - It needs mouseenter/mouseleave listeners and positioning code.
  - The photo is one click away in the panel anyway.

**D5. The map following the gallery**
- **(a) On Previous/Next only, pan when the spot is outside the visible map (recommended).** Otherwise the ring can change off-screen and nothing visible happens.
- **(b) Never move the map.**

## Implementation steps

### `public/script.js`

1. **Constants.** After `LOADING_RENDER_DELAY` (`public/script.js:320`), add two constants, each with a one-line comment:
   - `SPOT_MARGIN = 0.01`: "A photo spot this far (about 1 km) outside the box around its route is a data error. 20 such points exist, some 100 km away."
   - `PHOTO_ZINDEX = 100000`: "Photo pins sit above every bubble, whose z-index is 1000 plus its count, so under 60,000 with every layer on."

2. **`buildRoute`** (`public/script.js:807`). After `item.badge = createMarker(...)` (lines 833–837), add `item.spots = photoSpots(item);`.
   - `item.spots` is aligned with `item.gallery`: one `{ position }` per photo, with `position` undefined when the photo has no usable spot.
   - Each entry's `marker` is added later, the first time it is needed.

3. **New section `// Photo spots`.** Insert it before `// Controls` (`public/script.js:1786`), after `filterEmptyImages`. Follow the file's style: double quotes, `point()`, and comments that say why.

   ```js
   // A route's photo lists run side by side: entry i of photo_gallery_coords (or _copyright…) belongs to photo i.
   // The gallery is photo_gallery_big or photo_gallery without its empty entries, so this finds each gallery photo's i
   function galleryIndexes(properties, gallery) {
     for (const list of [properties.photo_gallery_big, properties.photo_gallery]) {
       const indexes = [];
       list?.forEach((url, i) => { if (url && url.trim().length > 0) indexes.push(i); });
       if (indexes.length === gallery.length && indexes.every((i, j) => list[i].trim() === gallery[j])) {
         return indexes;
       }
     }
     return [];
   }

   // A spot is written "[(lng, lat)]", longitude first, the reverse of the rest of the data
   function photoSpots(item) {
     const properties = item.json.properties;
     const bounds = item.bounds;
     return galleryIndexes(properties, item.gallery).map((i) => {
       const match = /\(([-\d.]+),\s*([-\d.]+)\)/.exec(properties.photo_gallery_coords?.[i] ?? "");
       const position = match ? point(parseFloat(match[2]), parseFloat(match[1])) : undefined;
       // NaN fails these comparisons too
       const near = position && position.lat <= bounds.north + SPOT_MARGIN && position.lat >= bounds.south - SPOT_MARGIN
         && position.lng <= bounds.east + SPOT_MARGIN && position.lng >= bounds.west - SPOT_MARGIN;
       return { position: near ? position : undefined };
     });
   }
   ```

   Add four more functions in the same section:
   - **`photoPin(spot, color)`.** Build it like `createMarker` (`public/script.js:928`).
     - The content is a `span` with class `"marker photo-pin material-symbols-outlined"`, `--color` set to the route color, and text `photo_camera`.
     - Use `gmpClickable: true`.
     - On `gmp-click`, call `showSpotPhoto(spot)`. `createMarker` can't be reused because its click handler calls `selectItem`.
   - **`drawPhotoSpots()`.** Loop over `selected?.spots ?? []`; for each spot with a position:
     - Create the marker if it doesn't exist yet (`spot.marker ??= photoPin(spot, selected.color)`).
     - Build a key `${i}|${gallery.length}|${i === galleryIndex}`. When it differs from `spot.key`, set `title`, `zIndex`, `collisionBehavior` (`google.maps.CollisionBehavior.*`) and the `selected` class, using the values from D3(a). This follows the `styleKey` cache in `styleRoute` (`public/script.js:1191`), so one gallery step updates only two pins.
     - Then set `marker.map = map` if it isn't already, guarded the same way as `drawPins` (`public/script.js:1170`).
   - **`hidePhotoSpots(item)`.** Set `marker.map = null` for every spot of `item?.spots` that has a marker.
   - **`showSpotPhoto(spot)`.**
     - Look up `const index = selected?.spots?.indexOf(spot) ?? -1`, and return if it is below 0.
     - Then set `galleryIndex = index`, call `showPhoto()`, set `document.querySelector(".details-scroll").scrollTop = 0`, and call `setStatus(\`Photo ${index + 1} of ${selected.gallery.length}\`)`.

4. **`selectItem`** (`public/script.js:1248`). Add `hidePhotoSpots(selected);` right before `selected = item;` (line 1254), and `drawPhotoSpots();` after `render();` (line 1271).

5. **`closeDetails`** (`public/script.js:1274`). Add `hidePhotoSpots(selected);` before `selected = undefined;` (line 1279).

6. **`plusSlides`** (`public/script.js:1664`). After `showPhoto()`:
   - Read `const position = selected.spots?.[galleryIndex]?.position;`.
   - If it exists and `!map.getBounds()?.contains(position)`, call `map.panTo(position)`.
   - Comment: "The map follows the gallery when the photo was taken outside the visible area".

7. **`showPhoto`** (`public/script.js:1671`). Call `drawPhotoSpots();` at the end, after the if/else that closes at line 1689. This covers arrows, pin clicks and dropped photos.

8. **`dropPhoto`** (`public/script.js:1693`). After `gallery.splice(galleryIndex, 1);` (line 1701), add:
   - `const [spot] = selected.spots?.splice(galleryIndex, 1) ?? [];`
   - `if (spot?.marker) spot.marker.map = null;`

   The existing `showPhoto()` call then renumbers the remaining pins, because the gallery length in every key has changed.

### `public/style.css`

9. After `.marker.selected` (`public/style.css:780–783`), add `.photo-pin` with a comment ("The selected route's photo spots: smaller than place pins, in the route's color"):
   - `width: 20px; height: 20px; font-size: 12px;`
   - Background, white border, shadow, `translateY(50%)` centering, hover scale, the `.selected` ring and the reduced-motion rule (lines 907–912) all come from `.marker`, so nothing else is needed.

### `public/index.html`

10. In the Material Symbols `icon_names` list (`public/index.html:43`), add `photo_camera` between `pedal_bike` and `pool`. The list is alphabetical; Google Fonts is assumed to expect the names sorted.

### `AGENTS.md`

11. At line 44, after "Coordinates are stored as `[lat, lng]`…", add one sentence: "The exception is `photo_gallery_coords` in route files, which keeps SchweizMobil's `"[(lng, lat)]"` strings; `script.js` reads them as they are."

The whole change is about 70 lines in `script.js`, 6 in `style.css` and 1 word in `index.html`. `bin/` is unchanged.

## Interactions with the other planned features

- **Route facts and photo credits (`PLAN-route-facts.md`).**
  - The credits have the same alignment problem: the credit of photo i must follow gallery photo i, including after drops.
  - That plan turns gallery entries into `{ src, credit }` records, paired by index inside `galleryPhotos` before blanks are dropped (its Decision 5a). **If it lands first, build on it instead of steps 2–3's separate list:** add `position` to each record in `galleryPhotos` (same regex and `SPOT_MARGIN` check, with the bounds passed in), keep the marker on the record (`photo.marker`), drop `galleryIndexes` and `item.spots`, and skip step 8's extra splice, because `dropPhoto` already removes the whole record. `drawPhotoSpots` then loops over `selected.gallery`.
  - If this feature lands first, steps 2–8 stand as written, and the route-facts work folds `item.spots` into its records.
  - Both features add a line to `showPhoto()`.
- **Elevation profile (`PLAN-elevation-profile.md`).**
  - Its hover marker uses z-index 200000, above `PHOTO_ZINDEX + 1`, and keeps the default `REQUIRED` behavior.
  - Both features add map objects tied to the selection, and both clear them at the same two places: `selectItem` and `closeDetails`.
  - This feature doesn't touch `gpxData`.
- **View kept in the address (`PLAN-url-state.md`).**
  - Don't put the gallery index in the address.
  - Panning to a photo changes the map position, so the address updates fire, as they should.
  - If a selection is ever restored without going through `selectItem`/`openSharedItem`, it must call `drawPhotoSpots()`.
- **Saved list (`PLAN-saved-list.md`).** Saved routes open through `selectItem`, so pins come for free. Its star icon and this camera icon both edit `index.html:43`; keep the list alphabetical.
- **Shared edit points**: `selectItem`/`closeDetails` (elevation, address, saved list), `showPhoto`/`dropPhoto` (route facts), the icon list, and the marker rules in `style.css`.

## Edge cases and risks

- **Assumption: REQUIRED markers don't hide optional ones.** Place pins, plates and bubbles are `REQUIRED`. The docs say only `REQUIRED_AND_HIDES_OPTIONAL` markers hide optional ones; the `OPTIONAL` definition ("display only if it does not overlap with other markers") is ambiguous. If dense layers such as Drinking water hide photo pins, switch to D3(b).
- **Assumption: `collisionBehavior` can be changed after a marker is created.** The reference lists it with no read-only flag, but doesn't say so. If changing it has no effect, rebuild the two affected markers or use D3(b).
- **Assumption: vector or raster.** It's unclear whether `DEMO_MAP_ID` draws a vector map. On a vector map, optional pins may also give way to map labels.
- **Keyboard.** Google's docs say Tab reaches the first clickable marker, arrow keys move between markers, and Enter clicks. Pins hidden by collision are probably not reachable; the gallery buttons stay the complete keyboard path. If a pin has focus, Escape closes the panel and removes the pins, and focus falls back to the page, because `closeDetails` only restores focus from inside the panel (lines 1282–1290).
- **Number plate covered.** The selected route's number plate (`zIndex` 1000) can be hidden under a photo pin at the start. That's accepted, since the number is in the panel. A one-line fix if wanted: make the plate `REQUIRED_AND_HIDES_OPTIONAL` while it is emphasized, in `styleRoute` (line 1199).
- **Failures are found one at a time.** A broken photo is only discovered when shown. Clicking its pin drops it and marks the next photo's pin, which can be elsewhere on the route. Drops last for the session (`item.gallery` is changed in place); `item.spots` is spliced alongside, so it stays aligned.
- **Duplicate URLs** (39) get their own pins from their own coordinates, thanks to index alignment.
- **Future data.** If the picked list ever has empty entries, `galleryIndexes` still lines up. If no list matches, the route simply has no pins. Strings with several points use the first point.
- **Marker count.** First selecting the Alpine Passes Trail creates up to 283 markers; they are reused afterwards.

## Verification

Run `scripts/serve.sh` and open http://localhost:5000.

1. Turn on Hiking › National and click the Alpine Passes Trail.
   - Red camera pins appear and pin 1 is ringed.
   - `google.maps.CollisionBehavior` is defined in the console, with no errors.
   - At zoom 9 there are few pins; zooming in shows more, and pins never overlap.
2. Hover a pin: "Photo N of 283". Click it: the gallery shows N, the counter reads "N / 283" and the ring moves. Scroll the panel down first and check it jumps back to the photo.
3. Press Next and Previous. The ring follows; when the spot is off-screen the map pans to it. Check a few photos against Satellite.
4. Open `?url=cycling/local/412.json&type=cycling` (15 photos at one spot). Click the pin: it shows the first photo of the stack, Next walks through it, and the ring stays put.
5. Routes with few or no pins:
   - `?url=mountainbiking/local/131.json&type=mountainbiking`: no pins, gallery normal.
   - `…/242.json`: no pins (its only spot is 107 km off).
   - `…/410.json`: 28 pins, none 12 km away.
   - `?url=hiking/local/820.json&type=hiking`: 1 pin. On photo 2 nothing is ringed.
6. Pins disappear after each of these: the close button, Escape, a map click, clicking another route, clicking a place pin, uploading a GPX. Reselecting brings them back with photo 1 ringed. A GPX track never gets pins.
7. With a route selected at zoom 8–10, turn on Drinking water and Camping.
   - Photo pins draw above bubbles and place pins and are not hidden by them (checks the first assumption above).
   - Bubble counts are the same with and without the selection.
8. In DevTools › Network request blocking, block one `photo_gallery_big` URL of an open route, taken from its JSON, then click that pin. The photo is dropped, the next one shows, the pin disappears, and the following pin's title is renumbered.
9. Keyboard: Tab into the map, use the arrow keys to reach a camera pin, press Enter. The photo changes, focus stays on the pin, and a screen reader reads "Photo N of M".
10. Check that pins are readable on Terrain and Satellite, and that with reduced motion turned on there is no scale animation.

Read-only checks over the data (node one-liners):
- Running `galleryIndexes` and the `SPOT_MARGIN` filter over every route should give: 0 routes where alignment fails, 41,564 pins, 698 routes with pins, 88 without.
- The format regex `^\[\((\d+\.?\d*), (\d+\.?\d*)\)\]$` matches all 41,584 non-empty values.
- No `accommodation/*` or `other/*` file has `photo_gallery_coords`.

## Out of scope

- Normalizing or exact-distance filtering in `bin/` (D1(b), D2(c)).
- Pins for places and GPX uploads (there is no data for them).
- Photo waypoints in the downloaded GPX, and photo marks on the elevation profile.
- The photo index in the address.
- Starring photos.
- Hover thumbnails (D4(b)), a photo grid, and arrow-key shortcuts for the gallery.
- An analytics event for pin clicks (one `track()` line if wanted).
- Changing `getGallery`'s fallback to `photo_gallery` in 54 routes.
- Captions (`photo_gallery_abstract` is empty everywhere).
