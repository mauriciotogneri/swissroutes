# Saved list: visitors star routes and places

**Goal**: Visitors can save any route or place from its details panel. The list is kept in their own browser (localStorage) and shown as a "Saved" group in the header menu (☰ at the top left of the layer panel). The group reuses the layer, row, badge and count machinery that Favorites already uses.

## What the user sees

1. **Details panel.** Routes, SchweizMobil / My Switzerland places, OpenStreetMap places and charging stations get a **Save** action with an outlined star.
   - Routes and SchweizMobil / My Switzerland places: right after Copy link.
   - OpenStreetMap places and charging stations: first in the row, because they have no Copy link.
   - Uploaded GPX tracks get no Save action.
2. **Saving.** Clicking Save fills the star in red and changes the label to **Saved**. Screen readers hear "Saved" through the existing `#status` live region. The matching Saved row count in the menu goes up by 1 straight away. Clicking again changes it back to **Save** / outlined, the count goes down, and the screen reader hears "Removed from saved".
3. **The Saved group, in the header menu.**
   - The menu holds, top to bottom: the Language row (languages plan), the Theme row (theme plan), Upload GPX, Remove track (while a track is loaded), then the Saved group. Whichever of these is built first simply leaves the others out.
   - The group has a divider above it and a "Saved" heading with a star icon and the usual badge, like the panel's sections. It is not collapsible.
   - Two rows: **Routes** (ink line swatch) and **Places** (`location_on` icon swatch). Each shows its count.
   - While nothing is saved, both rows show `0` and a hint line appears below them: "Save a route or place from its details to keep it here."
   - The layer panel has no Saved section.
4. **Turning a row on.**
   - The menu stays open, so both rows can be turned on in one go; the map changes beside it.
   - The progress bar runs while the files load: one file per saved route or SchweizMobil / My Switzerland place, and the whole type file for OpenStreetMap places and charging stations.
   - Saved routes draw exactly as in their own rows: activity color, level width and number plate. Saved places draw as their usual pins and cluster with everything else.
   - The row count turns bold; the group's badge counts the Saved rows that are on, the same as every section in the panel.
   - **With the menu closed**, the ☰ button shows the same badge, so saved items on the map are never on without a visible sign (decision 10).
5. **Filters.** Length/ascent filters (and the new difficulty/fitness filters from the route-facts plan) never hide a route shown through Saved Routes. Turning Saved Routes on doesn't open the filter boxes. This matches Favorites.
6. **Unsaving while the row is on.** The item stays on the map while its details are open (it is `selected`) and disappears when they close, unless its own row is also on.
7. **Persistence.**
   - Reload or a new tab: the counts are there straight away, before any download.
   - The Saved rows start off on every visit: the address never holds them (see the url-state interaction).
   - A save in another tab shows up here after a reload, or at this tab's next save.
8. **Storage blocked or broken.** The page works normally and Save works until the page closes; nothing is kept. Corrupt stored data is treated as an empty list and replaced at the next save.
9. **An item gone from the data** (new SchweizMobil id, OpenStreetMap point deleted): it is not counted and not drawn. No message is shown, and it stays in storage.

## Data

What identifies each kind today:

