### [a/error-handling/accommodation-downloader/empty-pois-written-as-success] My Switzerland download writes an empty or partial id list and exits 0

**Location:** `bin/helpers.js:214-251` (`downloadPois`). Related: `bin/accommodation-downloader.js:4-15`, `bin/cleanup.js:19-42`, `bin/osm-downloader.js:63-65`.

**Severity:** Medium

**Confidence:** Medium

**Likelihood:** Low. It needs My Switzerland to rename a category id or answer with a list that lacks one. The category ids come from a May 2024 snapshot, and the code has not needed to change them since.

**Defect:** `downloadPois` has no check for zero matching places. When the My Switzerland list holds nothing for a category, the function still writes `ids/accommodation/<layer>.json`, as `[]`, or for campsites (`append = true`) as the SchweizMobil ids alone. No error is thrown and the script exits 0. `AGENTS.md` says an id list is "never replaced by an empty or partial one", and the sibling `osm-downloader.js` throws `NO ENTRIES FOUND` for the same situation. Campsites make it worse: the SchweizMobil step has already overwritten `ids/accommodation/camping.json` with SchweizMobil ids only before the My Switzerland step runs. A failure of that second step, or an empty answer, leaves a partial list on disk. `cleanup.js` skips a folder only when a list is empty, so a partial campsite list passes. `cleanup.js` then deletes every My Switzerland campsite file.

**Trigger:** Run `node bin/accommodation-downloader.js` while My Switzerland returns a well-formed POI list without the campsite category (for example after a category id change). Then run `node bin/cleanup.js`.

**Evidence / verification:**

- Reproduced the empty case in a disposable copy with `fetch` stubbed to return `[]`. `downloadPois('accommodation','hostels',…)` rewrote `ids/accommodation/hostels.json` (671 characters before) as `[]` and exited 0.
- Traced the campsite path by reading the code. The SchweizMobil step writes SchweizMobil-only ids, and an empty My Switzerland answer leaves them as the final list.
- The deletion step follows from reading `cleanup.js`. I did not run it, since it deletes files.
- The refutation agent searched for a guard in `helpers.js`, `accommodation-downloader.js`, `cleanup.js` and `scripts/*.sh` and found none.
- The only mitigation is the runbook (`SKILL.md`, step 3 and step 4 check 1), which depends on a person noticing a `-> 0` or a drop of about 70%.
- Assumption: the live My Switzerland API can return a well-formed list without a category. Not checked, because that needs the network.

**Suggested fix:** In `downloadPois`, throw before writing when no place matches the category, as `osm-downloader.js` does. For campsites, write the merged list only after the My Switzerland step succeeds, or keep the SchweizMobil step's list in memory until then. Make `cleanup.js` refuse to delete when a list is far shorter than the files already on disk.

## Low

### [b/resource-and-configuration-parity/osm-layers/downloaded-types-without-ui-layer] Two OpenStreetMap types are downloaded, counted and deployed but have no layer on the site

**Location:** `public/script.js:175-301` (the 25 OSM places). Related: `bin/osm-downloader.js:42,46`, `bin/ids-generator.js:45-46`, `AGENTS.md`, `.claude/skills/update-data/SKILL.md` (step 3b and step 7 check 5).

**Severity:** Low

**Confidence:** High

**Likelihood:** High. It occurs on every run of the OpenStreetMap download and every time the runbook's manual check is followed.

**Defect:** Commit `b8f86d9` removed the `hotspring` row and the whole "Camper services" section (`dumpstation`, `waterpoint`, `shower`) from the panel. It then re-added `waterpoint` and `shower` under other sections. `hotspring` (5 entries) and `dumpstation` (139 entries) have no layer at all. The downloader still queries them on every run, with a 5-second pause each. The ids generator still requires and counts them. Their files are committed and deployed but never fetched. `AGENTS.md` and `SKILL.md` still describe 27 types and a "Camper services" section, so the step 7 check "sections from Water to Camper services" cannot be followed as written.

**Trigger:** Run `bin/osm-downloader.js`, or follow step 7 of the runbook.

**Evidence / verification:**

