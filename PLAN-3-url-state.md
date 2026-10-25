# View kept in the address

**Goal**: The address always describes the current view: rows on, route levels, filters, the open item, map position and map type. A reload brings the view back, and the address can be copied and shared. Old `?url=&type=` and `?favorites=1` links keep working.

## What the user sees

1. **Plain visit to `/`.** Nothing changes. The address stays `/` until the user does something (D4).
2. **Each change rewrites the address in place**, about 0.3 s after it happens. No Back step is added (D3).
   - Hiking National + Regional on → `?hiking=national,regional`
   - Camping and Drinking water on → `&places=camping,drinkingwater`
   - Hiking length max 15 → `&hiking.length=-15`. A filter is kept only while one of its activity's levels is on, the same rule that shows the filter box (script.js:620–624). Turning every hiking level off drops it.
   - The map stops after a pan or zoom → `&map=46.68631,7.86325,12`
   - Terrain or Satellite → `&maptype=terrain` or `&maptype=hybrid`. Going back to Map removes it.
   - Opening a route or a SchweizMobil / My Switzerland place → `url=…&type=…`. Closing it removes them, unless it is a shared item that is still on the map (D5).
   - OpenStreetMap places, charging stations and an uploaded GPX track have no Copy link today, and they are not kept either. While one of them is open, the address holds no item (or still holds the shared item that is on the map).
3. **Reload, or opening a copied address.**
   - The rows come back on: chips and toggles are pressed, and section badges count them. Sections stay collapsed.
   - Filter boxes are visible with their values filled in.
   - The map opens at the same position and type, and the item's details open.
   - The progress bar runs once for all the files. The item's file is first in the download queue, so its details open before the rows finish loading.
   - No `layer_toggle` events are sent.
4. **An item opened from the address follows today's shared-link rule.** It stays on the map, even when its row is off, until a row is toggled or a filter changes (script.js:617, 643). If the address has a `map` position, the map stays there instead of zooming to the item.
5. **Old links** such as `?url=hiking%2Flocal%2F101.json&type=hiking` behave exactly as today: the details open and the map zooms to the item. The first change rewrites them in the new form.
6. **Invalid or unknown values.**
   - Invalid values are ignored one by one: `places=nope,camping` still turns Camping on. The next write leaves the invalid parts out.
   - Keys the site doesn't own (`utm_source`, `fbclid`, …) are left as they are.
7. **Back** leaves the site, as today.
8. **Copy link** is unchanged and copies the item only (D6). To share the whole view, the user copies the address bar.
9. **Windows narrower than 1024 px** (behind the "desktop only" notice): rows are not restored and the address is never rewritten (D8).
10. **`?favorites=1`** survives every rewrite. The Favorites rows are kept as `favorites=hiking,visit`.

## Address format

The state goes in the query string (D1). Keys are row and level ids taken from the code, never indexes or panel positions, so adding rows doesn't break old links.

| Key | Value | Example | Written when |
| :-- | :-- | :-- | :-- |
| `url`, `type` | Same as today: data file path, plus activity id or place icon | `url=hiking/local/101.json&type=hiking` | A route or SchweizMobil / My Switzerland place is open; otherwise a shared item is still on the map (D5) |
| `hiking`, `cycling`, `mountainbiking` | Levels on, out of `national,regional,local`, written in `LEVELS` order | `hiking=national,local` | At least one level of the activity is on |
| `<activity>.length` | km as `min-max`; either side may be empty | `hiking.length=5-20`, `-15`, `10-` | The activity has a level on and a bound above 0 |
| `<activity>.ascent` | m, same format (inputs `filter-<activity>-climbMin/Max`) | `cycling.ascent=-800` | Same |
| `<activity>.<filter>` | Reserved for the route-facts filters (`PLAN-2-route-facts.md`) | `hiking.difficulty=easy,medium`, `hiking.fitness=easy` | Decided by that plan |
| `places` | Place row ids: `LAYERS` keys without a dot (`PLACES` ids, OpenStreetMap types), in definition order, not panel order | `places=camping,chargingstation,drinkingwater` | At least one place row is on |
| `favorites` | Section flag: `1`, or the Favorites rows that are on (`hiking`, `visit`) | `favorites=1`, `favorites=hiking,visit` | `FAVORITES_ENABLED` is true |
| `map` | `lat,lng,zoom`: 5 decimals (about 1 m), zoom with up to 2 decimals | `map=46.68631,7.86325,12` | The view differs from the opening view, or the address came with a position (D4) |
| `maptype` | `terrain` or `hybrid` (the `data-map-type` values; `roadmap` is the default and is left out) | `maptype=hybrid` | The map type is not roadmap |

