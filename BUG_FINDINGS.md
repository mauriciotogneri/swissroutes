### [a/performance-and-scaling/layer-loading/abandoned-downloads-delay-new-pins] Downloads for rows already turned off are never cancelled, so a newly turned-on row's pins wait behind them

- **Location:** `public/script.js:872`. Related: `public/script.js:835-863`, `public/script.js:1137-1149`, `public/script.js:254-255`
- **Severity:** Low
- **Confidence:** Medium
- **Likelihood:** Low. It needs a large route row abandoned mid-download, a slow connection, and then a place row.
- **Defect:**
  - Markers regroup only once every queued download has finished, which the code intends.
  - But the queue is first-in, first-out, and it keeps downloads for rows the visitor has already turned off.
  - So Camping, turned on right after abandoning Hiking local, waits behind up to 274 files (about 29 MB) before its pins appear, unless the visitor toggles a row, changes a filter or selects something.
- **Trigger:** on a slow connection, turn on Hiking local, turn it off at once, then turn on Camping.
- **Evidence / verification:**
  - `scheduleLoadingRender` calls `render(false)` while the progress total is above 0, and `render(false)` skips `setPoints` and `drawPins`.
  - `nextDownload` has no cancellation.
  - Refutation attempt: keeping the files may be deliberate, so they are ready if the row is turned back on. Even so, they hold up the rows that are on.
- **Suggested fix:** take queued downloads of rows that are off out of the queue, or regroup once the active place rows have loaded.

### [b/validation-and-coercion/route-filters/negative-max-hides-all-routes] A negative Max hides every route, but the address leaves it out

- **Location:** `public/script.js:790`. Related: `public/script.js:786-797`, `public/script.js:3466-3474`, `public/script.js:3845-3849`, `public/script.js:655-657`
- **Severity:** Low
- **Confidence:** High
- **Likelihood:** Low. Someone has to type a negative bound.
- **Defect:**
  - The range check treats a negative Max as a real bound, so "-5" hides every route of that activity ("0 of N").
  - The address writer leaves negative and zero bounds out ("Zero and negative bounds filter nothing"), and the restore only accepts digits. A reload or a copied link therefore shows every route.
  - The same applies to "1e3", which `parseInt` reads as 1.
- **Trigger:** type "-5" into a Length or Ascent Max box. `min="0"` only marks the box invalid, and its value stays "-5".
- **Evidence / verification:** `if (max && value > max) return false` holds for every route when Max is -5, while the address code tests `max > 0`. The plan for the address feature assumed both behave the same.
- **Suggested fix:** in `inRange`, treat bounds that are not finite or are ≤ 0 as no bound, matching the address rule, and parse with `Number`.

### [b/validation-and-coercion/gpx-upload/file-encoding-ignored] Uploaded GPX files in another encoding lose their accented characters

- **Location:** `public/script.js:3056`
- **Severity:** Low
- **Confidence:** Medium
- **Likelihood:** Low. Most exporters write UTF-8.
- **Defect:**
  - `file.text()` always decodes as UTF-8, and parsing an already-decoded string ignores the declared encoding.
  - A Latin-1 file's track name "Zürich" shows as "Z�rich"; the track itself loads fine.
  - A UTF-16 file is rejected as not a GPX file.
- **Trigger:** upload a GPX with `encoding="ISO-8859-1"` and an accented name.
- **Evidence / verification:** the file is read with `file.text()` and parsed with `parseFromString`.
- **Suggested fix:** read the bytes, pick a `TextDecoder` from the declared encoding or the byte-order mark, then parse.

### [b/validation-and-coercion/gpx-upload/prefixed-namespace-not-matched] GPX files that use a namespace prefix are rejected

- **Location:** `public/script.js:3093`. Related: `public/script.js:3087-3089`, `public/script.js:3094-3097`, `public/script.js:3114`
- **Severity:** Low
- **Confidence:** Medium
- **Likelihood:** Low. Prefixed GPX files are valid but very rare.
- **Defect:** the root check compares `localName`, so `<gpx:gpx>` passes. The track lookups match the full prefixed name, though, so `<gpx:trk>` is never found, and the file is rejected as having no track.
- **Trigger:** upload `<gpx:gpx xmlns:gpx="http://www.topografix.com/GPX/1/1"><gpx:trk>…`.
- **Evidence / verification:** `getElementsByTagName` matches qualified names in XML documents, while the root check uses `localName`.
- **Suggested fix:** use `getElementsByTagNameNS("*", …)` for the track, segment, point, height and route lookups.

### [b/contract-mismatches/update-data-procedure/osm-error-search-matches-retries] The update-data check for the OpenStreetMap step reports successful retries as failures

- **Location:** `.claude/skills/update-data/SKILL.md:203`. Related: `bin/helpers.js:201`, `.claude/skills/update-data/SKILL.md:210`
- **Severity:** Low
- **Confidence:** High
- **Likelihood:** Low. It needs an Overpass retry during a data refresh.
- **Defect:**
  - The step 3b check `grep -nE '^Error|…'` matches the `Error: HTTP 429` (or 500 or 504) line that `getFile` prints right after `Retrying: <url>`, even when the retry succeeds.
  - A recovered run is judged failed, and the skill says to wait and rerun, which wastes about 3 minutes.
  - Steps 1 to 3 avoid this with the narrower `^Error (downloading file|getting ids):`.
