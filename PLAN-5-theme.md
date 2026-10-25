# Theme: light, dark or the system's

**Goal**: Visitors can pick a light or dark look from the header menu, or leave it on Auto to follow their system. The panels, map controls and notices switch at once. The Google map and everything drawn on it (routes, plates, pins, bubbles) take the theme the page opened with, because Google only sets the map's color scheme when the map is created.

## What the user sees

1. **First visit.** Auto: a system set to dark gives the dark look from the first paint, with no white flash. Everything else gives today's light look, unchanged.
2. **The Theme row in the menu.**
   - Open ☰: a row with a half-circle icon and three buttons, **Auto Light Dark**, with the current one pressed. It is styled like the Map / Terrain / Satellite buttons.
   - It sits below the Language row (languages plan) and above Upload GPX. Until languages are built, it is the first row.
3. **Switching.**
   - Clicking Dark turns the panels, the map-type and zoom buttons, the tooltip and the scrollbars dark at once. The menu stays open with focus on Dark.
   - The map keeps its scheme until the next visit. Below the row, a line says "The map switches the next time you open Swiss Routes". It shows only while the map and the panels disagree, so clicking back hides it.
   - Nothing reloads and nothing is lost: rows, filters, the open item, its photo, the uploaded track and every scroll position stay.
4. **Next visit.** The choice is remembered. Auto is stored as no choice, so a later change of system theme is followed.
5. **Auto while the page is open.** If the system turns dark at sunset, the panels follow at once and the map at the next visit. No hint is shown, because the visitor did nothing.
6. **The dark map.**
   - Roadmap and terrain use Google's dark map. Hybrid is light only, per Google, so satellite looks the same in both themes.
   - Route lines, plates and pins use lighter colors that stand out on dark ground. A selected route's casing is dark instead of white. Place pins turn light with a dark rim.
7. **Other pages.** The no-JavaScript notice follows the system. The "desktop only" notice and the 404 page follow the stored choice, then the system.
8. **Old browsers.** Browsers older than spring 2024 (no CSS `light-dark()`) get today's light look, and the Theme row is hidden.

## Decisions

**D1. Which modes**
- **(a) Auto, Light and Dark, starting on Auto (recommended).** Most visitors who want dark already set it in their system and never touch the row. Auto keeps following the system after a visit.
- (b) Light and Dark only, the first visit following the system. One button fewer, but once a visitor picks, a later system change is ignored, and there is no way back to following it.
- (c) Light and Dark, starting on Light. Every dark-system visitor gets a white page first.

**D2. The control**
- **(a) A menu row of three pressed buttons, sharing the `.menu-choice` class with the language row (recommended).** One click to any mode, the current mode always visible, and it matches Map / Terrain / Satellite.
- (b) One menu entry, "Dark mode", that switches on and off. Goes with D1(b) only.
- (c) One entry that cycles Auto → Light → Dark. Hides the next state, and reaching Auto from Light takes two clicks.

**D3. Remembering the choice**
- **(a) localStorage `swissroutes.theme`, holding `light` or `dark`; Auto is no key (recommended).** It follows the saved-list plan's `swissroutes.saved`. The inline head script reads it before the body is parsed, so the first paint is already right. Blocked storage falls back to Auto; a choice then lasts until the page closes.
- (b) Not remembered: every visit starts on Auto.

**D4. The Google map**

Google's `colorScheme` option can only be set when the map is created; setting it later has no effect (developers.google.com/maps/documentation/javascript/mapcolorscheme). The style option that could change at runtime doesn't work with a map ID, and advanced markers need one.
- **(a) The map and everything drawn on it keep the theme the page opened with. A switch changes the panels at once and the map at the next visit, with the hint line (recommended).** No extra code to rebuild the map, and no extra billed map load. The cost: dark panels beside a light map (or the reverse) until the next visit, which only visitors who switch by hand ever see.
- (b) Create a new map on every switch. Everything matches at once, but every line, plate, pin, bubble, photo pin and track end has to be moved to the new map, and its listeners added again. Google's FAQ says reloading the Map class can be billed as another map load.
- (c) Reload the page on every switch. Everything matches, and the address brings back rows, filters, position, map type and the open item. Lost: the uploaded track, the photo shown, the open sections and both scroll positions. Also another map load and every data file again (from the browser cache while it is fresh).
- (d) The map always stays light; only the panels go dark. Least code, and no route or pin color changes, but a bright map in a dark interface defeats dark mode at night.