| Kind | Key (also `item.url` after this change) | Evidence |
|---|---|---|
| Route | `<activity>/<level>/<route number>.json`, e.g. `hiking/local/109.json` | `routeLayer` `public/script.js:422`. The file name is the route number, not `json.id` (`hiking/local/109.json` has `id` 801, `r_number` 109). AGENTS.md: route numbers are the ids |
| SchweizMobil / My Switzerland place | `<folder>/<id>.json`, e.g. `accommodation/hostels/964846799.json` | `placeLayer` `:461`. AGENTS.md Ids: SchweizMobil ids can change (every accommodation id had changed by Oct 2026); My Switzerland ids are 9-digit hashes |
| Hand-made sightseeing (10001+) | `other/sightseeing/10001.json` | Only in `ids/favorites/visit.json`, not in `ids/other/sightseeing.json` (all 79 hand-made ids are missing from it). They are still reachable because `buildLayers` always creates `favorites.visit` (`:409`), whatever `FAVORITES_ENABLED` is |
| OpenStreetMap place | `osm/<type>.json#<osm id>`, e.g. `osm/drinkingwater.json#node/10001260924` | Entries are `{id: "node/…"\|"way/…"\|"relation/…", coordinates, tags, name?}` (`bin/osm-downloader.js:99`). Ids are unique within each file. Today `item.url` is `osm/<type>.json#<index>` (`:903`), but files are sorted by id (`osm-downloader.js:94`), so indexes shift whenever a point is added or dropped |
| Charging station | `other/chargingstations/<file>.json#<Point.coordinates>`, e.g. `…/ebike-sockets.json#6.140000,46.194775,0` | Entries have only `name`, `description`, `Point` (no id). Today `item.url` is `<file>#<index>` over the whole file (`:880`). Inside `CHARGING_BOUNDS`, all 336 + 101 coordinate strings are unique (the one duplicate in chargingstations.json is in Austria, 14.517,48.191). Names are not unique (Braunwald-Standseilbahn AG and Bettmeralp appear twice). From the 2024-05 file (`199a7fa`) to now, 282 of 285 Swiss stations kept the exact same coordinate string |
| Uploaded GPX | none | Not saved (see Decisions) |

Two more facts:
- **One element, several types.** 275 OpenStreetMap elements appear in 2–3 type files (170 firepit+picnicsite, 89 picnicsite+picnictable, …: 55,119 entries but 54,844 distinct ids). The key includes the type file, so saving such an element is per row, matching the one-pin-per-row map.
- **Shared items.** A saved url resolves to the same item object as its own row because `files` is keyed by file url (`loadFile` `:718`). This is how Favorites avoids duplicates (`favorites.hiking` reuses the `hiking/local/…` urls).

**Stored in the browser:** localStorage key `swissroutes.saved` (namespaced because `localhost:5000` is shared with any other Firebase emulator project). Value: `{"version":1,"items":["hiking/local/109.json","osm/drinkingwater.json#node/10001260924", …]}`, keys only, in the order saved. Every read and write is wrapped in try/catch. An unknown `version` or a non-array is read as an empty list.

## Decisions

1. **Rows in the section**
   - a. Two rows, Routes and Places, mirroring Favorites' "Hikes"/"Places" (`:500-515`). You can show saved huts without route lines. **(recommended)**
   - b. One "Saved" row. One row fewer, but routes and places always come together.
   - c. A list of the saved items by name, each opening its details. Needs labels stored (decision 5b), grows long in a 312 px panel, and is clearly more code.
2. **Where the rows sit and what they show when empty**
   - a. A "Saved" group in the header menu, after Upload GPX and Remove track, always shown with the hint while empty. The panel keeps its height for map layers, and the menu is the home for the visitor's own things (their track, their list). Costs: two clicks to turn a row on, and the count change after a save is out of sight until the menu opens. **(decided)**
   - b. The two rows inside the menu as above, but turning one on also closes the menu. One click fewer when showing one row, but turning both on takes two trips.
   - c. Always shown, not collapsible, last in the layer panel, with the hint while empty (the earlier recommendation). One click and always visible, but costs about 110 px of panel height.
   - d. A list of saved items by name in the menu (decision 1c).
3. **What is drawn**
   - a. Each item with its own row's styling, as the same object its row uses. Costs nothing, and there's no duplicate pin when both rows are on. **(recommended)**
   - b. Also mark saved items everywhere (a star on pins and plates). Needs marker and plate re-styling on every save and unsave, and changes to `markerIcon`/`plate`/`styleRoute`.
