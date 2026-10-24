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
