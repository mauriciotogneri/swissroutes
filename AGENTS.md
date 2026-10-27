# AGENTS.md

Swiss Routes is a static map site. Firebase Hosting serves only `public/`. All map data is downloaded ahead of time by the Node scripts in `bin/` and committed as JSON files. The site never calls the data sources at runtime.

## Sources

| Source                               | What we take                                                                                                                                                                                                     | Endpoints                                                                                                                                                                                                  |
| :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SchweizMobil (Switzerland Mobility)  | Hiking, cycling and mountain-bike routes (national, regional, local) with the height of every route point, sightseeing, bike service shops, campsites, backpackers, farm stays, sleeping in straw, mountain huts | `data.schweizmobil.ch/poi-clusters-prod/21781/clustered_<Type>.geojson` lists the ids of a point layer. `map.schweizmobil.ch/api/4/query/featuresmultilayers?...&<Layer>=<id>` returns one feature in full |
| My Switzerland (Switzerland Tourism) | Hostels, B&Bs, group houses, campsites                                                                                                                                                                           | `myswitzerland.com/api/maps/GetPointsOfInterests/...` returns every POI, filtered locally by category id                                                                                                   |
| Bike Energy (Google My Maps)         | E-bike charging stations                                                                                                                                                                                         | KML export, see step 5 of `.claude/skills/update-data/SKILL.md`                                                                                                                                            |
| OpenStreetMap                        | Drinking water, huts and shelters, bike support, rest stops, nature spots, ruins, water points and showers, hotels, guest houses, chalets, campsites (25 point types, see `bin/osm-downloader.js`)               | `overpass.osm.ch/api/interpreter` (the Swiss OSM community server) returns every match for a tag filter in Switzerland.                                                                                    |
| Federal Roads Office (ASTRA)         | Only to check the saved SchweizMobil routes, nothing is saved: the official hiking, cycling and mountain-bike route files                                                                                        | `data.geo.admin.ch/ch.astra.<layer>/<layer>/<layer>_2056.gpkg`, where the layer is `wanderland`, `veloland` or `mountainbikeland`                                                                          |
| Hand-made                            | Favorites lists, and sightseeing entries with ids 10001 and up                                                                                                                                                   | Edited by hand, no script                                                                                                                                                                                  |

The My Switzerland website, for looking places up by hand: https://www.myswitzerland.com/en-ch

## Folders