- `script.js` defines 25 OSM ids, and layers are built only from those lists (`script.js:378-387`).
- `hotspring.json` and `dumpstation.json` exist in `public/data/osm/`.
- Whether the removal was intended is unknown.

**Suggested fix:** Decide whether the two types should be shown. If so, restore their rows. If not, remove them from the downloader and from `OSM_TYPES` in the ids generator, delete the two data files, and update `AGENTS.md` and the runbook.

### [b/contract-mismatches/place-details/handmade-sightseeing-schweizmobil-link] Hand-made sightseeing favorites link to a SchweizMobil page that should not exist

**Location:** `public/script.js:1389-1405`. Related: `ids/favorites/visit.json`, `public/data/other/sightseeing/10001.json` and the other 78 hand-made files.

**Severity:** Low

**Confidence:** Medium

**Likelihood:** Medium. It affects only the hidden Favorites feature (`?favorites=1`), but every one of the 79 hand-made entries has the wrong link.

**Defect:** Hand-made sightseeing entries (ids 10001 and up) have no `city`. Their type is `visibility`, so `placeDetails` builds `https://schweizmobil.ch/en/place-of-interest-<id>` with the made-up id. The real SchweizMobil sightseeing ids stop at 4582. The "SchweizMobil" button therefore opens a non-existent or unrelated page instead of the Google Maps search used for other places without a SchweizMobil page.

**Trigger:** Open the site with `?favorites=1`, turn on Favorites → Places, and click any entry with id 10001 or higher.

**Evidence / verification:**

- Traced `isBasic` and the `baseLink` choice by reading the code. The refutation agent found no branch that skips the link for these entries.
- Data checks: 79 hand-made files, all in `ids/favorites/visit.json` and none in `ids/other/sightseeing.json`. The maximum SchweizMobil id is 4582.
- Assumption: SchweizMobil has no page at those ids. Not checked, because that needs the network.

**Suggested fix:** Show the SchweizMobil link only for ids inside the SchweizMobil range. For hand-made entries use their own `url1_link` or the Google Maps search.

### [b/contract-mismatches/place-details/null-city-treated-as-present] A `null` city is treated as present and ends up in the Google Maps search

**Location:** `public/script.js:1385` (`isBasic`) and `:1400-1405`.

**Severity:** Low

**Confidence:** High

**Likelihood:** Low. It affects 2 of the 611 group-house files.

**Defect:** `isBasic` is `properties.city !== undefined`, which is true for JSON `null`. For those places the Google Maps link is built from `` `${item.label} ${properties.city}` ``, so the search text contains the word "null". The details panel also shows the "Show on Google Maps" row.

**Trigger:** Click group house `572704748` or `336443512`. Both have `"city": null`.

**Evidence / verification:** Confirmed in the data and the code by both my own scan and the refutation agent. The link produces for example "Unterkunft LES LOUERETTES null". The search still finds the place by title, so the effect is cosmetic.

**Suggested fix:** Treat a missing or `null` city as absent when deciding `isBasic` and when building the search text.

### [b/validation-and-coercion/gpx-export/unescaped-xml-name] GPX export does not escape the route title

**Location:** `public/script.js:1852-1861` (`gpxData`).

**Severity:** Low

**Confidence:** Medium

**Likelihood:** Low. None of the 786 committed route titles contains `&`, `<` or `>`, so it needs a future title that does.

**Defect:** `${r_number} - ${title}` goes straight into both `<name>` elements. A title containing `&` or `<` produces a GPX file that is not well-formed XML, which importers will reject. The only processing in `bin/helpers.js` is `trim()`.

**Trigger:** Download the GPX of a route whose title contains `&`, for example "Rhein & Rhône".

**Evidence / verification:** Reproduced with `gpxData` extracted from `script.js` in a disposable copy. For title "Rhein & Rhône", `xmllint --noout` reported `xmlParseEntityRef: no name` on both `<name>` lines (exit 1). The data scan found 0 of 786 titles with those characters, hence Medium confidence.

**Suggested fix:** Escape `&`, `<` and `>` in the name before writing it into the XML.