Rules:
- **Owned keys** are `url`, `type`, `places`, `favorites`, `map`, `maptype`, each activity id, and any key starting with `<activity>.`. Every write deletes and rewrites the owned keys and leaves all other keys untouched.
- **Fixed write order:** keys the site doesn't own first, then `url`, `type`, each activity (its levels, then its filters), `places`, `favorites`, `map`, `maptype`. The same view always gives the same address. `places` uses definition order, so a data refresh that reorders the panel by count doesn't change addresses.
- **Commas and slashes are written raw.** `URLSearchParams.toString()` would turn them into `%2C` and `%2F`; the writer turns those back. Reading uses `URLSearchParams`, so both forms read the same, including today's `%2F` links. This is lossless: a literal `%2C` inside a value is written as `%252C`, which the replacement doesn't touch.
- **Reading:** when a key appears twice, the first value wins. Each list item is checked on its own.

Examples (the ids are real):
- `https://swiss-routes.web.app/?hiking=national,regional&hiking.length=-15&places=camping,drinkingwater&map=46.68631,7.86325,12&maptype=terrain`
- `https://swiss-routes.web.app/?url=accommodation/camping/100096153.json&type=camping&places=camping&map=46.53,8.95,13` (TCS Camping Olivone)
- Still valid: `https://swiss-routes.web.app/?url=hiking%2Flocal%2F101.json&type=hiking` and `?favorites=1`

**Length.** Typical addresses are 100–200 characters. With every row and every filter on, an address is about 850 characters; adding the two route-facts filters on all three activities brings it to about 1,050 (computed from the current row ids). Browsers and Firebase Hosting accept much longer addresses. The only nearby limit is GA4's `page_location`, which is believed to be cut at 1,000 characters (assumption, not checked), and only extreme views reach it. No shortening is needed.

## Decisions

**D1. Where the state lives**
- **Query string (recommended).** Same place as today's `url`, `type` and `favorites`, one parser (`PARAMS`), and old links need no translation.
- Hash (`#hiking=…`), as OpenStreetMap does. It is never sent to the server, but the code would read two places, because old links stay in the query.

**D2. Row keys**
- **One key per activity, plus `places` and `favorites` (recommended).** Shortest and most readable (`hiking=national,regional`), and each key means one thing.
- One list of `LAYERS` ids (`rows=hiking.national,hiking.regional,camping`). A few lines less code, but longer and harder to read.

**D3. History**
- **`replaceState` for every change (recommended).** Back leaves the site as today, and no popstate code is needed.
- `pushState` for row and item changes, so Back undoes a step. This needs a popstate handler that compares and re-applies the whole view (rows off, details closed), and map moves would still have to use replace.

**D4. Map position on a plain visit**
- **Leave `map` out while the map is still at its opening view (recommended).** A plain visit keeps the address `/`, and a homepage address copied from the bar still fits Switzerland to the recipient's window. `INITIAL_VIEW` gives zoom 9 at 1920×1080 and one step less on smaller windows (script.js:3). Costs about 6 lines.
- Always write `map` on every idle. Simplest and the way Google Maps works, but every visit gets a position tied to that screen size.

**D5. Which item goes in the address**
- **The open details; failing that, the shared item still on the map (recommended).** If the user closes a shared item's details and then reloads, the item stays on the map. Its details reopen, because the address can't say "closed".
- Only the open details. A reload after closing drops the shared item, so the map changes on reload.

**D6. Copy link**
- **Item only, unchanged (recommended).** The link stays short, the recipient sees one item zoomed in, the sender's rows aren't downloaded by surprise, and the favorites flag doesn't leak. The whole view is in the address bar.
- The whole view (`location.href`). One button for everything, but links get long and the recipient downloads every row the sender had on.

**D7. `?favorites=0` (your call)**
- Keep "any non-empty value turns it on". Nothing changes; the writer then turns `0` into `favorites=1`.
- **Treat `0` as off (recommended).** A one-line change at index.html:54; the writer then removes the key. No other link changes meaning.

