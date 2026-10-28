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
