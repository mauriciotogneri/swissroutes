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