4. **Filters on saved routes**
   - a. Skip them, like favorite hikes: the saved layers have no `filter`, so `matchesFilter` returns true (`:663-666`). **(recommended)**
   - b. Apply each route's own activity filters. `render` would need a per-item filter (`filters[item.type]`), and the filter boxes would have to open for the Saved row.
5. **What is stored per item**
   - a. The key only. Tiny, never out of date (label and position always come from current data), and items open with full details. Turning a row on downloads the files, up to 1.2 MB for drinking water and 1 MB for charging stations: the same cost as turning those rows on. **(recommended)**
   - b. Key plus label, kind and position. Allows option 1c, pins without downloads, and naming vanished items. Costs out-of-date snapshots, separate item objects (duplicate pins unless reconciled), and more code.
6. **A saved item that no longer exists**
   - a. Skip it and keep it in storage. Nothing is lost if a deploy briefly lacks a file or an id comes back. It is invisible clutter. **(recommended)**
   - b. Delete it from storage once it is known to be missing. Storage stays exact, but the loss can't be undone.
   - c. Show "N saved items are no longer on the map" with a Remove button. Honest, but it is more UI and can't say which items without 5b.
7. **What the row count shows**
   - a. Saved items that still exist. Routes and SchweizMobil / My Switzerland places are checked against `ids.js` at once. OpenStreetMap places and charging stations are counted until their file has loaded, after which a row that is on shows what was found. **(recommended)**
   - b. The raw number stored. Simpler, but vanished items are counted forever.
8. **Analytics**
   - a. `track("save_item" | "unsave_item", { content_type, item_id: item.label })`, the same parameters as the `share` event (`:1716`). Event names show in GA4 without custom dimensions. Turning a Saved row on already sends `layer_toggle` with `saved.routes` / `saved.places`. **(recommended)**
   - b. GA4's recommended `add_to_wishlist`. It is an e-commerce event and expects `items`/`value`.
   - c. One `save` event with a `saved: true|false` parameter. Splitting it in reports needs a custom dimension.
   - d. No event.
9. **Uploaded GPX tracks**
   - a. Out of scope: there is no file to point to, and keeping the track itself means storing up to megabytes of points against a 5 MB quota. **(recommended)**
   - b. Keep the last uploaded track in storage.
10. **Showing that Saved rows are on while the menu is closed**
   - a. A badge on the ☰ button with the number of Saved rows on (1 or 2), the same badge the sections use. Saved items on the map always have a visible cause, and the count is how every section already signals it. **(recommended)**
   - b. A small red dot on ☰, no number. Quieter, but it says less, and red is otherwise kept for the selected item and errors.
   - c. Nothing. Saved pins and lines appear with no visible row explaining them until the menu opens.

## Implementation steps

