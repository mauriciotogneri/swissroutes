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
