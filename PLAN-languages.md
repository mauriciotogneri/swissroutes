# Interface in German, French and Italian

**Goal**: Everything the site itself writes (panel, details, map titles, messages, notices) can be read in German, French or Italian as well as English. The language is picked from the browser automatically, can be switched in place, and is remembered. Downloaded data stays as it is.

## What the user sees

1. **First visit.** The language is the first of `de`, `fr`, `it`, `en` found in the browser's language list, matched on the primary tag: `de-CH`, `de-DE` and `de` all give German, `fr-CH` gives French, and `es` alone gives English. From the first build of the panel, the following are all in that language:
   - section titles, rows, chips, filters and counts;
   - the details panel, buttons and messages;
   - the tab title;
   - screen-reader texts.

   Numbers use the Swiss format of that language. Google's own map labels and map footer load in the same language. A globe and four buttons, **DE FR IT EN**, sit at the bottom of the layers panel, with the current language pressed. On a slow connection, the three map-type buttons may show in English for a moment before the script runs (D6).
2. **The mixed result.** Example in German, route `hiking/local/101`:
   - In German: the kind line, Copy link, Download GPX, and the Distance, Ascent and Descent labels.
   - As in the data: the title "Sentier du Rhône" and the English abstract ("The hike from Geneva to La Plaine…"). SchweizMobil is downloaded with `language=en` (`bin/helpers.js:51`) and My Switzerland with `language=en-CH` (`:15`).
   - The SchweizMobil button still opens SchweizMobil's English page.

   OpenStreetMap places:
   - 43,384 of the 55,119 points have no name. Their title is the app's own kind word, so it appears in German.
   - Named points keep their OpenStreetMap name, mostly in the local language.
   - "Fee:", "Access:" and "Operated by" are in German. The values ("no", "customers"), the opening hours and the operator name stay as in OpenStreetMap (D13).

   Charging-station descriptions stay as Bike Energy wrote them. The sampled entry is in German.
3. **Switching.** Clicking FR changes everything above at once, with no reload and nothing downloaded again. These are kept:
   - rows on, and typed filter values;
   - open sections and the panel's scroll position;
   - the open item, its photo and its scroll position;
   - the map position and map type;
   - an uploaded GPX track.

   Google's map labels keep their language until the next page load (D10). The choice is remembered (D3). If the address held `?lang=…`, it is removed (D2).
4. **Next visit.** The remembered choice wins over the browser's languages.
5. **Shared links.** Copy link carries no language, so the recipient sees their own. A hand-made link with `?lang=it` opens in Italian for that visit without changing the visitor's saved choice. `lang` stays in the address until the picker is used.
6. **Other pages and screens.**
   - With JavaScript off: the notice shows all four languages.
   - A wrong address: 404.html shows all four.
   - Windows under 1024 px: the "desktop only" notice is in the detected language. There is no picker there; `?lang=` still works.
7. **Search results and link previews** stay English (D11).

## Scope

**Translated:** every text the code or index.html writes. That covers section, row, chip and filter labels; place-type and route-kind words; stat labels; buttons; aria-labels; placeholders; marker titles; screen-reader status messages; upload errors; "Link copied"; the details' fixed labels; the tab title; the small-screen and no-JavaScript notices; and 404.html.

**Not translated, and why:**
- **Downloaded data** (user's scope): route and place titles, abstracts and descriptions, addresses, OpenStreetMap names and tag values, charging descriptions, and the photo credits added by route-facts. It was downloaded in one language, and the site makes no runtime calls.
- **Text that is the same in every language, or not words:** units (km, m, %, h, min), names (Swiss Routes, SchweizMobil, Google Maps, OpenStreetMap, GPX), the "3 / 18" photo counter, and the "–" between filter fields.
- **Text only crawlers and link-preview bots read:** meta description and `og:*` (D11).
- **Developer-only text:** console messages (`script.js:731`, `:763`) and analytics ids (D12).

**Findings from reading the code:**
- There is no "Opening hours" label. `script.js:1562–1564` shows the raw `opening_hours` value after a clock icon.
- Fee and access values are not mapped: `` `Fee: ${escapeHtml(tags.fee)}` `` (`:1591`) and `` `Access: …` `` (`:1595`) show the OpenStreetMap value as it is.

**Inventory summary** (full table in the Appendix):

| Area | Keys |
|---|---:|
| A. Page and static elements (index.html, translated by script, plus the picker label) | 12 |
| B. Panel sections | 9 |
| C. Route rows: levels, activities, chip groups, filters, "N of M" | 15 |
| D. Place rows and place kinds (36 types × name + label) | 72 |
| E. Favorites rows | 2 |
| F. Map marker titles (bubbles, GPX ends) | 3 |
| G. Status messages (besides A3) | 1 |
| H. Details: shared controls | 5 |
| I. Route details | 15 |
| J. Place and OpenStreetMap details | 6 |
| K. GPX upload | 5 |
| **Keys in `strings.js`** | **145** |
| L. Written in four languages directly in HTML (noscript 2, 404 body 3) | 5 |
| L6. Stays English: 404 `<title>` | 1 |
| M. Stays English: meta description, og:title, og:description, og:image:alt | 4 |
| The five planned features add (see Interactions) | 29 |

The 145 keys replace the English now spread over `public/index.html` and `public/script.js`. The three route nouns (`script.js:21, 32, 43`) disappear, because they are replaced by 9 whole phrases (D8).

## Decisions

**D1. How the language is chosen**
- **(a) `?lang=` in the address, then the stored choice, then the browser's language list, then English (recommended).** A link can force a language. A returning visitor gets their choice; a new one gets their browser's. `?lang=` is used for that visit only and is never stored, so a link can't change someone's saved choice.
- (b) Browser only, with the picker lasting for the session. No memory, so a visitor whose browser language is wrong picks again on every visit.
- (c) A path (`/fr/`). This needs `firebase.json` rewrites. Every relative path would resolve under `/fr/`: `ids.js`, `script.js`, `style.css` and `favicon.svg` in index.html, and `data/…` in `fetchJson` (`script.js:723`). That means a `<base href="/">` or absolute paths. `copyLink` builds from `location.pathname` (`:1708`), so shared links would carry the sender's language. Link previews would need hand-kept copies of index.html. Rejected.
- Also rejected: Firebase Hosting's i18n rewrites, which pick a `localized-files/<lang>_ALL/` copy from Accept-Language (from Firebase's docs, not checked). They need hand-maintained copies of index.html and 404.html, and the server can't see the stored choice.

**D2. `lang` in the address, and `PLAN-url-state.md`**
- **(a) Read only (recommended).**
  - The app never writes `lang`. Using the picker deletes it with `replaceState`, so the stored choice decides from then on.
  - url-state doesn't own `lang`. Its writer keeps keys it doesn't own and writes them first, so `?lang=fr&hiking=local` survives every rewrite.
  - A plain visit keeps the address `/` (url-state's D4).
  - Copied addresses carry a language only if one was given explicitly.
- (b) The picker writes `?lang=` itself. This survives blocked storage and bookmarks keep the language. But every copied address then forces the sender's language on the recipient, the address changes on a plain visit, and url-state would have to own the key.

**D3. Remembering the choice**
- **(a) localStorage key `swissroutes.language` (recommended).** The name follows the saved-list plan's `swissroutes.saved`. It is read by the inline head script inside try/catch, so blocked storage (for example Safari's SecurityError) falls through to the browser's languages. It is written in try/catch; when blocked, the choice lasts until the page closes.
- (b) A cookie. It is sent with every request for nothing, since hosting is static.
- (c) Not remembered: see D1(b).

