# AGENTS.md

Swiss Routes is a static map site. Firebase Hosting serves only `public/`. All map data is downloaded ahead of time by the Node scripts in `bin/` and committed as JSON files. The site never calls the data sources at runtime.

## Sources

| Source                               | What we take                                                                                                                                                                              | Endpoints                                                                                                                                                                                                  |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SchweizMobil (Switzerland Mobility)  | Hiking, cycling and mountain-bike routes (national, regional, local) with the height of every route point, sightseeing, bike service shops, campsites, backpackers, farm stays, sleeping in straw, mountain huts | `data.schweizmobil.ch/poi-clusters-prod/21781/clustered_<Type>.geojson` lists the ids of a point layer. `map.schweizmobil.ch/api/4/query/featuresmultilayers?...&<Layer>=<id>` returns one feature in full |
| My Switzerland (Switzerland Tourism) | Hostels, B&Bs, group houses, campsites                                                                                                                                                    | `myswitzerland.com/api/maps/GetPointsOfInterests/...` returns every POI, filtered locally by category id                                                                                                   |
| Bike Energy (Google My Maps)         | E-bike charging stations                                                                                                                                                                  | KML export, see step 5 of `.claude/skills/update-data/SKILL.md`                                                                                                                                            |
| OpenStreetMap                        | Drinking water, huts and shelters, bike support, rest stops, nature spots, ruins, water points and showers, hotels, guest houses, chalets, campsites (25 point types, see `bin/osm-downloader.js`) | `overpass.osm.ch/api/interpreter` (the Swiss OSM community server) returns every match for a tag filter in Switzerland.                                                                                    |
| Federal Roads Office (ASTRA)         | Only to check the saved SchweizMobil routes, nothing is saved: the official hiking, cycling and mountain-bike route files                                                                 | `data.geo.admin.ch/ch.astra.<layer>/<layer>/<layer>_2056.gpkg`, where the layer is `wanderland`, `veloland` or `mountainbikeland`                                                                          |
| Hand-made                            | Favorites lists, and sightseeing entries with ids 10001 and up                                                                                                                            | Edited by hand, no script                                                                                                                                                                                  |

The My Switzerland website, for looking places up by hand: https://www.myswitzerland.com/en-ch

## Folders

| Folder          | Contents                                                                                                                                                                   | Written by                                                      | Deployed        |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :-------------- |
| `bin/`          | Download scripts and `ids-generator.js`. `helpers.js` holds the shared fetch, save and coordinate code                                                                     | —                                                               | No              |
| `ids/`          | One JSON array of ids per layer, e.g. `ids/hiking/local.json`. Decides which data files the site shows                                                                     | The downloaders, except `ids/favorites/`, which is kept by hand | No              |
| `public/data/`  | One JSON file per route or place: `public/data/<group>/<layer>/<id>.json`. OpenStreetMap layers are one file per type: `public/data/osm/<type>.json`                       | The downloaders (charging stations by hand)                     | Yes             |
| `public/ids.js` | Generated `const <NAME>_IDS = [...]` constants, one per `ids/` file, plus `PLACE_COUNTS` (the counts of the OpenStreetMap and charging-station rows) and `CHARGING_BOUNDS` | `bin/ids-generator.js`                                          | Yes, gitignored |
| `scripts/`      | `serve.sh` and `deploy.sh`, which both run `ids-generator.js` first                                                                                                        | —                                                               | No              |
| `reference/`    | Files no code reads. `my-switzerland-categories.json` is a May-2024 snapshot of the My Switzerland categories and their ids                                                | By hand                                                         | No              |

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

## Scripts

| Script                        | Downloads                                                                                                                                                                                                                                                                                                                                                                                                    | Writes to `ids/`                         |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| `route-downloader.js`         | SchweizMobil routes for hiking, cycling and mountain biking at all 3 levels. There is no id list for routes, so it tries every number from 1 to 9 (national), 1 to 99 (regional) and 1 to 999 (local). That is about 3,300 requests made one after another. It keeps SchweizMobil's height of each point and logs `MISSING HEIGHTS: <url>` for a route whose points lack one; such a route is still saved    | `hiking/`, `cycling/`, `mountainbiking/` |
| `other-downloader.js`         | SchweizMobil bike service shops and sightseeing                                                                                                                                                                                                                                                                                                                                                              | `other/serviceshop`, `other/sightseeing` |
| `accommodation-downloader.js` | SchweizMobil campsites, backpackers, sleeping in straw, farm stays and mountain huts; My Switzerland hostels, B&Bs, group houses and campsites                                                                                                                                                                                                                                                               | `accommodation/*`                        |
| `osm-downloader.js`           | OpenStreetMap places, one query per type (25 types). Writes `public/data/osm/<type>.json`, with no `ids/` list. Drops points within 100 m of a place of the same kind that SchweizMobil or My Switzerland already supply, so run it after the other downloaders                                                                                                                                              | —                                        |
| `route-checker.js`            | Nothing from SchweizMobil. It downloads the official route files of the Federal Roads Office (`data.geo.admin.ch`, Wanderland, Veloland, Mountainbikeland) into `logs/` and compares them with the saved routes by route number: missing routes, and differing id, length, ascent or descent. It saves no route data. Needs Node 22.18 or newer (`node:sqlite`). Run it with `node --no-warnings`            | —                                        |
| `cleanup.js`                  | Nothing. It deletes every file in `public/data/` that no `ids/` list refers to, favorites included. It leaves charging stations alone, and any folder with an empty list                                                                                                                                                                                                                                     | —                                        |
| `ids-generator.js`            | Nothing. It reads every `ids/` file, removes duplicates and writes `public/ids.js`. It also counts the entries of every `public/data/osm/` file and of the charging-station files (only those inside the Swiss box), for the row counts. It fails if any of the 21 lists or any OSM file is missing, or if `public/data/osm/` holds a type the generator doesn't list (a new type has to be added there too) | —                                        |

The three SchweizMobil and My Switzerland downloaders are independent of each other. `osm-downloader.js` reads the files they wrote (to drop duplicates), so it runs after them. Inside `accommodation-downloader.js` the order matters: the campsite list combines two sources. The SchweizMobil step writes the list first, and the My Switzerland step right after it adds its own ids.

## Downloading new data

To refresh everything, suggest the user run the `/update-data` skill (user-invoked only). It runs the steps one at a time and holds the guard against running `cleanup.js` after a failed download.

Requires Node 18 or newer (the scripts use the built-in `fetch`). Run everything from the repository root, because all paths are relative.

```sh
node bin/route-downloader.js            # slow: ~3,300 requests
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
- Share links contain the data file path, so an id that changes breaks old links to that place.

## When a download fails

- Each request is tried 3 times with a 2-second pause, and an HTTP error status counts as a failure.
- If a request still fails, the script stops before it writes that layer's `ids/` file, so an id list is never replaced by an empty or partial one. An empty id list from SchweizMobil stops it too.
- A route number that doesn't exist is not a failure: SchweizMobil answers it with an empty result.
- A route without heights is not a failure: it is saved and logged as `MISSING HEIGHTS`, and the site shows it without an elevation chart.
- The scripts exit with code 0 even when they stop on an error, so read the output. Rerunning the script is safe.