### `public/index.html`
1. Three additions:
   - `icon_names` (the Material Symbols link): add `star` between `shower` and `table_restaurant`. The font only has the listed glyphs, and Google Fonts requires the list in alphabetical order (from Google's documentation, not checked here). `location_on` is already listed.
   - In `#menu`, after `#uploadError`: `<div id="menuSaved"></div>`. `buildPanel` fills it, as it fills `#layers`.
   - In `#menuToggle`, after the icon: `<span class="badge menu-badge" id="menuBadge" hidden></span>` (decision 10a). The button's `aria-label="Menu"` stays its whole name, so the number is visual only; screen-reader users hear the count on the group heading inside the menu.

### `public/script.js`
2. `SECTION_ICONS`: add `Saved: "star",` after `Favorites`.
3. After `LOADING_RENDER_DELAY` `:320`:
   ```js
   // The visitor's saved routes and places are kept in the browser under this name. The version allows a later change of format
   const SAVED_STORAGE_KEY = "swissroutes.saved";
   const SAVED_VERSION = 1;
   ```
4. In the `let` block after `:336`:
   ```js
   // Keys of the saved items: the data file path, plus #<id> for a place inside an OpenStreetMap or charging-station file
   let saved = readSaved() ?? new Set();
   ```
   This is safe from the temporal dead zone: `buildLayers()` (`:311`) only creates closures that use `saved`, and step 3's constants come before this line.
5. `buildLayers`, after `favorites.visit` `:413`: add `layers["saved.routes"] = savedLayer("saved.routes");` and the same for `"saved.places"`. Add after `placeLayer` (`:464`):
   ```js
   // A saved row lists files of every kind: each file is built by the layer that owns it, and only its saved items are shown
   function savedLayer(row) {
     return {
       row: row,
       urls: [],
       count: 0,
       keep: (item) => saved.has(item.url),
       build: (url, json) => fileLayer(url).build(url, json),
     };
   }
   ```
6. Stable item urls:
   - `buildChargingStations` `:880`: `url: \`${url}#${entry.Point.coordinates}\``.
   - `buildOsmPlaces` `:903`: `url: \`${url}#${entry.id}\``.
   - Comment on both: the index shifts when the file is refreshed.
   - This is safe: `item.url` is otherwise read only by `copyLink` (`:1708`), which these kinds don't offer. `files` and `drawn` don't key on it.
7. `buildPanel`:
   - After `layers.innerHTML = content;`: `document.getElementById("menuSaved").innerHTML = group("Saved", savedRows(), false);`. The panel content itself gets no Saved section.
   - The `[data-layer]` click loop runs over `document.querySelectorAll("[data-layer]")` instead of `layers.querySelectorAll(…)`, so the menu's two rows are bound too. Nothing else on the page carries `data-layer`. Comment: "The Saved rows live in the header menu, outside #layers".
   - Before `updateCounts({})`, call `updateSavedLayers();`. The rows already exist at that point, and `rowTotal` already uses `layer.count`; `0 ?? …` stays 0.
   - Unchanged, and why it works: `updateCounts` fills every `[data-count]` on the page and `updateBadges` every `.group`, so the menu's group gets counts and a badge like any section. `restoreView` collects buttons page-wide, but no address key names a saved row (see the url-state interaction below).
   - `updateBadges`, after its loop (decision 10a):
     ```js
     // The Saved rows are hidden with the menu, so the menu button repeats their badge
     const savedBadge = document.querySelector("#menuSaved .badge");
     const menuBadge = document.getElementById("menuBadge");
     menuBadge.textContent = savedBadge.textContent;
     menuBadge.hidden = savedBadge.hidden;
     ```
8. `render` `:1028`, first line inside the item loop, before `count.total++`:
   ```js
   // A saved row shows only the saved items of a file, such as one fountain of the drinking water file
   if (layer.keep && !layer.keep(item)) {
     continue;
   }
   ```
9. Details actions:
   - `routeDetails` `:1361`: `shareAction(), saveAction(item), <download>, <SchweizMobil>`.
   - `placeDetails` `:1432`: `actions([shareAction(), saveAction(item), external])`.
   - `chargingStationDetails` `:1508`: `actions([saveAction(item), externalAction(…)])`.
   - `osmDetails` `:1529`: `saveAction(item)` first.
   - `uploadDetails` is unchanged.
10. After `shareAction` `:1626`:
    ```js
    function saveAction(item) {
      const isSaved = saved.has(item.url);

      return `<button type="button" class="action${isSaved ? " saved" : ""}" data-action="save"><span class="material-symbols-outlined">star</span><span class="action-label">${isSaved ? "Saved" : "Save"}</span></button>`;
    }
    ```
    The visible label changes, so there is no `aria-pressed`; a toggle's accessible name must not change while `aria-pressed` is used.
11. Details click handler `:1851`: add `} else if (action === "save") { toggleSaved(button); }`.
12. New `// Saved` section before `// Menu`:
    - `savedRows()` returns:
      - `toggleRow("saved.routes", "Routes", '<span class="swatch swatch-line"></span>', GROUP_COLORS.explore)`
      - `toggleRow("saved.places", "Places", iconSwatch("location_on"), GROUP_COLORS.explore)`
      - `'<p class="saved-empty" id="savedEmpty">Save a route or place from its details to keep it here.</p>'`
    - `readSaved()`, inside try:
      ```js
      const stored = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY));
      ```
      If `stored?.version === SAVED_VERSION` and `Array.isArray(stored.items)`, return a `new Set` of its string items; otherwise return `new Set()`. In catch, return `undefined` (blocked or corrupt). Comment: "or undefined when the browser blocks storage".
    - `writeSaved()`: `localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify({ version: SAVED_VERSION, items: [...saved] }))` in try. Catch: `console.error("Could not keep the saved list", error)`, with the comment "blocked or full storage: the list lasts until the page closes".
    - `fileLayer(url)`:
      ```js
      return Object.values(LAYERS).find((layer) => !layer.keep && layer.urls.includes(url));
      ```
      Comment: "the layer that lists a data file, or undefined when no layer does any more". It searches the Favorites layers too, which is how hand-made sightseeing resolves.
    - `updateSavedLayers()`:
      - Reset `urls = []` and `count = 0` on both saved layers.
      - For each key in `saved`, take `url = key.split("#")[0]`. If `fileLayer(url)` is undefined, skip it (decision 6a).
      - Otherwise pick `saved.routes` when `ACTIVITIES.some((activity) => url.startsWith(\`${activity.id}/\`))`, else `saved.places`. Push the url if it isn't there yet and increment `count`.
      - Finally: `document.getElementById("savedEmpty").hidden = routes.count + places.count > 0`.
    - `toggleSaved(button)`:
      1. `const item = selected; const save = !button.classList.contains("saved");`. The button's state, not the stored one, decides, so a stale tab still does what the user clicked.
      2. `saved = readSaved() ?? saved;`. Re-reading picks up other tabs' saves, so they are not overwritten.
      3. `saved.add(item.url)` or `saved.delete(item.url)`, then `writeSaved()`.
      4. `track(save ? "save_item" : "unsave_item", { content_type: contentType(item), item_id: item.label })`.
      5. Update the button in place (toggle the `saved` class and `.action-label` text) so the gallery state is kept.
      6. `setStatus(save ? "Saved" : "Removed from saved")`.
      7. `updateSavedLayers()`.
      8. For each saved layer in `activeLayers`, call `loadFile(url, layer.build)` on its urls. This is cached when already loaded, and needed for files of items saved in another tab.
      9. `scheduleRender()`, which also refreshes the counts through `updateCounts`.

### `public/style.css`
13. After `.action .material-symbols-outlined` `:574-577`:
    ```css
    .action.saved .material-symbols-outlined { color: var(--red); font-variation-settings: 'FILL' 1; }
    ```
    The FILL axis 0..1 is already loaded (`index.html:43`); the same setting is used at `:319`.
14. After `.menu .upload-error` (the `/* Panel header and menu */` block):
    - `/* Saved list */`, then `.saved-empty { margin: 4px 0 8px; color: var(--ink-soft); font-size: 12.5px; }`.
    - `.menu .group { margin-top: 8px; border-top: 1px solid var(--rule); }`, the divider between the upload entries and the group. `.group` already gives the 20 px side padding the entries use.
    - `.menu-toggle { position: relative; }` and `.menu-badge { position: absolute; top: 1px; right: 1px; }`, so the badge sits on the ☰ button's corner. `.badge` already sets its size and colors, and `.badge[hidden]` hides it.

### `AGENTS.md`
15. Ids section: add "**Saved lists:** visitors' browsers keep each saved item's data file path, plus `#<OSM id>` for OpenStreetMap places and `#<coordinates>` for charging stations (localStorage `swissroutes.saved`). A changed id or path drops the item from their list, the same way it breaks share links."

No changes in `bin/` or `ids/`.

## Interactions with the other planned features

- **Route facts and filters (`PLAN-0-route-facts.md`):** saved layers have no `filter`, so the new difficulty and fitness filters skip saved routes too (as with Favorites), and `toggleLayer`'s filter-box logic (`:620-624`) leaves them closed. Both plans edit `routeDetails`; this one only touches the `actions([...])` list (`:1360`).
- **Elevation profile (`PLAN-1-elevation-profile.md`):** no shared state. This plan leaves `uploadDetails` and `gpxData` alone. If the profile ever re-renders the details, `saveAction` reads the current state.
- **View in the address (built):**
  - Saved rows stay out of the address with no code: `writeAddress` writes `places` only for layer ids without a dot and `favorites` only for `favorites.*`, so `saved.routes` / `saved.places` are skipped, and `restoreView` never reads them. That is the wanted result: a shared link would otherwise show the recipient's own, different list.
  - Turning a Saved row on still calls `scheduleAddress()` through `toggleLayer`; the rewrite simply leaves the address as it was.
  - The stable `item.url` for OpenStreetMap places and charging stations helps if the selected item ever goes in the address.
- **Header menu (built):** the Saved group goes into `#menu`, after the upload entries. `openMenu` focuses the first visible `.menu-item` (Upload GPX), so the group's rows come later in the Tab order. `closeMenu` clears the upload error only, so turning Saved rows on and closing the menu keeps them on.
- **Languages (`PLAN-4-languages.md`):** its `rebuildPanel()` must also rebuild `#menuSaved` (this plan's `buildPanel` change does that), and restore `aria-pressed` on `[data-layer]` page-wide rather than only inside `#layers`, or the menu's rows come back unpressed after a switch. Its 8 strings for this plan are listed there.
- **Theme (`PLAN-5-theme.md`):** the filled red star uses `--red`, and the badge on ☰ uses `.badge`, so both follow the theme with no extra work.
- **Photo spots (`PLAN-0-photo-spots.md`):** independent. The Save button is updated in place without re-rendering, so the gallery and photo state isn't reset.
- **All features:** the details click chain, the `icon_names` line in index.html and the `#menu` markup are likely merge points. Keep `icon_names` alphabetical, and the menu in the order Language, Theme, Upload GPX, Remove track, Saved.

## Edge cases and risks

- **SchweizMobil ids change:** every accommodation id had changed by Oct 2026. The next such change silently empties saved SchweizMobil accommodations, as it breaks share links.
- **OpenStreetMap points can vanish:** deleted or re-created in OpenStreetMap (new id), or dropped by the 100 m de-duplication (`osm-downloader.js:59`) when SchweizMobil or My Switzerland add a nearby place. The count includes them until the row is turned on.
- **Charging stations:** a station whose coordinates are edited on the Bike Energy map drops out. The Oct 2026 refresh moved 92 of 1,411 (worldwide, per `.claude/skills/update-data/SKILL.md`); how many were in Switzerland is not checked.
- **Routes:** a route that moves to another level changes its url and drops out. Not seen so far; an assumption.
- **Download size:** one saved fountain makes Saved Places download `osm/drinkingwater.json` (1.2 MB, 15,054 items). The cost is the same as turning that row on; `render` does a Set lookup per item.
- **Crafted share links:** a `?url=` outside every layer could be saved but is then never counted. Not guarded, because `cleanup.js` deletes unlisted files.
- **Several tabs:** no live sync (no `storage` listener). The re-read before each write prevents lost updates, but counts in other tabs are stale until the next save or reload.
- **Storage:** blocked storage gives a list for the session only, with no notice. An unknown `version` (only possible after rolling the site back) is read as empty and overwritten at the next save.
- **Actions row width:** the route actions row (Copy link, Save, Download GPX, SchweizMobil) wraps to two lines in the 340 px body. Check it visually; the other plans may add more.
- **Out of sight in the menu:** after a save, the count change only shows when the menu is next opened, and a visitor may not know where saved items went. The empty-state hint is also inside the menu, so a visitor who never opens ☰ never sees it. The ☰ badge (decision 10a) only appears once a row is on.

## Verification

Run `scripts/serve.sh` and open http://localhost:5000 with DevTools open.

1. The layer panel has no Saved section. Open ☰: below Upload GPX there is a divider and a "Saved" group with a star icon, rows Routes `0` and Places `0`, and the hint. The star glyph renders (not the word "star").
2. Hiking > Local on, open a route. Actions are Copy link, Save, Download GPX, SchweizMobil. Click Save: the star fills red and the label reads "Saved". Open ☰: Saved Routes shows `1` and the hint is hidden. Application > Local Storage shows `swissroutes.saved = {"version":1,"items":["hiking/local/<n>.json"]}`.
3. Hiking Local off; in the menu, Saved Routes on: the menu stays open and only that route is drawn (red, local width, plate). The count is bold `1`, the group's badge is `1`, and no filter box appears. Close the menu: ☰ shows a `1` badge. Turn Saved Places on as well: both badges show `2`. Turn both off: both badges disappear.
4. Hiking Local on with Length min `500`: the hiking row shows `0 of 274` and the saved route still shows.
5. Save a SchweizMobil campsite, a My Switzerland hostel, an OpenStreetMap drinking-water point (Save comes before the OpenStreetMap link) and a charging station (Save comes before Google Maps). Places shows `4`. Keys look like `osm/drinkingwater.json#node/…` and `other/chargingstations/chargingstations.json#<lng>,<lat>,0`.
6. Reload: counts are 1 and 4 before any data request. Places on: exactly 4 pins. Network shows `drinkingwater.json` and `chargingstations.json`. Each pin opens details showing "Saved".
7. Also turn the Drinking water row on and zoom to the saved fountain: there is one pin, not two.
8. With Saved Places on, unsave an open place: it stays until the details close, then disappears and the count drops.
9. Open `?url=hiking/local/109.json&type=hiking`, then Save: it works. With `?favorites=1`, save hand-made sightseeing 10001; reload without the parameter: it shows under Saved Places.
10. In the console, run `localStorage.setItem("swissroutes.saved", JSON.stringify({version:1,items:["accommodation/camping/1.json","osm/drinkingwater.json#node/1","hiking/local/109.json"]}))` and reload. Routes `1`, Places `1`. Places on gives `0`, nothing drawn, no errors, storage unchanged.
11. Run `localStorage.setItem("swissroutes.saved", "{")` and reload: the page works with an empty list. Save once: the value becomes valid JSON.
12. Chrome Settings > Site settings > "Not allowed to save data": add `localhost:5000` and reload. The page loads and Save toggles; after a reload the list is empty. Only console errors on writes.
13. Two tabs: save X in A, then Y in B (opened before X). Reload: both are listed.
14. Upload a GPX: its details show only Remove.
15. Network filter `collect`: `en=save_item` / `unsave_item` with `ep.content_type` and `ep.item_id`. Assumption: Analytics sends from localhost; otherwise use GA4 DebugView.
16. Keyboard: Tab to Save, press Enter. A screen reader announces "Saved" / "Removed from saved". Open ☰ with Enter, Tab to Saved Routes, press Enter: it turns on and focus stays on it.
17. Saved Routes on: the address bar gains no saved key. Reload: both Saved rows are off and ☰ has no badge.

## Out of scope

- Uploaded GPX tracks.
- Export/import and sync across devices.
- A list of saved items by name.
- Live sync between tabs (`storage` event).
- Marking saved items in their own rows.
- Notes or folders.
- Telling the user about vanished items, or relinking items whose ids changed.