**D4. The picker: where and how it looks**
- **(a) A footer pinned at the bottom of the layers panel, outside the scrolling rows (recommended).**
  - A `language` globe icon, then four buttons **DE FR IT EN** with `aria-pressed`, styled exactly like the Map / Terrain / Satellite group (`style.css:686–708`).
  - Always visible, and it never moves the sections.
  - It is outside `#layers`, so it is not rebuilt on a switch and keyboard focus stays on it.
  - The order DE FR IT EN is the Swiss convention: national languages, then English. Assumption: SchweizMobil and My Switzerland use it too (not checked).
  - Each button shows its code and has the native name as its accessible name, with its own `lang` (`aria-label="Deutsch" lang="de-CH"`). A screen reader says "Deutsch" with a German voice. Each name starts with its code, so the visible label is part of the name (WCAG "label in name").
- (b) A header row at the top of the panel. A more usual place for a language picker, but it pushes Routes down by about 40 px.
- (c) Next to the map-type buttons. At 1024 px with details open, the map area is about 326 px wide (1024 − 313 − 385). Those controls already take about 230 px, and a fourth group needs about 140 px more, so they would overlap the layers panel.
- (d) A `<select>` with native names. Compact, but it hides the options, and the native arrow looks different from the panel.

**D5. Where the strings live**
- **(a) A new `public/strings.js` (recommended).**
  - One entry per key, with all four languages side by side: `"stat.ascent": { en: "Ascent", de: "…", fr: "…", it: "…" }`.
  - Loaded with `defer` between `ids.js` and `script.js` (index.html:27–28). All languages are present, so switching is synchronous.
  - A missing translation is obvious in review. Translators don't touch `script.js`.
  - About 25 KB raw, roughly 7 KB gzipped (estimate; assumption: Firebase compresses JS), downloaded by every visitor.
- (b) The objects inside `script.js`. No extra request, but the 2,250-line file grows by about 600 lines and translators edit code.
- (c) One `public/i18n/<lang>.js` per language. Loading only the chosen one means adding a script at runtime. Such scripts are async and ignore the `defer` order, so `script.js` would have to wait on them, and every switch would wait for a download. Loading all four with `defer` gains nothing over (a).
- (d) JSON fetched at startup. The panel waits on a fetch and needs an error path.
- **Keys, not English text as the key.** The same English word can need different translations:
  - row "Sightseeing" vs kind "Sightseeing" (`script.js:152–153`);
  - row "Ruins" vs kind "Ruins" (`:207`). In German, French and Italian these are likely plural vs singular.
  - The saved-list plan's "Saved" is a section title, a button state and a screen-reader message.

  Keys follow the code's ids (`place.<id>.name`, `place.<id>.label`, `level.<id>`, `section.<id>`). The English `name`, `label` and `noun` fields leave `script.js` for `strings.js`, which holds the single English source.

**D6. Text that is in the HTML before any script runs**
- **index.html (recommended).** Elements carry `data-i18n` (text) or `data-i18n-label` (aria-label), and `translatePage()` replaces them as soon as `script.js` runs. The `<title>` is set through `document.title`.
  - First paint: the inline head script sets `<html lang>` before the body is parsed.
  - The panel is empty until `mapLoaded` (`script.js:362`), so it is built in the right language from the start.
  - Only the three map-type words and the small-screen sentence can show in English briefly, until the deferred scripts finish. If that is noticeable: `html:not([lang="en"]) [data-i18n] { visibility: hidden }`, removed by `translatePage`. Not planned.
- **`<noscript>` (recommended): all four languages, each block with its own `lang`.** No script can translate it, and a static page can't see Accept-Language.
- **404.html: all four languages in the body, no script (recommended).** This is common on Swiss multilingual sites. The alternative is a second copy of the detection code in another file. The `<title>` stays English: it is a noindex page and the body carries all four.
- **Meta description and `og:*` stay English.** Only crawlers and preview bots read them. Preview bots don't run JavaScript, and Googlebot is assumed to render with English settings.

**D7. Switching at runtime**
- **(a) In place (recommended).**
  - `translatePage()`, `rebuildPanel()` (which keeps rows, inputs, open sections and scroll), `refreshDetails()` (which keeps the photo and scroll), and `refreshMapText()` (titles of unnamed OpenStreetMap pins, bubbles and the GPX ends).
  - No reload, no downloads, and the uploaded track is kept. About 70 lines.
  - Google's labels catch up at the next load (D10).
- (b) Store, then `location.reload()`. Map labels change at once, but:
  - Rows, filters, item and position survive only if url-state is built.
  - The uploaded track, the gallery photo and open sections are lost.
  - Every active row's files are requested again: with every row on, about 3,850 files and 168 MB (url-state's figures). They come from the HTTP cache only while still fresh (Firebase cache headers not checked).

**D8. Interpolation and plurals**
- **(recommended)** Placeholders are `{name}`, filled by `t(key, params)` through a replacer function, so a `$` in data is safe. Callers escape data values as they do today.
- Where English builds text from words, whole phrases replace the composition:
  - 9 route kinds `kind.<activity>.<level>` replace `` `${level.name} ${activity.noun}` `` (`:1357`);
  - 3 chip-group labels replace `` `${activity.name} routes` `` (`:560`).

  This leaves word order, agreement and case to the translators.
- **No plural forms are needed.** No string puts a variable count next to a word that changes with it:
  - The bubble title "{count} places…" (`:973`) always has a count of 2 or more. Supercluster bubbles group at least 2 points; that is Supercluster's default, assumed.
  - In French, 0 and 1 are both singular, which doesn't matter here.
  - "{shown} of {total}" and the photo-spots plan's "Photo {index} of {total}" contain no noun that changes with the number.

  If a later string needs plurals: `.one` / `.other` keys chosen with `new Intl.PluralRules(language).select(n)`.