**D5. How the colors switch in CSS**
- **(a) `light-dark()` with `color-scheme` (recommended).**
  - Each token is written once: `--paper: light-dark(#ffffff, #1a2128)`.
  - `:root` gets `color-scheme: light dark` (Auto), or `light` or `dark` from `data-theme`. `color-scheme` also darkens the scrollbars and the number inputs, which today use the browser's light defaults.
  - `#map` gets its own fixed `color-scheme` from the scheme the map opened with. Custom properties are filled in where they are used, so the pins and plates inside `#map` take the map's side of each token while the panels take the page's. This is what makes D4(a) work with one set of tokens. Assumption: browsers resolve `light-dark()` inside a `var()` by the color scheme of the element using it. It is checked first (Verification step 1).
  - Browsers without `light-dark()` (before Chrome 123, Firefox 120, Safari 17.5) would lose every token color. An `@supports not (color: light-dark(#fff, #000))` block gives them the light values and hides the Theme row.
- (b) Two copies of the dark tokens, one under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and one under `:root[data-theme="dark"]`, plus a third for `#map` under D4(a). Works in older browsers, but every dark color is written three times.

**D6. Route, upload and pin colors on the dark map**

Contrast against a dark gray ground (#2a2a2a; Google's actual dark map color not checked), worked out by hand: hiking #d52b1e reaches 2.9:1, cycling #0b5cad and mountain biking #0e6b35 about 2.2:1. Lines and plates need 3:1.
- **(a) A lighter color of each for dark (recommended).** Starting points, to be tuned by eye: hiking #ff6b5f, cycling #5ea6f2, mountain biking #4cbf7a, uploaded track #c77ddb, which give about 5–6:1 on that gray. Text on colored fills (plates, pressed chips, pin icons) uses `--paper`, which turns dark together with them, and keeps about 6:1. Place pins use `var(--ink)`, so they turn light with a dark rim.
- (b) Keep today's colors in both themes. No new values, but cycling and mountain-biking lines and plates are hard to see on the dark map.

**D7. The 404 page and the notices**
- **(a) The 404 page gets the same tokens and a 4-line head script that reads `swissroutes.theme` (recommended).** A visitor who picked Light doesn't get a dark 404. The `<noscript>` notice follows the system through `color-scheme: light dark`, since no script can run there.
- (b) The 404 page follows the system only: no script, but it can disagree with the visitor's choice.
- (c) The 404 page stays light.

**D8. Analytics**
- **(a) `track("theme_change", { theme })` with `auto`, `light` or `dark` (recommended).** Shows whether anyone uses the row. GA4 already reports nothing about the system theme.
- (b) Also a `ui_theme` parameter on every event, like the languages plan's `ui_language`. Says how many visits are dark, but needs a custom dimension in GA4 and a look-up of `matchMedia` on every event.
- (c) No event.

**D9. Unchanged**: the browser's `theme-color` (#d52b1e in both, the brand bar), the Swiss cross in the notices and the favicon (red and white work on both grounds), and the SchweizMobil route-sign images in details (raster images with their own background).

## Colors

The dark values are starting points to tune by eye in Verification step 4. Light values are today's, unchanged.

| Token | Light (today) | Dark | Used for |
|---|---|---|---|
| `--paper` | #ffffff | #1a2128 | Panels, menu, controls; text on colored fills |
| `--ink` | #22303c | #e4e9ed | Text; badge, tooltip and pressed-button fills; place pins |
| `--ink-soft` | #5b6875 | #9ba7b2 | Secondary text and icons |
| `--rule` | #dde2e6 | #313b44 | Dividers and borders |
| `--mist` | #f1f4f6 | #252e36 | Hover fills; the page behind the map before it loads |
| `--red` | #d52b1e | #ff6b5f | Focus ring, errors, progress bar, link hover. #d52b1e on #1a2128 is only about 3.5:1, under the 4.5:1 the error text needs |
| `--shade` (new) | rgb(34 48 60) | rgb(0 0 0) | The base of every shadow, mixed down with `color-mix()` |
| `--placeholder` (new) | #9aa4ad | #6b7782 | "Min" / "Max" in the filter boxes |

Colors set from `script.js` become light/dark pairs:

| Name | Light (today) | Dark |
|---|---|---|
| Hiking | #d52b1e | #ff6b5f |
| Cycling | #0b5cad | #5ea6f2 |
| Mountain biking | #0e6b35 | #4cbf7a |
| Uploaded track (also `.track-end-start` in CSS) | #7a2e8e | #c77ddb |
| Selected route and uploaded track casing | #ffffff | #1a2128 (the dark `--paper`) |
| Place pins and kind icons (`GROUP_COLORS`) | #22303c | become `var(--ink)` |

## Implementation steps

**Order of work:**
1. Steps 1–2 and 7–9 with the dark values set equal to the light ones. The site must look exactly as today. Verify.
2. The dark values, then steps 3–6 and 10–14.
3. Verification.

### public/index.html
1. **Inline head script** (lines 51–63), appended in the file's style (single quotes, no semicolons):
   ```js
   // The visitor's theme, 'light' or 'dark'. Nothing stored means Auto: the system decides through color-scheme in style.css
   const THEME_KEY = 'swissroutes.theme'

   let storedTheme = undefined

   try {
     storedTheme = localStorage.getItem(THEME_KEY)
   } catch (error) {
     // Blocked storage: Auto
   }

   const PAGE_THEME = ['light', 'dark'].includes(storedTheme) ? storedTheme : 'auto'

   if (PAGE_THEME !== 'auto') {
     document.documentElement.dataset.theme = PAGE_THEME
   }
   ```
   It already runs before the body is parsed, so the first paint has the right colors. The languages plan moves this block up and adds its own storage read; keep the two reads in separate try/catch blocks.
2. **Icon:** add `contrast` to `icon_names`, between `close` and `cottage` (alphabetical).
3. **Theme row**, in `#menu`: after the language row if it exists, else first, before `#uploadButton`:
   ```html
   <div class="menu-choice" id="themeRow" role="group" aria-label="Theme">
     <span class="material-symbols-outlined" aria-hidden="true">contrast</span>
     <button type="button" data-theme-choice="auto" aria-pressed="true">Auto</button>
     <button type="button" data-theme-choice="light" aria-pressed="false">Light</button>
     <button type="button" data-theme-choice="dark" aria-pressed="false">Dark</button>
   </div>
   <p class="menu-hint" id="themeHint" hidden>The map switches the next time you open Swiss Routes.</p>
   ```

### public/404.html
4. Its `:root` (lines 17–23) gets `color-scheme: light dark`, the same `light-dark()` values for its five tokens, and the two `[data-theme]` rules from step 7. Its `<head>` gets the step 1 script without the comment lines. Its own `theme-color` stays.

### public/script.js
Follow the file's style: double quotes, semicolons, braces on every `if`, trailing commas, short comments that say why.

5. **Color pairs.**
   - `ACTIVITIES` (lines 25, 40, 51): `color: "#d52b1e"` becomes `colors: { light: "#d52b1e", dark: "#ff6b5f" }`, and the same for cycling and mountain biking (values in Colors).
   - `UPLOAD_COLOR` (line 62) becomes `UPLOAD_COLORS = { light: "#7a2e8e", dark: "#c77ddb" }`. Comment: "keep in sync with .track-end-start in style.css".
   - New `CASING_COLORS = { light: "#ffffff", dark: "#1a2128" }`, with "the map's --paper, which Google's lines can't read from CSS".
   - `GROUP_COLORS` (lines 70–73): both become `"var(--ink)"`. Comment: "a token, so pins and kind icons follow the theme of where they are drawn".
   - New helper:
     ```js
     // A color pair as one CSS value, which takes the side of the color scheme where it is used: the page's in the panels, the map's on it
     function cssColor(colors) {
       return `light-dark(${colors.light}, ${colors.dark})`;
     }
     ```
6. **The map's scheme**, after `SMALL_SCREEN` (line 351):
   ```js
   // Google sets the map's colors only when it is created, so the map and everything drawn on it keep the theme the page opened with
   const MAP_SCHEME =
     CSS.supports("color", "light-dark(#fff, #000)") &&
     (PAGE_THEME === "dark" ||
       (PAGE_THEME === "auto" && matchMedia("(prefers-color-scheme: dark)").matches))
       ? "dark"
       : "light";
   ```
7. **`mapLoaded`** (lines 384–394):
   - Add `colorScheme: MAP_SCHEME === "dark" ? "DARK" : "LIGHT",` to the map options. Google accepts the plain strings.
   - Before `new google.maps.Map`: `document.getElementById("map").style.colorScheme = MAP_SCHEME;`.
8. **Where colors are used.**
   - `buildRoute` (line 928): `color: cssColor(activity.colors)` and a new `lineColor: activity.colors[MAP_SCHEME]`. `plate(…)` (line 944) gets `cssColor(activity.colors)`.
   - `lineStyle` (line 1331): `strokeColor: item.lineColor`.
   - `styleRoute` casing (line 1320) and the upload casing (line 2641): `strokeColor: CASING_COLORS[MAP_SCHEME]`.
   - The upload item (line 2616): `color: cssColor(UPLOAD_COLORS)` and `lineColor: UPLOAD_COLORS[MAP_SCHEME]`.
   - `activityRow` (line 621) and the Favorites hiking row (line 561): `cssColor(activity.colors)`.
   - Unchanged, because they already pass `item.color` or `GROUP_COLORS` on as a `--color` value, which now holds `light-dark(…)` or `var(--ink)`: `toggleRow`, `markerIcon` (line 1062), the details kind lines (1589, 1679, 1699), `plateBadge` (1863), `photoPin` (2060), the profile (2234), the profile marker (2302) and `uploadDetails` (2746).
9. **Nothing else reads `.color` as a hex value** (`grep -n "\.color\b" public/script.js` lists only the uses above). Check again before building, in case another plan adds one.
10. **Theme switching**, a new `// Theme` section before `// Menu`:
    ```js
    // The scheme the panels show now: the visitor's pick, or the system's under Auto
    function pageScheme(theme) {
      if (theme !== "auto") {
        return theme;
      }

      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    ```
    `setTheme(theme)`:
    1. Return if `theme` is the pressed button's value.
    2. If `theme === "auto"`, delete `document.documentElement.dataset.theme`; else set it.
    3. Store it in try/catch: `removeItem(THEME_KEY)` for Auto, else `setItem(THEME_KEY, theme)`. Comment: "blocked storage: the choice lasts until the page closes".
    4. Set `aria-pressed` on every `[data-theme-choice]`.
    5. `document.getElementById("themeHint").hidden = pageScheme(theme) === MAP_SCHEME;`
    6. `track("theme_change", { theme: theme });`
11. **`bindControls`**, after the map-type loop: bind each `[data-theme-choice]` click to `setTheme(button.dataset.themeChoice)`, and set each button's starting `aria-pressed` from `PAGE_THEME`.
12. **`openMenu`**: focus `menu.querySelector("button:not([hidden])")` instead of the first `.menu-item`, so focus lands on the first row whatever it is (Auto until languages are built, DE after). The languages plan needs the same change; whichever lands first makes it.

### public/style.css
13. **Tokens** (lines 1–16):
    - Each color token becomes `light-dark(<today>, <dark>)` from Colors. Add `--shade` and `--placeholder`.
    - `--shadow`: its two `rgb(34 48 60 / …)` become `color-mix(in srgb, var(--shade) 12%, transparent)` and `… 18% …`.
    - After `:root`:
      ```css
      /* Auto follows the system. script.js gives #map the scheme the map opened with, so what is drawn on it matches Google's colors */
      :root {
        color-scheme: light dark;
      }

      :root[data-theme="light"] {
        color-scheme: light;
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
      }

      /* Browsers without light-dark() keep today's look and get no Theme row */
      @supports not (color: light-dark(#fff, #000)) {
        :root {
          color-scheme: light;
          --paper: #ffffff;
          /* …every token's light value… */
        }

        #themeRow {
          display: none;
        }
      }
      ```
14. **Hardcoded values** (line numbers as of this plan):
    - `.chip[aria-pressed="true"] .chip-count` (446): `color-mix(in srgb, var(--paper) 78%, transparent)`.
    - `.range input::placeholder` (489): `var(--placeholder)`.
    - `.media-button, .details-close` (561–562): background `color-mix(in srgb, var(--paper) 92%, transparent)`, shadow color `color-mix(in srgb, var(--shade) 30%, transparent)`.
    - `.media-counter` (589): `color-mix(in srgb, var(--ink) 78%, transparent)`. With its `--paper` text, the pair turns over together.
    - The five `rgb(34 48 60 / 0.45)` shadows (932, 950, 983, 1012, 1032) and the selected marker's (963): `color-mix(in srgb, var(--shade) 45%, transparent)`.
    - `.track-end-start` (1017): `light-dark(#7a2e8e, #c77ddb)`, with "keep in sync with UPLOAD_COLORS in script.js".
15. **Menu row and hint**, after `.menu-item .material-symbols-outlined`:
    - `.menu-choice`: as in the languages plan's step 21, if it isn't there yet. Add `.menu-choice button` to the three `.map-type button` rules.
    - `.menu-hint { margin: 0; padding: 0 20px 8px 52px; color: var(--ink-soft); font-size: 12.5px; }`, so the text starts under the buttons, not the icon. `.menu-hint[hidden] { display: none; }`.

### AGENTS.md
16. A short "Colors" note: every color in `style.css` is a `light-dark()` token; colors set from `script.js` come as light/dark pairs; the map and what is drawn on it use the scheme the page opened with (`MAP_SCHEME`); the visitor's choice is in localStorage `swissroutes.theme`.

**Unchanged:** `firebase.json`, `bin/`, `ids/`, `public/data/`, the favicon.

## Interactions with the other planned features

- **Header menu (built):** the row goes into `#menu` before `#uploadButton`. `closeMenu` doesn't touch it. Step 12 changes `openMenu`'s focus target.
- **Languages (`PLAN-4-languages.md`):**
  - 5 strings: `theme.label` "Theme" (the row's aria-label), `theme.auto`, `theme.light`, `theme.dark`, and `theme.mapLater` (the hint). They are tagged with `data-i18n` / `data-i18n-label` like the rest of `#menu`.
  - Both plans add the `.menu-choice` CSS and change `openMenu`; whichever lands first does it.
  - Both read storage in the inline head script; that plan moves the block above the stylesheets, which is still before the body.
  - Its D10 creates the Maps script from the head script; `colorScheme` is a map option, not a script parameter, so the two don't overlap.
- **Saved list (`PLAN-2-saved-list.md`):** its filled star uses `--red` and its ☰ badge uses `.badge`, so both follow the theme. Its group in the menu sits below this row.
- **All features:** a new color must be a `light-dark()` token in CSS, or a light/dark pair in JS passed through `cssColor`. A hex value written straight into a style breaks the dark theme.

## Edge cases and risks

- **The map lags behind a switch** (D4a) until the next visit, and behind a system change under Auto. The hint covers only the first.
- **The dark Google map with `DEMO_MAP_ID`** is not described in Google's docs; it is assumed to be Google's default dark map. Checked in Verification step 3. `DEMO_MAP_ID` is also not meant for production (Google's reference), which is true today already.
- **Google's own map UI** (attribution, keyboard-shortcuts dialog) gets dark styles in recent releases, per Google's release notes; not checked. `color-scheme` on `#map` may also change the default colors of Google's form controls; not checked.
- **`light-dark()` inside `var()`** is assumed to resolve by the element using it. If it resolves at `:root` instead, the map's pins and plates follow the page, not the map; the fallback is to set the overlay tokens on `#map` as plain values from JS. Checked first.
- **Contrast values** in D6 and Colors were worked out by hand against an assumed #2a2a2a map; check them on the real dark map.
- **Two tabs:** a switch in one applies to the other at its next load.
- **Blocked storage:** the switch works for the session; a reload goes back to Auto.
- **Chrome's automatic dark mode** for web pages leaves pages that declare `color-scheme` alone (assumption, from Chrome's documentation of forced dark).
- **A raw description** from the data with its own inline colors would ignore the theme. None found in `public/data` today.

## Verification

Run `scripts/serve.sh` and open http://localhost:5000 in a window at least 1024 px wide. Switch the system theme with DevTools › Rendering › "Emulate CSS media feature prefers-color-scheme".

1. **The token mechanism, first.** Set the emulation to dark with `swissroutes.theme` cleared, and reload. Then, in the console: `getComputedStyle(document.querySelector(".marker")).backgroundColor` (with a place row on) is the dark-scheme pin color. Choose Light from the menu: the panel turns light, and the same call gives the same value as before (the pin keeps the map's scheme).
2. **No change in light.** With the emulation on light: compare screenshots of the panel, a route's details, the open menu and the map with today's site. They must match.
3. **The dark map.** Emulation dark, reload: Google's labels and land are dark. Terrain is dark. Satellite looks as before.
4. **Dark details, by eye.** With every kind of row on: route lines and plates of all three activities, place pins, bubbles (and hover), a selected route with its casing, the elevation chart, photo arrows and counter, a pressed level chip with its count, the filter placeholders, an uploaded track with both ends, the tooltip, the scrollbars, focus rings. Tune the Colors values here.
5. **Switching.** Light map, then Dark in the menu: the panels turn dark, the menu stays open with focus on Dark, the hint shows. Click Light: the hint hides. Network shows no requests.
6. **Remembered.** Pick Dark and reload: dark from the first paint, with no white flash (DevTools › Performance, screenshots on). `swissroutes.theme` is `dark`. Pick Auto: the key is gone.
7. **Auto follows the system live.** On Auto, flip the emulation: the panels follow; the map doesn't; no hint.
8. **Blocked storage.** Chrome › Site settings › "Not allowed to save data" for `localhost:5000`: the page loads on Auto with no console errors; switching works; a reload goes back to Auto.
9. **Old browsers.** In the console, check that the `@supports` block lists every token. If an old browser is at hand, the page is light and has no Theme row.
10. **Other pages.** With Dark picked: `/does-not-exist` is dark. A window under 1024 px: the notice is dark. JavaScript off (DevTools › Settings › Debugger) with the emulation on dark: the notice is dark.
11. **Keyboard.** Tab to ☰, press Enter: focus is on the first row's first button. The Tab order continues Auto, Light, Dark, then Upload GPX.
12. **Analytics.** Network, filter `collect`: `en=theme_change` with `ep.theme`.

## Out of scope

- Changing the map's scheme without a new visit (D4b, D4c).
- A per-scheme `theme-color`, a dark favicon, a dark link-preview image.
- Syncing the choice between open tabs (`storage` event).
- A high-contrast theme.
- Cloud styling for the map (needs a real map ID instead of `DEMO_MAP_ID`).