| Folder              | Contents                                                                                                                                                                                                        | Written by                                                      | Deployed        |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :-------------- |
| `bin/`              | Download scripts and `ids-generator.js`. `helpers.js` holds the shared fetch, save and coordinate code                                                                                                          | —                                                               | No              |
| `ids/`              | One JSON array of ids per layer, e.g. `ids/hiking/local.json`. Decides which data files the site shows                                                                                                          | The downloaders, except `ids/favorites/`, which is kept by hand | No              |
| `public/data/`      | One JSON file per route or place: `public/data/<group>/<layer>/<id>.json`. OpenStreetMap layers are one file per type: `public/data/osm/<type>.json`                                                            | The downloaders (charging stations by hand)                     | Yes             |
| `public/ids.js`     | Generated `const <NAME>_IDS = [...]` constants, one per `ids/` file, plus `PLACE_COUNTS` (the counts of the OpenStreetMap and charging-station rows), `CHARGING_BOUNDS` and `ROUTE_COLORS` (each route's color) | `bin/ids-generator.js`                                          | Yes, gitignored |
| `public/strings.js` | The interface text in English, Spanish, French, German, Italian and Portuguese, one entry per key                                                                                                               | By hand                                                         | Yes             |
| `scripts/`          | `serve.sh` and `deploy.sh`, which both run `ids-generator.js` first                                                                                                                                             | —                                                               | No              |
| `reference/`        | Files no code reads. `my-switzerland-categories.json` is a May-2024 snapshot of the My Switzerland categories and their ids                                                                                     | By hand                                                         | No              |

## Data flow

```
SchweizMobil / My Switzerland
        │  node bin/*-downloader.js
        ▼
public/data/<group>/<layer>/<id>.json   +   ids/<group>/<layer>.json
                                                    │  node bin/ids-generator.js
                                                    ▼
                                            public/ids.js
        │  browser: index.html loads ids.js, then script.js
        ▼
script.js fetches data/<group>/<layer>/<id>.json for every id of a layer the user turns on
```

The downloaders convert SchweizMobil's Swiss grid coordinates (LV03) to latitude/longitude before saving. Coordinates are stored as `[lat, lng]`, the reverse of the GeoJSON standard, and `script.js` expects that order. Route points add a third value, the height in whole metres from SchweizMobil's own response: `[lat, lng, height]`. The exception is `photo_gallery_coords` in route files, which keeps SchweizMobil's `"[(lng, lat)]"` strings; `script.js` reads them as they are.

## Colors

- Every color in `style.css` is a `light-dark()` token on `:root`, so it follows the theme. A hex value written straight into a style breaks the dark theme.
- Colors set from `script.js` are light/dark pairs (`ROUTE_PALETTE`, `UPLOAD_COLORS`, `CASING_COLORS`), turned into one CSS value by `cssColor`.
- Place pins, their menu icons and the icon at the top of their details take the color of the menu section they are listed in: the `--stay`, `--explore`, `--water`, `--bike`, `--rest` and `--nature` tokens, picked by `GROUP_COLORS` from the place's `group`. The number bubbles and the Saved rows stay in `--ink`, since they mix kinds.
- Every route on the map has its own color from `ROUTE_PALETTE`: `ids-generator.js` picks it so routes of one activity that pass within about 500 m of each other differ, and writes it to `ROUTE_COLORS`. The menu marks each activity with an icon, not a color. A data refresh can change which color a route gets.
- The Google map can't change its color scheme after it is created, so the map and everything drawn on it keep the scheme the page opened with (`MAP_SCHEME`); a switch in the menu changes the panels at once and the map at the next visit.
- The visitor's choice is in localStorage `swissroutes.theme` (`light` or `dark`; no key is Auto, which follows the system).

## Languages

- The interface is in English, Spanish (Spain), French, German, Italian and Portuguese (Portugal), in that order in the menu. Every text the site writes goes through `t()` in `script.js`, with an entry for all six languages in `public/strings.js`. Text in `index.html` carries its key in `data-i18n` (text) or `data-i18n-label` (aria-label). The no-JavaScript notice and `404.html` show all six languages at once.
- SchweizMobil writes the title, summary and description of routes and sightseeing in German, French and Italian as well as English. The downloaders keep the ones that differ from the English in `properties.translations.<de|fr|it>`, and the site shows them in those languages, and the English in the others. A route's SchweizMobil button opens SchweizMobil's page in the same language (`url_de`, `url_fr`, `url_it`, `url_en`). Everything else stays as downloaded: the other SchweizMobil places, My Switzerland names, OpenStreetMap names and values (except `yes` and `no`), charging-station descriptions and the hand-made sightseeing entries.
- The language comes from `?lang=` in the address (read, never written; the picker removes it), then localStorage `swissroutes.language`, then the browser's languages, else English. Numbers use the language's format (`formatNumber`): Swiss for German, French and Italian, Spain's and Portugal's for Spanish and Portuguese.
- A switch changes everything in place, except Google's own map labels, which follow the language at the next visit.
- A new OpenStreetMap type also needs `place.<type>.name` (its row) and `place.<type>.label` (one place) in `strings.js`, along with `bin/osm-downloader.js`, `bin/ids-generator.js` and `osmPlace`.

## Scripts

| Script                        | Downloads                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Writes to `ids/`                         |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------- |
| `route-downloader.js`         | SchweizMobil routes for hiking, cycling and mountain biking at all 3 levels. There is no id list for routes, so it tries every number from 1 to 9 (national), 1 to 99 (regional) and 1 to 999 (local). That is about 3,300 requests made one after another, plus 3 for each route that exists (about 2,400), for its German, French and Italian texts. It keeps SchweizMobil's height of each point and logs `MISSING HEIGHTS: <url>` for a route whose points lack one; such a route is still saved                | `hiking/`, `cycling/`, `mountainbiking/` |
| `other-downloader.js`         | SchweizMobil bike service shops and sightseeing, with 3 more requests per sightseeing place for its German, French and Italian texts                                                                                                                                                                                                                                                                                                                                                                                | `other/serviceshop`, `other/sightseeing` |
| `accommodation-downloader.js` | SchweizMobil campsites, backpackers, sleeping in straw, farm stays and mountain huts; My Switzerland hostels, B&Bs, group houses and campsites                                                                                                                                                                                                                                                                                                                                                                      | `accommodation/*`                        |
| `osm-downloader.js`           | OpenStreetMap places, one query per type (25 types). Writes `public/data/osm/<type>.json`, with no `ids/` list. Drops points within 100 m of a place of the same kind that SchweizMobil or My Switzerland already supply, so run it after the other downloaders                                                                                                                                                                                                                                                     | —                                        |
| `route-checker.js`            | Nothing from SchweizMobil. It downloads the official route files of the Federal Roads Office (`data.geo.admin.ch`, Wanderland, Veloland, Mountainbikeland) into `logs/` and compares them with the saved routes by route number: missing routes, and differing id, length, ascent or descent. It saves no route data. Needs Node 22.18 or newer (`node:sqlite`). Run it with `node --no-warnings`                                                                                                                   | —                                        |
| `cleanup.js`                  | Nothing. It deletes every file in `public/data/` that no `ids/` list refers to, favorites included. It leaves charging stations alone, and any folder with an empty list                                                                                                                                                                                                                                                                                                                                            | —                                        |
| `ids-generator.js`            | Nothing. It reads every `ids/` file, removes duplicates and writes `public/ids.js`. It also counts the entries of every `public/data/osm/` file and of the charging-station files (only those inside the Swiss box), for the row counts. It reads every route file to give each route a color its neighbours don't have. It fails if any of the 21 lists, any listed route file or any OSM file is missing, or if `public/data/osm/` holds a type the generator doesn't list (a new type has to be added there too) | —                                        |

The three SchweizMobil and My Switzerland downloaders are independent of each other. `osm-downloader.js` reads the files they wrote (to drop duplicates), so it runs after them. Inside `accommodation-downloader.js` the order matters: the campsite list combines two sources. The SchweizMobil step writes the list first, and the My Switzerland step right after it adds its own ids.

## Downloading new data

To refresh everything, suggest the user run the `/update-data` skill (user-invoked only). It runs the steps one at a time and holds the guard against running `cleanup.js` after a failed download.

Requires Node 18 or newer (the scripts use the built-in `fetch`). Run everything from the repository root, because all paths are relative.

```sh
node bin/route-downloader.js            # slow: ~3,300 requests, plus ~2,400 for the translations
node bin/other-downloader.js
node bin/accommodation-downloader.js
node bin/osm-downloader.js              # after the three above; 25 queries, about 3 minutes
node bin/cleanup.js                     # deletes files of places that disappeared or got new ids
```

- Charging stations: follow step 5 of `.claude/skills/update-data/SKILL.md` and replace `public/data/other/chargingstations/chargingstations.json`. That layer has no `ids/` file.
- Favorites: edit `ids/favorites/hiking.json` (hiking/local route ids) or `ids/favorites/visit.json` (sightseeing ids). The Favorites section only appears with `?favorites=1` in the URL.

## Ids

- **Routes:** SchweizMobil route numbers.
- **SchweizMobil places:** ids from the cluster lists. SchweizMobil can change the ids it lists; by October 2026 every accommodation id had changed.
- **My Switzerland places:** a 9-digit number (100000000–999999999) hashed from the place's own id. The script stops if two places in one layer would get the same number.
- **Saved lists:** visitors' browsers keep each saved item's data file path, plus `#<OSM id>` for OpenStreetMap places and `#<coordinates>` for charging stations (localStorage `swissroutes.saved`). A changed id or path drops the item from their list, the same way it breaks share links.
- Share links contain the data file path, so an id that changes breaks old links to that place.
- Addresses also hold activity, level and row ids (`hiking=national`, `places=camping,drinkingwater`), the route filters (`hiking.length=5-20`, `hiking.difficulty=easy`) and the map type, so renaming an activity, a level, a `PLACES` id or an OpenStreetMap type breaks that part of old addresses. A `lang` in an address is read but never written.

## When a download fails

- Each request is tried 3 times with a 2-second pause, and an HTTP error status counts as a failure.
- If a request still fails, the script stops before it writes that layer's `ids/` file, so an id list is never replaced by an empty or partial one. An empty id list from SchweizMobil stops it too.
- A route number that doesn't exist is not a failure: SchweizMobil answers it with an empty result.
- A route or sightseeing place that SchweizMobil has no German, French or Italian version of is not a failure: it is logged as `NO TRANSLATION: <url>` and shows in English in that language.
- A route without heights is not a failure: it is saved and logged as `MISSING HEIGHTS`, and the site shows it without an elevation chart.
- The scripts exit with code 0 even when they stop on an error, so read the output. Rerunning the script is safe.