**D9. Numbers and units**
- **(recommended)** Add `formatNumber(value, options)`: `de-CH`, `fr-CH` or `it-CH` for those languages, and the browser's default for English. English is unchanged, since today every call passes no locale.
- The 10 calls to replace: `script.js:691, 694, 698, 1370, 1373, 1549, 1553, 2127, 2135, 2136`.
- Node (ICU 78) gives:

  | | `1234` | `12345` | `1234.5` (1 decimal) |
  |---|---|---|---|
  | en (Node's en-US) | 1,234 | 12,345 | 1,234.5 |
  | de-CH | 1'234 | 12'345 | 1'234.5 |
  | fr-CH | 1'234 | 12'345 | 1'234,5 |
  | it-CH | 1234 | 12'345 | 1234.5 |

  The separator is the plain apostrophe U+0027; older CLDR versions used ’ U+2019. it-CH leaves 4-digit numbers ungrouped. Browsers ship their own CLDR, so the check is against each browser's own `Intl`.
- Left unformatted, as now: chip counts (≤ 286, `:555`), the section badge (`:637`), the bubble number (`:962`; grouping would widen the 30–42 px bubbles), route Distance (`:1369`, at most 3 digits), Asphalt % (`:1381`), and the photo counter.
- Units are identical in all four languages: no keys.

**D10. Google's map labels**
- **(a) Pass `&language=<code>` when the Maps script loads (recommended).**
  - What changes: Google's place, lake and country names on the map (for example Geneva, Genf or Genève), and its footer (terms, "Keyboard shortcuts", the error-report link).
  - The language is known only in the inline head script, so that script adds the Maps `<script>`; the static tag at index.html:34–36 goes.
  - An added script is async and could call back before the deferred `script.js` has run. So the callback resolves a promise `mapsReady`, and `script.js` runs `mapsReady.then(mapLoaded)`.
  - The inline script moves above the parser-blocking supercluster script (`:31`) and the stylesheets. Inline scripts wait for earlier stylesheets, so this keeps the Maps download starting as early as today.
  - The API can't be loaded twice on a page (Google warns about including it multiple times; assumption from that warning). So after an in-place switch the labels keep the old language until the next load, which uses the stored choice.
- (b) Don't pass it: labels follow the browser, as today, with no code. A visitor whose chosen language differs from the browser's always gets mixed labels, including everyone opening a `?lang=` link.
- (c) Pass it and reload on every switch: D7(b)'s costs.
- `region` is not passed: it changes borders and search bias, not language.

**D11. Search engines and `<html lang>`**
- **(a) One URL (recommended).**
  - The canonical stays `https://swiss-routes.web.app/`. No hreflang. `sitemap.xml`, `robots.txt` and `og:*` are unchanged.
  - `?lang=` addresses fold into the canonical.
  - Cost: German, French and Italian searches match only the English title and description.
- (b) hreflang alternates `/?lang=de`, `fr`, `it` plus `x-default`. Each alternate must be its own canonical, so the static canonical would have to go. Google must render JavaScript to see the translated title, and previews stay English. This can be added later without touching the mechanism, because `?lang=` is already read.
- (c) `/de/` paths: see D1(c).
- `<html lang>` is set by the inline script before the body is parsed, and again on every switch: `en`, `de-CH`, `fr-CH` or `it-CH`.

**D12. Analytics**
- Every event name and id parameter is already English: `layer_toggle` with layer ids, `content_type` with place or activity ids, and `select_content`, `share` and `gpx_download` with data labels.
- **One app-made text reaches analytics.** An unnamed OpenStreetMap point's `item.label` is its kind word (`:907`), sent as `content_id` (`:1260`). That covers 79% of OpenStreetMap points.
- **(recommended)** Add `trackLabel(item)`, which sends the English kind as today, so reports stay continuous.
- **(recommended)** Add `ui_language` to every `track()` event, and send `language_change` with `previous_language` from the picker. This shows whether detection picks well; Analytics already records the browser language itself.
- Reports need `ui_language` registered as a custom dimension in GA4 (manual). `page_view`, which Firebase sends itself, doesn't carry it.
- (alternative) No parameters: no way to tell the interface language from the browser language.

**D13. OpenStreetMap fee and access values**
- **(a) Shown raw, as data (recommended, per the user's scope).** The result reads "Gebühr: no"-style, with the label translated and the value in English.
  - `fee` is on 6,619 points: `no` 5,945, `yes` 670, 4 others.
  - `access` is on 5,865 points: `yes` 4,982, `private` 299, `customers` 294, `permissive` 141, `permit` 72, `no` 49, 9 rarer values.
- (b) Map `yes` and `no` only, with 2 keys. That covers 6,615 of 6,619 fee values and 5,031 of 5,865 access values. **Your call:** it goes beyond the stated scope.

**D14. Who translates, and conventions**
- **(a) Claude drafts German, French and Italian at implementation time, and a native speaker reviews each language before it is offered (recommended).** An unreviewed language is left out of `LANGUAGE_TAGS` and its picker button is removed (2 lines). Gaps fall back to English.
- (b) A professional translator: better, at a cost.
- (c) Machine translation with no review.
- Conventions for the drafter and reviewers:
  - Locale tags `de-CH`, `fr-CH`, `it-CH`.
  - Swiss German writes "ss", never "ß" (checked in Verification), and uses Swiss words ("Velo").
  - Route kinds and categories should match SchweizMobil's own terms in each language. Exact terms not checked.
  - French: decide once on spaces before `:` (use U+00A0 so it never wraps) and use ’ for apostrophes.
  - Never `"`, `<` or `>`: the text goes into HTML attributes.
  - Keep `{name}` placeholders exactly; word order is free.
  - Section titles are uppercased by CSS (`style.css:188`), so write them in normal case.
  - Keep level names to about 8 characters, filter labels to about 9, and single words in stat labels to about 11 (see D16).
  - "Swiss Routes", "GPX" and brand names stay unchanged.

**D15. Fonts: no change.** The Archivo CSS (index.html:41), fetched read-only, serves a `latin` subset of U+0000–00FF, U+0152–0153 and U+2000–206F. That covers é è à ü ö ä ç ì ò ù â ê î ô û ë ï « » œ ’ „ “ – … and U+202F. It also serves a `latin-ext` subset. Assumption: the font has every character in those ranges; check in Verification. Material Symbols only needs `language` added to `icon_names`.

**D16. Layout (312 px panel, 384 px details)**
- **(recommended) `.upload` gets `flex-wrap: wrap` now.** `style.css:225–229` has no wrap. "Upload GPX" plus "Remove" must fit 272 px, about 255 px with a classic scrollbar, and longer translations could overflow.
- **Only if the overflow helper in Verification flags them**, ranked by risk:
  1. **Filter label column, fixed at 58 px** (`style.css:380`). It fits about 8–9 characters at 12.5 px. Fix: `.filters` becomes the grid with `grid-template-columns: max-content 1fr 10px 1fr 22px`, and `.range { display: contents; }`. The color and font-size move from `.range` to `.filters`. Rows still line up.
  2. **Level chips** (`style.css:329–343`). About 69 px of text room each. English "Regional" plus a 2-digit count fits with only a few px to spare (estimate). Fix: `.chip { font-stretch: 75%; }`; the width axis 62–125 is already loaded.
  3. **Stat tiles, about 76 px** (`style.css:581`). Long single words widen the tracks; several words wrap and make tiles uneven. Fix: `.stats dt { hyphens: auto; }`, which works because `<html lang>` names the language. Assumption: desktop browsers hyphenate de, fr and it.
- **Low risk:** section headings and row names (they wrap); map-type buttons (similar lengths, about 190 px in a 326 px map at 1024 px); the actions row and the kind line (they already wrap).

## Implementation steps

**Order of work:**
1. Steps 1–2 and 6–14 with English only, `LANGUAGE_TAGS = { en: 'en' }` and the picker hidden. The site must look and behave exactly as today. Verify.
2. Steps 3–5, then the German, French and Italian drafts.
3. Run the checks, have the translations reviewed, and offer each language once its review is done.

### public/strings.js (new)
1. Header comment: "The interface text in each language, by key. Keys follow the code's ids: place.<id>.name is a row, place.<id>.label the kind of one place. {name} is filled in by the code. The text goes into HTML as it is: no double quotes, < or >. Swiss German writes ss, never ß."
   - Then `const STRINGS = { "<key>": { en, de, fr, it }, … };`, grouped with comments in the Appendix order.
   - The English values are the Appendix's English column, exactly as written.

### public/index.html
2. **Move the inline `<script>` (lines 51–63) up to just before line 26**, ahead of the supercluster script and the stylesheets. Keep its lines, and keep url-state's planned line-54 change if that lands. Append, in the file's style (single quotes, no semicolons):
   ```js
   // The interface languages in the Swiss order, with the tag for <html lang> and number formats
   const LANGUAGE_TAGS = { de: 'de-CH', fr: 'fr-CH', it: 'it-CH', en: 'en' }
   const LANGUAGE_KEY = 'swissroutes.language'

   let storedLanguage = undefined

   try {
     storedLanguage = localStorage.getItem(LANGUAGE_KEY)
   } catch (error) {
     // Blocked storage: the browser's languages decide
   }

   // The address (?lang=fr) wins, then the visitor's earlier choice, then the browser's languages in order, else English
   const PAGE_LANGUAGE = [PARAMS.get('lang'), storedLanguage, ...(navigator.languages ?? [navigator.language])]
     .map((tag) => String(tag ?? '').split('-')[0].toLowerCase())
     .find((code) => Object.hasOwn(LANGUAGE_TAGS, code)) ?? 'en'

   document.documentElement.lang = LANGUAGE_TAGS[PAGE_LANGUAGE]

   // Google writes the map's labels in the language given when its script loads, so the script is added here. script.js starts the map once both have run
   const mapsReady = new Promise((resolve) => { window.mapsApiLoaded = resolve })
   const mapsScript = document.createElement('script')
   mapsScript.src = `https://maps.googleapis.com/maps/api/js?key=<the key from today's tag>&callback=mapsApiLoaded&loading=async&libraries=marker&language=${PAGE_LANGUAGE}`
   document.head.append(mapsScript)
   ```
   - `Object.hasOwn`, not `in`, so `?lang=constructor` is ignored.
   - Delete the static Maps tag (lines 33–36).
   - Reword the comment at line 26: "ids.js is generated by bin/ids-generator.js. These deferred scripts run in order; script.js starts the map once mapsReady resolves."
3. **Add `<script src="strings.js" defer></script>`** between `ids.js` and `script.js` (lines 27–28).
4. **Tag the static text.**
   - `data-i18n`: the h1 (`:99`, key `page.title`), the Map / Terrain / Satellite buttons (`:117–119`) and the small-screen h2 (`:137`).
   - `data-i18n-label`: `#layersPanel` (`:105`), `#progress` (`:106`), `#details` (`:113`), `.map-type` (`:116`), `#zoomIn` and `#zoomOut` (`:122–123`).
   - The English stays in the HTML as the no-script fallback.
5. **Picker**, after `#layers` (`:110`), inside `#layersPanel`:
   ```html
   <div class="language" role="group" aria-label="Language" data-i18n-label="language.label">
     <span class="material-symbols-outlined" aria-hidden="true">language</span>
     <button type="button" data-language="de" lang="de-CH" aria-label="Deutsch" aria-pressed="false">DE</button>
     <button type="button" data-language="fr" lang="fr-CH" aria-label="Français" aria-pressed="false">FR</button>
     <button type="button" data-language="it" lang="it-CH" aria-label="Italiano" aria-pressed="false">IT</button>
     <button type="button" data-language="en" lang="en" aria-label="English" aria-pressed="false">EN</button>
   </div>
   ```
6. **`icon_names` (`:43`):** add `language` between `landscape` and `link` (alphabetical).
7. **`<noscript>` (`:85–96`):** after the cross, four `<div lang="de-CH|fr-CH|it-CH|en">` blocks, each with the `p.notice-title` and the `p` sentence. English is the current text.
   - Unchanged: the `<title>` element (the script sets `document.title`), meta description, canonical, and `og:*`.

### public/404.html
8. In `<main>`, after the cross: four `<div lang="…">` blocks in the order DE FR IT EN, each with the h1, the p and the "Back to the map" link to `/`. Add `main > div + div { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--rule); }` to its `<style>`; `--rule` is defined at `:21`. The `<title>` stays.

### public/script.js
Follow the file's style: double quotes, semicolons, braces on every `if`, trailing commas, short comments that say why.

9. **Constants: drop the English and add section ids.**
   - `LEVELS` (`:11–15`): drop `name`.
   - `ACTIVITIES` (`:17–51`): drop `name` and `noun`.
   - `SECTION_ICONS` (`:65–74`): key by section id: `stay`, `explore`, `water`, `bike`, `rest`, `nature`, `favorites`, `upload`.
   - `PLACES` (`:76–180`): drop `name` and `label`. `serviceshop` and `chargingstation` get `section: "bike"`.
   - `osmPlace` (`:427–437`) becomes `(group, id, icon)`, and the calls at `:185–305` lose their two English arguments.
   - `OSM_SECTIONS` (`:210–308`): `name: "Water"` becomes `id: "water"`; likewise `bike`, `rest` and `nature`. Update the comment at `:209` to "same section id".
10. **State and start.**
    - After `downloadsActive` (`:336`): `// The interface language, a key of LANGUAGE_TAGS (index.html)` and `let language = PAGE_LANGUAGE;`.
    - After `drawn` (`:343`):
      ```js
      // The page's own text is translated before the map arrives
      translatePage();
      mapsReady.then(mapLoaded);
      ```
11. **`buildPanel` (`:468–531`).**
    - Calls become `group("routes", …, false)`, `group("stay", …)`, `group("explore", …)`.
    - `:494` becomes `place.section === section.id`, and `:497` becomes `group(section.id, …)`.
    - `:504` `t("favorites.hikes")`, `:510` `t("favorites.places")`, `:514` `group("favorites", …)`, `:517` `group("upload", uploadRows(), false)`.
    - Move the `uploadButton` and `uploadRemove` bindings from `bindControls` (`:1810–1815`) here, after the input loop (`:528`): `document.getElementById("gpxInput").click()` and `removeUpload`. Comment: "The panel is rebuilt when the language changes, so its buttons are bound here."
    - `byCount` sorts by counts, not names, so the order is the same in every language.
12. **`group(id, rows, collapsible)` (`:539–550`).** `const name = t(\`section.${id}\`)` and `SECTION_ICONS[id]`. Add `data-section="${id}"` to the `<section>` and the `<details>`.
13. **Rows.**
    - `activityRow`: `:555` `t(\`level.${level.id}\`)`; `:559` `t(\`activity.${activity.id}\`)`; `:560` `aria-label="${t(\`activity.${activity.id}.chips\`)}"`; `:562` `t("filter.length")`; `:563` `t("stat.ascent")`.
    - `placeRow` (`:572`): `t(\`place.${place.id}.name\`)`.
    - `rangeFilter` (`:590`, `:592`): `placeholder="${t("filter.min")}"` and `aria-label="${t("filter.minLabel", { label, unit })}"`; the same for max.
14. **`toggleLayer` (`:598–627`).** Move `:618–626` (`updateBadges`, the filter-box loop, `scheduleRender`) into `layersChanged()`. This is the same split as url-state's step 5; whichever feature lands first makes it.
15. **Panel and map text.**
    - `updateCounts` (`:691–698`): `formatNumber`, and `t("count.of", { shown, total })`.
    - `updateProgress` (`:785`, `:792`): `t("status.loading")` and `t("status.loaded")`.
    - `buildOsmPlaces` (`:907`): `label: entry.name ?? t(\`place.${place.id}.label\`)`.
    - `renderCluster` (`:973`): `title: t("cluster.title", { count: formatNumber(count) })`.
    - `selectItem` (`:1260`): `content_id: trackLabel(item)`. Move the uploaded-file comment (`:1259`) into `trackLabel`.
16. **Details.**
    - `:1333` aria-label `t("details.close")`.
    - `routeDetails`:
      - `:1354` alt `t("route.logo", { number: properties.r_number })`.
      - `:1357` `${badge}${t(\`kind.${item.activity.id}.${item.level.id}\`)}`.
      - `:1362` `t("action.downloadGpx")`.
      - `:1369–1379` the `stat.distance`, `stat.ascent`, `stat.descent` and `stat.asphalt` labels.
      - `:1370`, `:1373` `formatNumber`.
      - `:1388` and `:1392`: add `lang="en"`. The text is downloaded in English; without the attribute, a German page would have it read with a German voice.
    - `placeDetails`: `:1416` `t(\`place.${item.place.id}.label\`)`; `:1435` and `:1439` `lang="en"`; `:1448` `t("place.showOnGoogleMaps")`.
    - `chargingStationDetails` (`:1506`): the kind label as above. The description's language varies, so it gets no `lang`.
    - `osmDetails`:
      - `:1526` the kind label.
      - `:1549` and `:1553`: `t("stat.elevation")` and `t("stat.capacity")`, with `formatNumber`.
      - `:1586` `t("osm.operator", { operator: escapeHtml(tags.operator) })`; `:1591` `t("osm.fee", { fee: escapeHtml(tags.fee) })`; `:1595` `osm.access` likewise.
    - `shareAction` (`:1625`) and `copyLink` (`:1722`, `:1726`): `action.copyLink` and `action.linkCopied`.
    - `gallerySection` (`:1651`, `:1653`): `gallery.previous` and `gallery.next`.
17. **`bindControls` (`:1788`).** After the map-type loop (`:1806`), bind each `[data-language]` click to `setLanguage(button.dataset.language)`. Like the map-type buttons, it is bound once the map has loaded.
18. **Upload.**
    - `uploadRows` (`:1887`, `:1889`): `action.uploadGpx` and `action.remove`.
    - `parseGpx` returns the keys `"upload.notGpx"` (`:1930`) and `"upload.noTrack"` (`:1970`); its comment becomes "the key of the message". `loadUpload` (`:1901`) calls `showUploadError(t(parsed))`.
    - `buildUpload` (`:2037`): `marker.title = t(name === "start" ? "upload.start" : "upload.end", { name: item.label })`.
    - `uploadDetails`: `:2119` `t("upload.kind")`, `:2122` `t("action.remove")`, the stat labels at `:2126–2136`, and `formatNumber` at `:2127`, `:2135` and `:2136`.
19. **New `// Languages` section before `// Analytics` (`:2142`).**
    ```js
    // The text of key in the interface language, with each {name} filled from params. A missing translation shows the English
    function t(key, params = {}) {
      const text = STRINGS[key]?.[language] ?? STRINGS[key]?.en ?? key;

      return text.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
    }

    // Numbers in the interface language's Swiss format. English keeps the browser's own format, as before
    function formatNumber(value, options) {
      return value.toLocaleString(language === "en" ? undefined : LANGUAGE_TAGS[language], options);
    }
    ```
    - **`translatePage()`:** sets `document.documentElement.lang` and `document.title = t("page.title")`. It sets `textContent` from `[data-i18n]`, `aria-label` from `[data-i18n-label]`, and `aria-pressed` on each `[data-language]`.
    - **`setLanguage(code)`:**
      1. Return if `code === language` or `!Object.hasOwn(LANGUAGE_TAGS, code)`.
      2. Keep `previous` and set `language = code`.
      3. Store `LANGUAGE_KEY` in try/catch, with the comment "blocked storage: the choice lasts until the page closes".
      4. If `URLSearchParams(location.search)` has `lang`: delete it, then `replaceState(history.state, "", …)` with the rest of the query and `location.hash`, turning `%2C` and `%2F` back into `,` and `/` as url-state's writer does. Comment: "a lang in the address would win over the new choice at the next load".
      5. `translatePage()`, `rebuildPanel()`, `refreshMapText()`, then `if (selected) { refreshDetails(); }`.
      6. `track("language_change", { previous_language: previous })`.
    - **`rebuildPanel()`:**
      1. Before `buildPanel()`, record the `[id, value]` of every `#layers input`, the `dataset.section` of each `details[open]`, and `#layers.scrollTop`.
      2. After it, restore the input values; setting `.value` fires no event, so `sharedItem` is kept. Set `open` on the recorded sections, and `aria-pressed` on every `[data-layer]` from `activeLayers`.
      3. `uploadRemove.hidden = !uploaded`; restore the scroll; `layersChanged()`.
      4. A visible upload error is cleared; it was already announced.
    - **`refreshDetails()`:** keep `.details-scroll`'s `scrollTop`, set `details.innerHTML = detailsContent(selected)`, call `showPhoto()` if `galleryIndex > 0`, then restore the scroll. Focus stays on the picker.
    - **`refreshMapText()`:**
      - For every item in `files.values()` with `kind === "osm" && !item.json.name`: set `item.label` again, and `item.marker.title` if the marker exists.
      - Set the titles of `uploaded?.markers` (index 0 is the start).
      - `pointIndexVersion++; drawPins();` with the comment "new keys make drawPins create every bubble again, with the new title".
      - Comment: "Map items keep the text they were made with."
20. **Analytics (`:2145–2152`).**
    - `track` becomes `window.trackEvent?.(name, { ...params, ui_language: language });`.
    - Add `trackLabel(item)`: return `"upload"` for uploads. For `kind === "osm" && !item.json.name`, return `STRINGS[\`place.${item.place.id}.label\`].en`. Otherwise return `item.label`.

### public/style.css
21. **Picker.** After `.layers-body` (`:138–142`): `.language { display: flex; flex: none; align-items: center; gap: 2px; padding: 8px 20px; border-top: 1px solid var(--rule); }` and `.language > .material-symbols-outlined { margin-right: 8px; color: var(--ink-soft); }`. Add `.language button` to the three `.map-type button` rules (`:691`, `:701`, `:705`).
22. **`.upload` (`:225–229`):** add `flex-wrap: wrap;` (D16).
23. **Only if Verification step 10 flags them:** the three fixes in D16, in that order.

### AGENTS.md
24. **Folders table:** add a row for `public/strings.js`: "The interface text in English, German, French and Italian, one entry per key", written by hand, deployed.
25. **New short "Languages" section:**
    - Every text the site writes goes through `t()` with an entry for all four languages in `strings.js`.
    - Downloaded data is not translated.
    - The language comes from `?lang=` (read only), then localStorage `swissroutes.language`, then the browser.
    - A new OpenStreetMap type also needs `place.<type>.name` and `.label`, along with `bin/osm-downloader.js`, `bin/ids-generator.js` and `osmPlace`.

**Unchanged:** `firebase.json`, `robots.txt`, `sitemap.xml`, `bin/`, `ids/`, `public/data/`.

## Interactions with the other planned features

New strings from the other plans: 29 in all (listed in Appendix O). Each one is added as a `strings.js` entry with all four languages and shown with `t()`. Their numbers go through `formatNumber`. Any text kept outside the panel and details HTML (marker titles, labels changed in place) must be refreshed in `setLanguage`.

- **`PLAN-url-state.md`** (no strings).
  - `lang` is not added to `ADDRESS_KEYS`. Its writer keeps foreign keys first, so `?lang=fr&hiking=local` survives. The picker deletes `lang` itself; if both features are built, share the `,` and `/` clean-up as one `replaceQuery(params)` helper.
  - Both features need the `toggleLayer` split into `layersChanged()`.
  - This plan moves the inline block that url-state edits at `index.html:54`; apply that edit in the moved block.
  - `mapLoaded` is now called through `mapsReady.then(mapLoaded)`; url-state's edits inside it stand.
  - `restoreView()` runs after `buildPanel()`, so restored rows are already in the page language.
  - A language switch changes no view state and must not call `scheduleAddress()`.
  - Its Copy link (item only, D6) carries no `lang`, which matches D2.
  - Its AGENTS.md note should mention that `lang` is read but not written.
- **`PLAN-route-facts.md`** (17 strings).
  - `GRADES` becomes the keys `grade.easy`, `grade.medium` and `grade.difficult`.
  - The hiking `trails` become `trail.easy` ("hiking trail") and `trail.medium` ("mountain hiking trail"). The "{grade} · {trail}" join stays in code.
  - `filter.grade` ("Difficulty") and `filter.fitness` ("Fitness") are used for both the filter rows and the facts.
  - Its chip-group aria-label `` `${activity.name} ${label.toLowerCase()}` `` would lower-case German nouns. Use 5 whole phrases instead: `filter.<activity>.grade` for hiking and mountain biking, `filter.<activity>.fitness` for all three.
  - `stat.hikingTime`, `fact.otherDirection`, and 3 subtitle templates: `route.loop` "Loop from {start}", `route.ends` "{start} to {end}", `route.via` "{route} via {via}". The values are data and are escaped.
  - `h` and `min` are not translated.
  - `rebuildPanel()` must also record and re-press `[data-grade-filter][aria-pressed="true"]` chips, by `data-grade-filter` and `data-grade`.
  - Its 58 px "Difficulty" label column is the most likely trigger for the D16 `.filters` fix.
- **`PLAN-elevation-profile.md`** (2 strings).
  - `profile.title` "Elevation". This is a separate key from the OpenStreetMap `stat.elevation`, because a chart heading and a point's height may differ in German.
  - `profile.label` "Elevation profile, {low} to {high} m over {length} km" for the aria-label.
  - Every `toLocaleString()` in it (range, readout, axis labels, the 1-decimal length) becomes `formatNumber`.
  - `refreshDetails()` must call `hideProfilePoint()` before replacing the details, as its `selectItem` step does.
- **`PLAN-saved-list.md`** (8 strings).
  - `section.saved`, `saved.routes`, `saved.places`, `saved.empty` (the hint), `action.save`, `action.saved`, `status.saved` and `status.unsaved`. Kept separate because "Saved" is a section, a button state and an announcement.
  - `SECTION_ICONS` gets `saved: "star"`, with `group("saved", …)`.
  - `toggleSaved` sets the label with `t()`.
  - `buildPanel` already calls its `updateSavedLayers()`, so a rebuild restores the counts and the hint.
  - `save_item` and `unsave_item` send `item_id: trackLabel(item)`, because unnamed OpenStreetMap points can be saved.
  - `index.html:43` gets `star`, `photo_camera` and `language`; keep the list alphabetical.
- **`PLAN-photo-spots.md`** (2 strings).
  - `photo.title` "Photo {index} of {total}", also used for its status message, and `photo.titleShown` "Photo {index} of {total}, on show".
  - Its `spot.key` cache must include `language`. `refreshDetails()` ends with `drawPhotoSpots()` once that plan lands, so pin titles change on a switch.

## Edge cases and risks

- **Flash of English** on the three map-type words and the small-screen sentence before the deferred scripts run (D6). On a phone with JavaScript off, the English small-screen notice covers the four-language noscript notice. That was already the case and is rare.
- **Storage blocked:** detection still works and switching works, but a reload returns to the browser's language. A stored language that is later withdrawn (left out of `LANGUAGE_TAGS`) is ignored. `?lang=de-CH` is accepted. `gsw`, `rm` and `xx` fall through to the next candidate.
- **Two tabs:** a switch in one tab applies to the other only at its next load.
- **Map labels lag behind an in-place switch** until the next load (D10). If Maps fails to load, nothing happens, as today. If `mapLoaded` throws, the console shows "Uncaught (in promise)".
- **Bubbles are recreated on a switch,** so they flicker once. `refreshMapText` loops over every loaded item, at most about 60,000, which should take milliseconds (estimate).
- **"Link copied" mid-switch:** its 2 s timer writes into the replaced button, which is harmless.
- **Translated text containing `"`** would break attributes; the node check blocks it. Number formats can contain an apostrophe, which is safe in double-quoted attributes and text.
- **Number formats depend on each browser's CLDR** (D9). it-CH shows "3986" but "15'054"; that is correct, not a bug.
- **Googlebot is assumed to render with English settings.** If it rendered with another language, a translated title could be indexed for `/`.
- **Data language is mixed anyway.** Route titles use local names ("Sentier du Rhône"), abstracts are English, the sampled charging description is German, and OpenStreetMap names are local. Only SchweizMobil and My Switzerland text gets `lang="en"`.
- **Chrome's own page translation** would translate the Material Symbols ligature words and break the icons. This already happens today. With `<html lang>` matching the visitor's language, Chrome is less likely to offer it (assumption).
- **Layout overflow** in the D16 spots, which depends on the actual translations.
- **A missing key renders as the key itself** (for example `place.cave.label`), which is visible; Verification catches it.

## Verification

Run `scripts/serve.sh`, open http://localhost:5000 in a window at least 1024 px wide, and keep DevTools open. Top-level `let`/`const` values (`STRINGS`, `language`, `drawn`, `activeLayers`, `LEVELS`…) can be read in the console. Set the language with `?lang=` or with DevTools › Sensors › Location › Locale. Assumption: that override changes `navigator.languages`; otherwise reorder Chrome's languages in settings.

1. **Detection.** Clear `swissroutes.language` (Application › Local Storage).
   - Locale `de-CH` gives German, `fr-CH` French, `it-CH` Italian, `es-ES` English.
   - Chrome languages `es, fr` give French.
   - `document.documentElement.lang` is `de-CH`, `fr-CH`, `it-CH` or `en`.
2. **Precedence.**
   - Pick IT, then open `/?lang=fr`: the page is French and storage still says `it`.
   - Click DE: `lang` leaves the address and storage says `de`. Reload: German.
   - `/?lang=xx` and `/?lang=constructor` fall back to the stored language.
3. **Blocked storage.** Chrome › Site settings › "Not allowed to save data" for `localhost:5000`: the page loads in the browser's language with no console errors, and switching works. After a reload, the browser's language is back.
4. **A switch keeps everything.**
   1. Upload a GPX.
   2. Turn on Hiking National and Regional, Camping and Drinking water. Type Hiking length max `15`.
   3. Open the Stay section and scroll the panel.
   4. Open `?url=hiking/national/1.json&type=hiking` (Via Alpina) from the map, go to photo 3, and scroll the details. Choose Satellite and pan.
   5. Click FR.

   Check:
   - Chips and toggles are still pressed, the badges are right, the filter box still shows 15, the hiking count is in "N of M" form, and Stay is open.
   - Both scroll positions, photo "3 / N", Satellite and the map position are unchanged.
   - Remove is visible and the track is drawn.
   - Network shows no new `data/` requests.
5. **Map text.**
   - Hover a bubble: its title is in the new language.
   - Hover an unnamed Drinking water pin: its kind word is in the new language.
   - Hover the GPX start and end dots: titles in the new language.
6. **No English left.** In each of de, fr and it, after exercising everything, run the helper below. It must return `[]`. Exercise:
   - every section open, and one level of each activity on;
   - `hiking/national/1`, and `cycling/national/1` (Asphalt 92 %);
   - `?url=accommodation/camping/100096153.json&type=camping`, a My Switzerland hostel, and an unnamed drinking-water point;
   - an OpenStreetMap point with operator, fee and access, and a charging station;
   - a bad GPX (any `.txt` renamed `.gpx`) and a good one;
   - Copy link, then run the helper within 2 s;
   - hovering a bubble.
   ```js
   (() => {
     const patterns = Object.values(STRINGS).filter((entry) => entry[language] !== entry.en)
       .map((entry) => new RegExp(`^${entry.en.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{\w+\}/g, ".+")}$`));
     const english = (text) => patterns.some((pattern) => pattern.test(text.trim()));
     const data = ".details-title, .details-lead, .details-description, .material-symbols-outlined, noscript";
     const found = [];
     const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
     while (walker.nextNode()) {
       const node = walker.currentNode;
       if (!node.parentElement.closest(data) && english(node.textContent)) found.push(node.textContent.trim());
     }
     for (const element of document.querySelectorAll("[aria-label], [placeholder], [alt], [title]")) {
       for (const name of ["aria-label", "placeholder", "alt", "title"]) {
         const value = element.getAttribute(name);
         if (value && english(value)) found.push(`${name}: ${value}`);
       }
     }
     for (const marker of drawn.values()) if (marker.title && english(marker.title)) found.push(`marker: ${marker.title}`);
     if (english(document.title)) found.push(`title: ${document.title}`);
     return found;
   })();
   ```
   A data value containing " of " can show up as a false positive; review the list by eye.
7. **Dynamic keys exist.** This must return `[]`:
   ```js
   [...LEVELS.map((l) => `level.${l.id}`), ...ACTIVITIES.flatMap((a) => [`activity.${a.id}`, `activity.${a.id}.chips`, ...LEVELS.map((l) => `kind.${a.id}.${l.id}`)]), ...[...PLACES, ...OSM_STAY, ...OSM_EXPLORE, ...OSM_SECTIONS.flatMap((s) => s.places)].flatMap((p) => [`place.${p.id}.name`, `place.${p.id}.label`]), "section.routes", ...Object.keys(SECTION_ICONS).map((id) => `section.${id}`)].filter((key) => !STRINGS[key])
   ```
8. **Static checks.** Read-only; run from the repository root:
   ```sh
   node <<'EOF'
   const fs = require('fs')
   const STRINGS = new Function(fs.readFileSync('public/strings.js', 'utf8') + '; return STRINGS')()
   const problems = []
   const holes = (text) => (text.match(/\{\w+\}/g) ?? []).sort().join()
   for (const [key, entry] of Object.entries(STRINGS)) {
     for (const code of ['en', 'de', 'fr', 'it']) {
       const text = entry[code]
       if (typeof text !== 'string' || !text.trim()) { problems.push(`${key}: no ${code}`); continue }
       if (/["<>]/.test(text)) problems.push(`${key} ${code}: contains " < or >`)
       if (holes(text) !== holes(entry.en)) problems.push(`${key} ${code}: placeholders differ`)
     }
     if (/ß/.test(entry.de ?? '')) problems.push(`${key}: ß in Swiss German`)
   }
   const used = [...fs.readFileSync('public/script.js', 'utf8').matchAll(/\bt\(\s*"([^"]+)"/g), ...fs.readFileSync('public/index.html', 'utf8').matchAll(/data-i18n(?:-label)?="([^"]+)"/g)].map((m) => m[1])
   for (const key of used) if (!STRINGS[key]) problems.push(`missing key ${key}`)
   console.log(problems.join('\n') || 'strings OK')
   console.log('Same as English, check they are meant:', Object.entries(STRINGS).flatMap(([k, e]) => ['de', 'fr', 'it'].filter((c) => e[c] === e.en).map((c) => `${k} ${c}`)).join(', '))
   EOF
   ```
9. **Numbers.**
   - Via Alpina: Ascent 23,500 and Descent 24,700. Rhone Route: Ascent 3,500. Hotels row: 3,986. Drinking water row: 15,054. An upload's distance has 1 decimal.
   - Each must equal that browser's own `(n).toLocaleString("de-CH")`, `fr-CH` or `it-CH` in the matching language. French shows a decimal comma.
   - English must match `(n).toLocaleString()` exactly as before.
10. **Layout overflow.** Run this in each language with all filter boxes visible, a bike route open (4 tiles), and an OpenStreetMap point with Elevation and Capacity. It must return `[]`:
    ```js
    [...document.querySelectorAll(".chip, .range > span, .row-name, .group h2, .stats dt, .action, .map-type button, .language button, .upload")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent)
    ```
    Also run it at 1024 × 768 with details open; the map-type group must not overlap the layers panel. Apply the D16 fixes for anything flagged.
11. **Map labels.**
    - `/?lang=fr`: Google's labels and footer are French ("Genève"; assumption about Google's names).
    - Click DE: the labels stay French.
    - Reload (the address no longer has `lang`): the labels are German ("Genf").
12. **Analytics.** In Network, filter `collect`:
    - `en=language_change` with `ep.previous_language` and `ep.ui_language`;
    - `select_content` on an unnamed drinking-water point sends `ep.content_id=Drinking water` in every language;
    - `layer_toggle` still sends `ep.layer=camping`.
13. **No JavaScript and 404.**
    - DevTools › Settings › Debugger › Disable JavaScript: the notice shows four languages, each with its `lang`.
    - `/does-not-exist`: four blocks, each linking to `/`.
    - A window under 1024 px with `?lang=it`: the Italian notice.
14. **Accessibility markup.**
    - On a route in German, `.details-description` and `.details-lead` have `lang="en"`.
    - The picker buttons have native-name aria-labels with their `lang`.
    - Tab to the picker, press Enter: focus stays on it after the switch.
15. **Fonts.** In Elements › Computed › Rendered Fonts, an element containing é, ü or à shows Archivo.
16. **Copy link** from the German interface: the clipboard has `?url=…&type=…` and no `lang`.
17. **Two features together:**
    - With url-state built: `/?lang=fr&hiking=local`, then change a row: the address keeps `lang=fr` first. Click DE: only `lang` is removed.
    - English with all languages offered: run steps 4–6 in `en`. The helper returns `[]` trivially; compare screenshots with the current site.

## Out of scope

- Translating downloaded data, or downloading SchweizMobil and My Switzerland in other languages. Both APIs take a language parameter (`bin/helpers.js:15`, `:51`); doing so would mean four copies of the data.
- Per-language URLs, hreflang and translated link previews (D11(b)).
- Romansh. Phones (behind the notice).
- Pointing the SchweizMobil links (`script.js:1364`, `:1407–1413`) at their German, French or Italian pages. The per-language URL patterns were not checked.
- Fee and access values, unless D13(b) is chosen. GPX file names and contents. Console messages.
- The GA4 custom dimension for `ui_language` (a manual step in GA4). `translate="no"` on the icons.

## Appendix: string inventory

Paths are `public/script.js` unless marked otherwise. "Key" is the proposed `strings.js` key.

**A. Page and static elements (12)**

| # | Key | English source | Where | Notes |
|---|---|---|---|---|
| A1 | page.title | Swiss Routes: hiking, cycling and mountain bike routes in Switzerland | index.html:7 (`<title>`), :99 (h1) | Set through `document.title` and h1 `data-i18n`; "Swiss Routes" is the name and stays |
| A2 | panel.label | Map layers | index.html:105 | aria-label |
| A3 | status.loading | Loading map data | index.html:106; script.js:785 | progressbar aria-label and screen-reader status |
| A4 | details.label | Selected item | index.html:113 | aria-label |
| A5 | mapType.label | Map type | index.html:116 | aria-label |
| A6 | mapType.roadmap | Map | index.html:117 | button |
| A7 | mapType.terrain | Terrain | index.html:118 | button |
| A8 | mapType.hybrid | Satellite | index.html:119 | button |
| A9 | zoom.in | Zoom in | index.html:122 | aria-label |
| A10 | zoom.out | Zoom out | index.html:123 | aria-label |
| A11 | smallScreen | Swiss Routes is currently only available for the desktop version | index.html:137 | small-screen h2 |
| A12 | language.label | Language | new (picker) | group aria-label |

**B. Panel sections (9).** Titles are shown in uppercase by CSS (`style.css:188`); write them in normal case.

| # | Key | English | Where | Notes |
|---|---|---|---|---|
| B1 | section.routes | Routes | :472 | |
| B2 | section.stay | Stay | :477 (icon :66) | |
| B3 | section.explore | Explore | :483 (:67) | |
| B4 | section.water | Water | :212 (:68) | |
| B5 | section.bike | Bike support | :232, :161, :171 (:69) | Also the `PLACES.section` match; becomes id `bike` |
| B6 | section.rest | Rest stops | :259 (:70) | |
| B7 | section.nature | Nature | :281 (:71) | |
| B8 | section.favorites | Favorites | :514 (:72) | Only with `?favorites=1` |
| B9 | section.upload | Your track | :517 (:73) | |

**C. Route rows (15)**

| # | Key | English | Where | Notes |
|---|---|---|---|---|
| C1 | level.national | National | :12, shown :555 | Chip; about 69 px with its count (D16) |
| C2 | level.regional | Regional | :13 | Chip |
| C3 | level.local | Local | :14 | Chip |
| C4 | activity.hiking | Hiking | :20, shown :559 | Row name |
| C5 | activity.cycling | Cycling | :31 | |
| C6 | activity.mountainbiking | Mountain biking | :42 | |
| C7 | activity.hiking.chips | Hiking routes | :560 | aria-label; whole phrase replaces `` `${activity.name} routes` `` |
| C8 | activity.cycling.chips | Cycling routes | :560 | |
| C9 | activity.mountainbiking.chips | Mountain biking routes | :560 | |
| C10 | filter.length | Length | :562 | 58 px label column (D16) |
| C11 | filter.min | Min | :590 | placeholder |
| C12 | filter.max | Max | :592 | placeholder |
| C13 | filter.minLabel | {label} minimum in {unit} | :590 | aria-label; label is C10 or I13; unit is km or m |
| C14 | filter.maxLabel | {label} maximum in {unit} | :592 | aria-label |
| C15 | count.of | {shown} of {total} | :694 | Both numbers through `formatNumber` |

**D. Place rows and kinds (72 strings, 2 per row).**
- `place.<id>.name` is the panel row (`:572`).
- `place.<id>.label` is the kind line in details (`:1416` places, `:1506` charging, `:1526` OpenStreetMap). For unnamed OpenStreetMap points it is also the title and the marker title (`:907`); the "Unnamed" column counts those points.

| Id | `.name` (row) | `.label` (kind) | Where (name / label) | Unnamed / total |
|---|---|---|---|---|
| camping | Camping | Campsite | :80 / :81 | |
| backpacker | Backpackers | Backpacker hostel | :89 / :90 | |
| hostel | Hostels | Hostel | :98 / :99 | |
| bnb | B&Bs | B&B | :107 / :108 | Contains `&`; works raw today |
| grouphouse | Group houses | Group house | :116 / :117 | |
| farm | Farm stays | Farm stay | :125 / :126 | |
| sleepingstraw | Sleeping in straw | Sleeping in straw | :134 / :135 | |
| mountainhut | Mountain huts | Mountain hut | :143 / :144 | |
| sightseeing | Sightseeing | Sightseeing | :152 / :153 | Same English; likely plural vs singular elsewhere |
| serviceshop | Bike service | Bike service | :162 / :163 | |
| chargingstation | E-bike charging | E-bike charging station | :172 / :173 | |
| alpinehut | Alpine huts | Alpine hut | :185 | 37 / 455 |
| wildernesshut | Wilderness huts | Wilderness hut | :189 / :190 | 30 / 216 |
| basichut | Basic huts | Basic hut | :193 | 15 / 48 |
| hotel | Hotels | Hotel | :194 | 62 / 3,986 |
| guesthouse | Guest houses | Guest house | :198 / :199 | 57 / 1,010 |
| chalet | Chalets | Chalet | :202 | 139 / 882 |
| campsite | Campsites | Campsite | :203 | 34 / 382 |
| ruins | Ruins | Ruins | :207 | 2,029 / 2,310; same English |
| drinkingwater | Drinking water | Drinking water | :217 / :218 | 14,108 / 15,054 |
| spring | Springs | Spring | :221 | 55 / 69 |
| waterpoint | Water points | Water point | :225 / :226 | 174 / 179 |
| ebikecharging | E-bike charging points | E-bike charging point | :237 / :238 | 160 / 217 |
| bikerepair | Repair stations | Bike repair station | :244 / :245 | 355 / 384 |
| airpump | Air pumps | Air pump | :248 | 166 / 175 |
| bikerental | Bike rental | Bike rental | :252 / :253 | 286 / 1,010 |
| picnicsite | Picnic sites | Picnic site | :261 | 4,814 / 5,669 |
| picnictable | Picnic tables | Picnic table | :265 / :266 | 9,128 / 9,174 |
| firepit | Fire pits | Fire pit | :272 / :273 | 3,891 / 4,206 |
| toilets | Toilets | Toilet | :276 | 5,556 / 5,897 |
| shower | Showers | Shower | :277 | 686 / 703 |
| waterfall | Waterfalls | Waterfall | :283 | 1,157 / 1,523 |
| mountainpass | Mountain passes | Mountain pass | :287 / :288 | 42 / 741 |
| cave | Caves | Cave | :291 | 267 / 623 |
| swimmingarea | Swimming areas | Swimming area | :295 / :296 | 116 / 172 |
| bathingplace | Bathing places | Bathing place | :302 / :303 | 20 / 34 |

**E–K. Other keys (37)**

| # | Key | English | Where | Notes |
|---|---|---|---|---|
| E1 | favorites.hikes | Hikes | :504 | |
| E2 | favorites.places | Places | :510 | |
| F1 | cluster.title | {count} places, click to zoom in | :973 | Bubble marker title; count is always 2 or more |
| F2 | upload.start | Start of {name} | :2037 | name is the GPX's own name |
| F3 | upload.end | End of {name} | :2037 | |
| G1 | status.loaded | Map data loaded | :792 | Screen-reader status |
| H1 | details.close | Close details | :1333 | aria-label |
| H2 | gallery.previous | Previous photo | :1651 | aria-label |
| H3 | gallery.next | Next photo | :1653 | aria-label |
| H4 | action.copyLink | Copy link | :1625, :1726 | |
| H5 | action.linkCopied | Link copied | :1722 | Shown for 2 s |
| I1 | kind.hiking.national | National hiking route | :1357 (from :12 + :21) | Whole phrase |
| I2 | kind.hiking.regional | Regional hiking route | :1357 | |
| I3 | kind.hiking.local | Local hiking route | :1357 | |
| I4 | kind.cycling.national | National cycling route | :1357 (noun :32) | |
| I5 | kind.cycling.regional | Regional cycling route | :1357 | |
| I6 | kind.cycling.local | Local cycling route | :1357 | |
| I7 | kind.mountainbiking.national | National mountain bike route | :1357 (noun :43) | |
| I8 | kind.mountainbiking.regional | Regional mountain bike route | :1357 | |
| I9 | kind.mountainbiking.local | Local mountain bike route | :1357 | |
| I10 | route.logo | Route {number} | :1354 | alt of the logo image |
| I11 | action.downloadGpx | Download GPX | :1362 | |
| I12 | stat.distance | Distance | :1369, :2126 | Tile about 76 px |
| I13 | stat.ascent | Ascent | :1370, :2135; filter :563 | Shared with the filter label |
| I14 | stat.descent | Descent | :1372, :2136 | |
| I15 | stat.asphalt | Asphalt | :1379 | Bike routes |
| J1 | place.showOnGoogleMaps | Show on Google Maps | :1448 | My Switzerland places |
| J2 | stat.elevation | Elevation | :1549 | OpenStreetMap `ele`, 1,439 points |
| J3 | stat.capacity | Capacity | :1553 | 604 points |
| J4 | osm.operator | Operated by {operator} | :1586 | 3,954 points; the value is data |
| J5 | osm.fee | Fee: {fee} | :1591 | 6,619 points; value raw (D13) |
| J6 | osm.access | Access: {access} | :1595 | 5,865 points; value raw |
| K1 | action.uploadGpx | Upload GPX | :1887 | |
| K2 | action.remove | Remove | :1889, :2122 | |
| K3 | upload.notGpx | This is not a GPX file. Choose a .gpx file from a GPS app or route planner. | :1930 | `role="alert"` |
| K4 | upload.noTrack | This GPX file has no track or route with at least two points. | :1970 | `role="alert"` |
| K5 | upload.kind | Your GPX track | :2119 | Kind line |

**L. Written in four languages directly in the HTML, no key (5), and L6 left English**

| # | English | Where |
|---|---|---|
| L1 | Swiss Routes needs JavaScript | index.html:92 |
| L2 | Turn on JavaScript in your browser to see the map. | index.html:93 |
| L3 | This page doesn't exist | 404.html:90 |
| L4 | The address may be mistyped, or the link may be out of date. | 404.html:91 |
| L5 | Back to the map | 404.html:92 |
| L6 | Page not found \| Swiss Routes | 404.html:7. Stays English (D6) |

**M. Stay English, read by crawlers and preview bots (4):** the meta description (index.html:8–9), og:title (:16), og:description (:17–18) and og:image:alt (:23). og:site_name "Swiss Routes" (:15) is the name.

**N. Not translated, checked:**
- Units: km (:562, :1369, :2131), m (:563, :1370, :1374, :1549, :2135, :2136), % (:1381).
- The "–" between filter fields (:591), and the photo counter "N / M" (:1654, :1688).
- Names: SchweizMobil (:1365, :1422), Google Maps (:1424, :1428, :1511, :1536), OpenStreetMap (:1532).
- The picker codes and native names.
- Console texts (:731, :763).
- Analytics ids (:606, :1257–1262, :1716–1720, :1910, :2191).

**O. Strings added by the planned features (29):**
- route-facts (17): `grade.easy`, `grade.medium`, `grade.difficult`, `trail.easy`, `trail.medium`, `filter.grade`, `filter.fitness`, `filter.hiking.grade`, `filter.hiking.fitness`, `filter.cycling.fitness`, `filter.mountainbiking.grade`, `filter.mountainbiking.fitness`, `stat.hikingTime`, `fact.otherDirection`, `route.loop`, `route.ends`, `route.via`.
- elevation-profile (2): `profile.title`, `profile.label`.
- saved-list (8): `section.saved`, `saved.routes`, `saved.places`, `saved.empty`, `action.save`, `action.saved`, `status.saved`, `status.unsaved`.
- photo-spots (2): `photo.title`, `photo.titleShown`.
- url-state: none.
