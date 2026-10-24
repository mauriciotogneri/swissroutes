# AGENTS.md

Swiss Routes is a static map site. Firebase Hosting serves only `public/`. All map data is downloaded ahead of time by the Node scripts in `bin/` and committed as JSON files. The site never calls the data sources at runtime.

## Sources

| Source                               | What we take                                                                                                                                                                | Endpoints                                                                                                                                                                                                  |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SchweizMobil (Switzerland Mobility)  | Hiking, cycling and mountain-bike routes (national, regional, local), sightseeing, bike service shops, campsites, backpackers, farm stays, sleeping in straw, mountain huts | `data.schweizmobil.ch/poi-clusters-prod/21781/clustered_<Type>.geojson` lists the ids of a point layer. `map.schweizmobil.ch/api/4/query/featuresmultilayers?...&<Layer>=<id>` returns one feature in full |
| My Switzerland (Switzerland Tourism) | Hostels, B&Bs, group houses, campsites                                                                                                                                      | `myswitzerland.com/api/maps/GetPointsOfInterests/...` returns every POI, filtered locally by category id                                                                                                   |
| Bike Energy (Google My Maps)         | E-bike charging stations                                                                                                                                                    | Manual export, see [README.md](README.md#generation)                                                                                                                                                       |
| Hand-made                            | Favorites lists, and sightseeing entries with ids 10001 and up                                                                                                              | Edited by hand, no script                                                                                                                                                                                  |

## Folders

| Folder            | Contents                                                                                                                    | Written by                                                      | Deployed        |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :-------------- |
| `bin/`            | Download scripts and `ids-generator.js`. `helpers.js` holds the shared fetch, save and coordinate code                      | —                                                               | No              |
| `ids/`            | One JSON array of ids per layer, e.g. `ids/hiking/local.json`. Decides which data files the site shows                      | The downloaders, except `ids/favorites/`, which is kept by hand | No              |
| `public/data/`    | One JSON file per route or place: `public/data/<group>/<layer>/<id>.json`                                                   | The downloaders (charging stations by hand)                     | Yes             |
| `public/ids.js`   | Generated `const <NAME>_IDS = [...]` constants, one per `ids/` file                                                         | `bin/ids-generator.js`                                          | Yes, gitignored |
| `scripts/`        | `serve.sh` and `deploy.sh`, which both run `ids-generator.js` first                                                         | —                                                               | No              |
| `my-switzerland/` | A May-2024 snapshot of the My Switzerland POI list and categories. No code reads it; it's handy for looking up category ids | By hand                                                         | No              |

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

The downloaders convert SchweizMobil's Swiss grid coordinates (LV03) to latitude/longitude before saving. Coordinates are stored as `[lat, lng]`, the reverse of the GeoJSON standard, and `script.js` expects that order.

## Scripts

| Script                        | Downloads                                                                                                                                                                                                                                                  | Writes to `ids/`                         |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| `route-downloader.js`         | SchweizMobil routes for hiking, cycling and mountain biking at all 3 levels. There is no id list for routes, so it tries every number from 1 to 9 (national), 1 to 99 (regional) and 1 to 999 (local). That is about 3,300 requests made one after another | `hiking/`, `cycling/`, `mountainbiking/` |
| `other-downloader.js`         | SchweizMobil bike service shops and sightseeing                                                                                                                                                                                                            | `other/serviceshop`, `other/sightseeing` |
| `accommodation-downloader.js` | SchweizMobil campsites, backpackers, sleeping in straw, farm stays and mountain huts; My Switzerland hostels, B&Bs, group houses and campsites                                                                                                             | `accommodation/*`                        |
| `ids-generator.js`            | Nothing. It reads every `ids/` file, removes duplicates and writes `public/ids.js`. It fails if any of the 21 lists is missing                                                                                                                             | —                                        |

The three downloaders are independent of each other. Inside `accommodation-downloader.js` the order matters: the campsite list combines two sources. The SchweizMobil step writes the list first, and the My Switzerland step right after it adds its own ids.

## Downloading new data

Requires Node 18 or newer (the scripts use the built-in `fetch`). Run everything from the repository root, because all paths are relative.

```sh
node bin/route-downloader.js            # slow: ~3,300 requests
node bin/other-downloader.js
node bin/accommodation-downloader.js
```

- Charging stations: follow the steps in [README.md](README.md#generation) and replace `public/data/other/chargingstations/chargingstations.json`. That layer has no `ids/` file.
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
- The scripts exit with code 0 even when they stop on an error, so read the output. Rerunning the script is safe.

## Known gaps

- The downloaders never delete files. Places that disappear or get new ids leave old files in `public/data/`, which are deployed but never loaded. To clean up, delete the files whose id is not in the matching `ids/` list.