**D8. Small screens (under 1024 px, style.css:895)**
- **Don't restore rows and don't rewrite the address (recommended).** Otherwise a phone opening a shared view could download up to about 168 MB behind the "desktop only" notice. The address stays intact for a later desktop visit. The shared item still loads one file, as today.
- Restore anyway. No extra code.

**D9. `select_content` source when the address opens an item**
- **Report `reload` when the navigation was a reload or Back/Forward (`performance.getEntriesByType("navigation")[0].type`), otherwise `shared_link` (recommended).** Reloads stop inflating shared-link opens; bookmarks still count as shared links.
- Always `shared_link`. No change, but every reload with an open item counts as a shared link opened.

## Implementation steps

### public/index.html
1. **index.html:54 (D7):** `const FAVORITES_ENABLED = !!PARAMS.get('favorites') && PARAMS.get('favorites') !== '0'`. The rest of the inline script (lines 52–62) stays as it is. script.js keeps reading `PARAMS`, `PARAM_URL` and `PARAM_TYPE` once, at load. `replaceState` never updates them, so no code may read them later expecting the current state.

### public/script.js
Follow the file's style: double quotes, braces on every `if`, Prettier-style trailing commas, short comments that explain why.

2. **Constants**, after `LOADING_RENDER_DELAY` (script.js:320):
   ```js
   // The address is rewritten this long after the last change
   const ADDRESS_DELAY = 300;

   // Route filters kept in the address as <activity>.<key>=<min>-<max>, by the name of their inputs (see rangeFilter)
   const ADDRESS_RANGES = { length: "length", ascent: "climb" };

   // Besides one key per activity and <activity>.<filter>, the address owns these. Other keys, like campaign tags, are left alone
   const ADDRESS_KEYS = ["url", "type", "places", "favorites", "map", "maptype"];

   // Below this width (style.css) the panels are hidden behind a notice, so the address's rows are not restored
   const SMALL_SCREEN = matchMedia("(max-width: 1023.98px)").matches;

   // The map position the address opened with, or undefined
   const ADDRESS_POSITION = readPosition();
   ```
   Calling `readPosition` at the top level works because function declarations are hoisted; `LAYERS = buildLayers()` at line 311 already relies on this.

3. **State**, after `downloadsActive` (script.js:336):
   ```js
   let addressTimeout = undefined;
   // While the map shows the view it opened with, the position stays out of the address. Empty when the address gave a position (then it is always kept); undefined until the map first settles
   let openingPosition = ADDRESS_POSITION ? "" : undefined;
   ```

4. **`mapLoaded` (script.js:345–368):**
   - Map options at 347–351: `center: ADDRESS_POSITION?.center ?? { lat: 46.75, lng: 8.1 }` and `zoom: ADDRESS_POSITION?.zoom ?? 8`.
   - Line 358: `if (!ADDRESS_POSITION) { map.fitBounds(INITIAL_VIEW, 0); }`
   - After line 360:
     ```js
     google.maps.event.addListenerOnce(map, "idle", () => {
       openingPosition ??= mapPosition();
       map.addListener("idle", scheduleAddress);
     });
     ```
     The first idle never writes; it only records the opening view.
   - Lines 362–367: `buildPanel()`, `bindControls()`, then the existing `openSharedItem` call, so the item's file goes into `downloadQueue` first, then `if (!SMALL_SCREEN) { restoreView(); }`.