- **Trigger:** any Overpass retry during `node bin/osm-downloader.js`.
- **Evidence / verification:** the committed logs show the two-line retry format (`Retrying: …`, then `Error: HTTP 500`), and the OpenStreetMap downloader uses the same `getFile`.
- **Suggested fix:** drop the bare `^Error`, and match only the thrown messages (`NO ENTRIES FOUND`, `OVERPASS REMARK`) and stack lines.

### [b/contract-mismatches/update-data-procedure/empty-my-switzerland-layer-misdescribed] The update-data skill says an empty My Switzerland layer doesn't stop the script, but it does

- **Location:** `.claude/skills/update-data/SKILL.md:183`. Related: `bin/helpers.js:283-285`
- **Severity:** Low
- **Confidence:** High
- **Likelihood:** Low. It needs My Switzerland to change its category ids.
- **Defect:**
  - The skill says an empty My Switzerland layer "doesn't stop the script", and that check 1 then shows hostels, B&Bs or group houses at "-> 0".
  - The code throws `NO PLACES FOUND`, which stops the script before that list is written. The later layers aren't downloaded either, so the expected "-> 0" never appears.
  - The only rule that matches the resulting stack trace, "rerun until it finishes cleanly", can never succeed.
- **Trigger:** a My Switzerland category id change.
- **Evidence / verification:** `downloadPois` throws on an empty result before writing anything. The throw predates the last edits to that part of the skill.
- **Suggested fix:** describe the `NO PLACES FOUND` stack trace, and point to the category-id fix instead of a rerun.

### [b/contract-mismatches/place-details/tel-link-keeps-trunk-zero] Phone links of SchweizMobil places keep the "(0)"

- **Location:** `public/script.js:1686`
- **Severity:** Low
- **Confidence:** Medium
- **Likelihood:** Low. 950 places have such a number, but the site only runs on screens 1024 px and wider, where people seldom use phone links.
- **Defect:** "+41 (0)81 422 12 29" becomes `tel:+41(0)814221229`. Brackets are only visual separators in a phone link, so the number dialled is +41 0 81…, keeping the trunk 0 that international dialling must drop.
- **Trigger:** click the phone link of a place such as backpacker 36612.
- **Evidence / verification:**
  - 950 files have this form: 532 sightseeing places, 219 mountain huts, 70 campsites, 50 backpackers, 45 farm stays and 34 sleeping-in-straw places.
  - The downloader only trims the value, and the site strips only whitespace.
  - Remaining assumption: some diallers or carriers tolerate the extra 0.
- **Suggested fix:** remove `(0)` before stripping spaces, e.g. with `.replace(/\(0\)/g, "")`.

### [a/logic-errors/gpx-upload/first-empty-track-rejects-file] A GPX file whose first track is empty is rejected, even when later tracks have points

- **Location:** `public/script.js:3093`. Related: `public/script.js:3094-3101`, `public/script.js:3128-3135`
- **Severity:** Low
- **Confidence:** High
- **Likelihood:** Low. It needs an empty first `<trk>` with points further down.
- **Defect:**
  - Only the first `<trk>` is read, and `<rte>` only when the file has no `<trk>` at all.
  - A file whose first track is empty, or has a single point, is rejected with "This GPX file has no track or route with at least two points", although a later `<trk>` or a `<rte>` has points.
  - Further tracks are also ignored silently. The single-track wording of the feature makes that part a limitation, not a broken contract.
- **Trigger:** upload a GPX whose first `<trk>` holds no points and whose second `<trk>` holds a full track.
- **Evidence / verification:** `getElementsByTagName("trk")[0]` picks the track, the segments come from it alone, and the `<rte>` branch runs only when no `<trk>` exists. The error message contradicts the file's contents.
- **Suggested fix:** take the first `<trk>` or `<rte>` that has at least two points, or gather the segments of every track.

### [b/validation-and-coercion/point-download/unvalidated-cluster-ids] Ids that aren't numbers are written as null, and cleanup then empties the folder

- **Location:** `bin/helpers.js:244`. Related: `bin/helpers.js:251-253`, `bin/cleanup.js:19-39`
- **Severity:** Low
- **Confidence:** Low
- **Likelihood:** Low. SchweizMobil would have to change its cluster file format and answer the resulting requests with an empty result rather than an error.
- **Defect:**
  - Each id is taken with `parseInt(feature['id'])` and never checked. If the features lose their top-level `id`, every id becomes NaN.
  - The empty-list guard still passes, the list is written as `[null,null,…]`, and `ids.js` lists `null`.
  - `cleanup.js` keeps only `null.json`. Because the list isn't empty, it deletes every real file in that folder.
- **Trigger:** a `clustered_<Type>.geojson` whose id moves into `properties`, while the per-id query answers `{"features":[]}`.
- **Evidence / verification:**
  - Reproduced in a disposable copy with stubs: the serviceshop list became `[null,null]`, `ids.js` got `OTHER_SERVICESHOP_IDS = [null]`, and cleanup reported `other/serviceshop: deleted 486`.
  - Uncertainties:
    - Neither condition has been observed.
    - SchweizMobil may answer `…=NaN` with an HTTP error, which stops the script safely.
    - The update-data skill's count check and its step-6 confirmation would likely catch the collapse.
- **Suggested fix:** in `getIds`, reject any id that is not a positive integer, and throw before anything is written.