5. **`toggleLayer` (598–627):** split it without changing what a click does.
   - `setLayer(button, active)`: lines 602–615 without the `track` call (aria-pressed, add to or delete from `activeLayers`, `loadFile` for each url). Comment: rows restored from the address go only through here, so they are not reported as clicks and don't clear the shared item.
   - `layersChanged()`: lines 618–626 (`updateBadges`, the filters' `hidden` loop, `scheduleRender`).
   - `toggleLayer` becomes: work out `id` and `active`, `setLayer(button, active)`, `if (active) { track("layer_toggle", { layer: id }); }`, `sharedItem = undefined`, `layersChanged()`, `scheduleAddress()`.

6. **`onFilterChange` (642–646):** add `scheduleAddress();`. This also covers the route-facts filters, because `buildPanel` binds every `input` and `select` in the panel to this handler (script.js:526).

7. **`selectItem` and `closeDetails`:** add `scheduleAddress();` after `render()` at 1271 and at 1294. `closeDetails` covers the Close button, Escape, a map click and `removeUpload`.

8. **`openSharedItem` (1297–1309):**
   - Line 1304: `selectItem(items[0], linkSource())` (D9).
   - Line 1305: wrap the fit in `if (!ADDRESS_POSITION) { map.fitBounds(items[0].bounds, mapPadding()); }`.

9. **`bindControls`, map type buttons (1796–1806):** the click handler becomes `setMapType(button.dataset.mapType); scheduleAddress();`. Add `setMapType(type)` after `bindControls`: it calls `map.setMapTypeId(type)` and sets aria-pressed on every `[data-map-type]` button (the loop now at 1802–1804).

10. **New `// Address` section before `// Analytics` (2142):**
    - `readPosition()`: match `PARAMS.get("map")` against `/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/`. Return `{ center: point(lat, lng), zoom }` only if |lat| ≤ 85, |lng| ≤ 180 and zoom ≤ 22; otherwise `undefined`.
    - `mapPosition()`: `` `${Number(c.lat().toFixed(5))},${Number(c.lng().toFixed(5))},${Number(map.getZoom().toFixed(2))}` ``. Zoom may be fractional if the map renders as vector (`drawPins` already rounds it at 1127; not checked).
    - `addressList(key)`: `(PARAMS.get(key) ?? "").split(",").filter(Boolean)`.
    - `addressItem()`: return `selected` if `selected?.kind` is `"route"` or `"place"`, otherwise `sharedItem`. Those two kinds are exactly the ones that show `shareAction()` (1361, 1432) and that `sharedItemBuilder` can rebuild.
    - `scheduleAddress()`: return if `SMALL_SCREEN`; otherwise `clearTimeout(addressTimeout); addressTimeout = setTimeout(writeAddress, ADDRESS_DELAY);`.
    - `restoreView()`:
      ```js
      const buttons = new Map([...document.querySelectorAll("[data-layer]")].map((button) => [button.dataset.layer, button]));
      const rows = [
        ...ACTIVITIES.flatMap((activity) => addressList(activity.id).map((level) => `${activity.id}.${level}`)),
        ...addressList("places").filter((id) => !id.includes(".")),
        ...addressList("favorites").map((id) => `favorites.${id}`),
      ];

      // A row the panel lacks (a favorite without ?favorites=1, a row removed since) is skipped
      for (const id of rows) {
        const button = buttons.get(id);
        if (button && !activeLayers.has(id)) {
          setLayer(button, true);
        }
      }
      ```
      Then, for each activity and each `ADDRESS_RANGES` entry: if `PARAMS.get(`${activity.id}.${key}`)` matches `/^(\d*)-(\d*)$/`, set the `…Min` and `…Max` input values. Setting `.value` fires no `input` event, so the shared item is kept.
      Then: if `PARAMS.get("maptype")` equals some button's `dataset.mapType`, call `setMapType` with it. Compare against the button values; never put the raw value into a selector.
      Finally `layersChanged()`.
    - `writeAddress()`:
      ```js
      const params = new URLSearchParams(location.search);
      for (const key of [...params.keys()]) {
        if (ADDRESS_KEYS.includes(key) || ACTIVITIES.some((a) => key === a.id || key.startsWith(`${a.id}.`))) {
          params.delete(key);
        }
      }
      ```
      Then `set` the keys in the order from the format section:
      - `url` and `type` from `addressItem()`.
      - For each activity with at least one level in `activeLayers`: its levels, and each range where `min > 0 || max > 0`, written as `` `${min > 0 ? min : ""}-${max > 0 ? max : ""}` `` from `readInt`. Zero and negative bounds filter nothing (`inRange`, 674).
      - `places`: `Object.keys(LAYERS)` that are active and have no dot.
      - If `FAVORITES_ENABLED`: `favorites` = the active `favorites.*` ids without the prefix, or `"1"`.
      - If `openingPosition !== undefined` and `mapPosition() !== openingPosition`: `map`.
      - If `map.getMapTypeId() !== "roadmap"`: `maptype`.

      Then:
      ```js
      // Commas and slashes mean nothing in a query, so they stay readable
      const search = params.toString().replace(/%2C/g, ",").replace(/%2F/g, "/");
      const address = search ? `${location.pathname}?${search}` : location.pathname;
      if (address !== location.pathname + location.search) {
        history.replaceState(history.state, "", address + location.hash);
      }
      ```

11. **Analytics section (2142–2152):** add `linkSource()` (D9), which returns `"reload"` when the navigation type is `reload` or `back_forward`, and `"shared_link"` otherwise.

Unchanged: `copyLink` (1707), the download queue (755–774), the progress bar (776–794), style.css and firebase.json.

### AGENTS.md
12. After line 82, add: "Addresses also hold activity, level and row ids (`hiking=national`, `places=camping,drinkingwater`) and the map type, so renaming an activity, a level, a `PLACES` id or an OpenStreetMap type breaks that part of old addresses."

## Interactions with the other planned features

- **Route facts and filters (`PLAN-2-route-facts.md`)**
  - Use the reserved `<activity>.difficulty` and `<activity>.fitness` keys, with comma-separated values from the data. The values found are `category_grade` / `category_condition` = `easy`, `medium`, `difficult`. `category_grade` is null on all 128 cycling routes, so cycling probably gets no difficulty key.
  - The `<activity>.` prefix already makes these keys owned, and invalid values are skipped.
  - Its controls are chip buttons (`data-grade-filter="<activity>-grade"` or `"<activity>-fitness"`, `data-grade="<id>"`, `aria-pressed`), not inputs. Their clicks call `onFilterChange`, so `scheduleAddress` fires with no extra hook.
  - `writeAddress` adds one loop next to the `ADDRESS_RANGES` one: `<activity>.difficulty` from the pressed `-grade` chips and `<activity>.fitness` from the `-fitness` chips, as their `data-grade` ids.
  - `restoreView` sets `aria-pressed="true"` on each matching chip before `layersChanged()`. Setting the attribute fires no event, so the shared item is kept. Values with no chip (any cycling `difficulty`) are skipped.
  - It relies on that plan's `updateBadges` fix, or restored chips would light the Routes badge.
  - Whichever feature ships second adds these loops.
- **Elevation profile (`PLAN-4-elevation-profile.md`)**
  - Adds no address state.
  - On reload, the restored item's details render as they do on a click, so the profile shows.
  - If it loads extra files through `loadFile` / `fetchJson`, they wait behind the restored rows in the queue (first in, first out), so the profile appears late on a heavy reload.
- **Saved list (`PLAN-1-saved-list.md`)**
  - The saved list lives in the browser, not in the address: a recipient doesn't have the sender's list.
  - Its rows have dotted ids (`saved.routes`, `saved.places`), so `places`, which only takes ids without a dot, never picks them up.
  - It must not use the `favorites` or `places` keys, and must not reuse the hand-made Favorites section, which stays behind `?favorites=1`.
- **Photo spots (`PLAN-0-photo-spots.md`)**
  - On reload the item reopens, so its photo spots show.
  - When a spot is clicked, `selected` should stay the route and the gallery should open at that photo. If spots become selectable items of a new kind, `addressItem()` drops `url` and `type` while one is open.
  - The photo index is not kept.

## Edge cases and risks

- **GA4 page views on every rewrite (assumption, not checked).** GA4 web streams usually have "Page changes based on browser history events" turned on, which can send a `page_view` on every `replaceState`, so every map pan would count as a page view. Check with Verification step 15. If it happens, turn the setting off: GA4 Admin → Data streams → web stream → Enhanced measurement → Page views → advanced settings. No code change. Keeping foreign keys also keeps `utm_*` and `gclid` for the first page_view.
- **Heavy shared views.** Every row on means about 3,850 files and about 168 MB uncompressed: routes are 786 files / 158.5 MB (hiking national alone is 7 files / 14.8 MB), places 3,041 files / 3 MB, OpenStreetMap 25 files / 5 MB, charging 2 files / 1.1 MB. That is the same as clicking every row today. The queue still runs at most 100 at once (`MAX_DOWNLOADS`, 314), and the progress bar makes one run because `progressTotal` adds up across rows. No change is needed there. The item's file goes first, so its details aren't delayed. The plan assumes Firebase Hosting compresses JSON on the wire (not checked).
- **Safari limit on `replaceState`.** Safari throws if `replaceState` is called too often, about 100 times per 30 s (from memory, not checked). The 300 ms debounce and the skip-when-unchanged check keep the site well below that, and an error would only abort that one timer callback.
- **The item's file arriving after the user's first action.** If the user acts before the shared item's file arrives, one write briefly leaves out `url` and `type`; the item's `selectItem` puts them back. The file is first in the queue, so this window is short.
- **A non-linkable item opened while a shared item is on the map.** If the user opens an OpenStreetMap place while a shared item is still on the map, the address keeps the shared item, and a reload reopens that one instead.
- **Data ids change.** AGENTS.md notes that every accommodation id changed by October 2026. Item links break when that happens, as they do today. Row and level ids come from code and stay stable unless someone renames them (step 12).
- **Filters of an activity with no level on are not kept.** In the session they come back when a level is turned back on; after a reload they are gone.
- **Panel sections are not kept open.** They restore collapsed; the badges show what's on.
- **Focus.** A reload with an item moves focus to the details' Close button, as a shared link does today (1269).
- **The first write cleans the address.** It turns `%2F` into `/`, drops invalid owned values and keeps foreign keys. Two tabs keep separate addresses.

## Verification

Run `scripts/serve.sh` and open http://localhost:5000 in a desktop window at least 1024 px wide, with ad blockers off for the analytics checks. Top-level `let` and `const` values (`activeLayers`, `downloadsActive`, `downloadQueue`, `sharedItem`) can be read in the DevTools console.

1. Open `/` and wait: the address stays `/`. Zoom in once: `?map=…` appears about 0.3 s after the map stops.
2. Turn on Hiking National and Regional → `?hiking=national,regional`. Turn on Camping and Drinking water → `&places=camping,drinkingwater`, in that order whichever is clicked first.
3. Enter Hiking length max 15 → `hiking.length=-15`. Turn off both hiking levels → the filter key disappears.
4. Terrain → `maptype=terrain`. Satellite → `hybrid`. Map → the key is removed.
5. Open a route → `url=hiking/national/1.json&type=hiking` (or the route's own file). Close it → `url` and `type` are removed.
6. Reload with all of the above:
   - Chips and toggles are pressed, the Routes and Stay badges are right, the hiking filter box is visible with 15, the position and type match, and the details reopen.
   - The progress bar runs once.
   - In Network, filter `collect` and check the payloads: no `en=layer_toggle`, and `select_content` arrives with source `reload` (D9).
7. Reload `/?hiking=national,regional,local&mountainbiking=local&places=sightseeing,grouphouse,bnb&url=hiking/local/101.json&type=hiking`:
   - `data/hiking/local/101.json` is the first data request in the waterfall.
   - While loading, `downloadsActive` stays at 100 or below and `downloadQueue.length` goes down.
   - The details open before the bar finishes.
8. Old link `/?url=hiking%2Flocal%2F101.json&type=hiking`: the route opens and the map zooms to it. Close it: it stays on the map, and `sharedItem` is set. Toggle any row: once the details are closed, the route disappears and `url`/`type` leave the address.
9. Old link plus `&map=46.5,7.5,10`: the details open and the map stays at 46.5, 7.5, zoom 10.
10. `/?url=accommodation/camping/100096153.json&type=camping`: TCS Camping Olivone opens.
11. `/?hiking=foo,local&places=nope,camping,hiking.national&hiking.length=abc&map=999,1,2&maptype=space&utm_source=test`:
    - Only Hiking Local and Camping come on; the map uses the default fit and roadmap.
    - After the next change the address is `?utm_source=test&hiking=local&places=camping…`.
12. Favorites:
    - `/?favorites=1`: the section shows. Turn on Hikes → `favorites=hiking`. Reload → it is still on.
    - `/?hiking=local` without the flag: no Favorites section, and `favorites=` is never written.
    - `/?favorites=0`: off if D7 is taken, on otherwise.
13. With rows on and a route open, Copy link: the clipboard holds only `?url=…&type=…`.
14. Make several changes, then press Back: the browser leaves the site with no steps inside it. Open an OpenStreetMap drinking-water pin and upload a GPX: neither puts `url` in the address.
15. Pan the map five times and watch the Network `collect` requests. If any `en=page_view` follows the first one, apply the GA4 setting from the risks section.
16. In a window under 1024 px, open `/?hiking=local`: the notice shows, `activeLayers.size === 0`, there are no route requests, and the address is unchanged.

## Out of scope

- Back/Forward stepping through views (popstate).
- A separate "Share view" button, and short links.
- Keeping uploaded GPX tracks, OpenStreetMap or charging-station items, the gallery photo index, or which panel sections are open.
- The GA4 admin setting itself (a manual step in the GA4 console if step 15 shows the problem).
- The saved list in the address.
- Any change to the download queue or the progress bar.
