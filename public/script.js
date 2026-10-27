"use strict";

// The map opens fitted to this area: zoom 9 around Lucerne on a 1920 × 1080 screen, one step further out on smaller windows
const INITIAL_VIEW = {
  north: 47.59,
  south: 45.9,
  east: 10.2,
  west: 6.08,
};

const LEVELS = [
  { id: "national", weight: 5, zIndex: 30 },
  { id: "regional", weight: 4, zIndex: 20 },
  { id: "local", weight: 3, zIndex: 10 },
];

// SchweizMobil rates every route easy, medium or difficult for fitness (category_condition), and hiking and mountain bike routes for difficulty too (category_grade)
const GRADES = ["easy", "medium", "difficult"];

const ACTIVITIES = [
  {
    id: "hiking",
    icon: "hiking",
    ids: {
      national: HIKING_NATIONAL_IDS,
      regional: HIKING_REGIONAL_IDS,
      local: HIKING_LOCAL_IDS,
    },
    // The grade follows the trail type. No hiking route is difficult today, but the chip is shown so both Difficulty rows offer all three grades
    grades: ["easy", "medium", "difficult"],
    // The grades whose trail type is named (trail.<grade> in strings.js)
    trails: ["easy", "medium"],
  },
  // Cycling routes have no difficulty grade, only fitness
  {
    id: "cycling",
    // pedal_bike is the bike rental icon
    icon: "directions_bike",
    ids: {
      national: CYCLING_NATIONAL_IDS,
      regional: CYCLING_REGIONAL_IDS,
      local: CYCLING_LOCAL_IDS,
    },
  },
  {
    id: "mountainbiking",
    // The icon font has no mountain bike
    icon: "terrain",
    ids: {
      national: MOUNTAINBIKING_NATIONAL_IDS,
      regional: MOUNTAINBIKING_REGIONAL_IDS,
      local: MOUNTAINBIKING_LOCAL_IDS,
    },
    grades: ["easy", "medium", "difficult"],
  },
];

// The colors of the routes on the map. bin/ids-generator.js gives every route one of them in ROUTE_COLORS, so routes that pass close to each other differ.
// Each pair keeps the number plate's text readable, and none is close to UPLOAD_COLORS
const ROUTE_PALETTE = [
  { light: "#c62828", dark: "#ff6b5f" },
  { light: "#b45309", dark: "#ffa04d" },
  { light: "#7a6a00", dark: "#e0c341" },
  { light: "#2e7d32", dark: "#6fcf6f" },
  { light: "#00796b", dark: "#3fd0bd" },
  { light: "#0369a1", dark: "#5cc4f5" },
  { light: "#1d4ed8", dark: "#5b8cff" },
  { light: "#5b3fc4", dark: "#a99cff" },
  { light: "#be185d", dark: "#ff7ab8" },
  { light: "#795548", dark: "#c9a27e" },
];

// The color of an uploaded GPX track, apart from the route colors. Keep in sync with .track-end-start in style.css
const UPLOAD_COLORS = { light: "#7a2e8e", dark: "#c77ddb" };

// The outline of the selected route and the uploaded track: the map's --paper, which Google's lines can't read from CSS
const CASING_COLORS = { light: "#ffffff", dark: "#1a2128" };

// Climbs and drops smaller than this are GPS noise, so ascent and descent ignore them
const ELEVATION_NOISE = 5;

// The elevation chart is drawn one column per pixel of the panel's text width (384 − 1 border − 2 × 22)
const PROFILE = { width: 339, height: 128, top: 8, bottom: 110 };

// A place's color, by the panel section it is listed in. A token, so pins and kind icons follow the theme of where they are drawn
const GROUP_COLORS = {
  stay: "var(--stay)",
  explore: "var(--explore)",
  water: "var(--water)",
  bike: "var(--bike)",
  rest: "var(--rest)",
  nature: "var(--nature)",
};

// Icons of the panel sections, by section id. Routes has none
const SECTION_ICONS = {
  stay: "bed",
  explore: "explore",
  water: "water_drop",
  bike: "pedal_bike",
  rest: "table_restaurant",
  nature: "park",
  favorites: "favorite",
  saved: "star",
};

const PLACES = [
  {
    id: "camping",
    group: "stay",
    icon: "camping",
    folder: "accommodation/camping",
    ids: ACCOMMODATION_CAMPING_IDS,
  },
  {
    id: "backpacker",
    group: "stay",
    icon: "backpack",
    folder: "accommodation/backpacker",
    ids: ACCOMMODATION_BACKPACKER_IDS,
  },
  {
    id: "hostel",
    group: "stay",
    icon: "gite",
    folder: "accommodation/hostels",
    ids: ACCOMMODATION_HOSTEL_IDS,
  },
  {
    id: "bnb",
    group: "stay",
    icon: "hotel",
    folder: "accommodation/bnb",
    ids: ACCOMMODATION_BNB_IDS,
  },
  {
    id: "grouphouse",
    group: "stay",
    icon: "house",
    folder: "accommodation/grouphouse",
    ids: ACCOMMODATION_GROUPHOUSE_IDS,
  },
  {
    id: "farm",
    group: "stay",
    icon: "agriculture",
    folder: "accommodation/farm",
    ids: ACCOMMODATION_FARM_IDS,
  },
  {
    id: "sleepingstraw",
    group: "stay",
    icon: "bed",
    folder: "accommodation/sleepingstraw",
    ids: ACCOMMODATION_SLEEPINGSTRAW_IDS,
  },
  {
    id: "mountainhut",
    group: "stay",
    icon: "night_shelter",
    folder: "accommodation/mountainhut",
    ids: ACCOMMODATION_MOUNTAINHUT_IDS,
  },
  {
    id: "sightseeing",
    group: "explore",
    icon: "visibility",
    folder: "other/sightseeing",
    ids: OTHER_SIGHTSEEING_IDS,
  },
  {
    id: "serviceshop",
    group: "bike",
    icon: "build",
    folder: "other/serviceshop",
    ids: OTHER_SERVICESHOP_IDS,
  },
  {
    id: "chargingstation",
    group: "bike",
    icon: "bolt",
    files: [
      "other/chargingstations/chargingstations.json",
      "other/chargingstations/ebike-sockets.json",
    ],
  },
];

// OpenStreetMap places, downloaded by bin/osm-downloader.js. Every type has its own toggle
// These are listed under Stay, with the other places to sleep
const OSM_STAY = [
  osmPlace("stay", "alpinehut", "cabin"),
  osmPlace("stay", "wildernesshut", "cottage"),
  osmPlace("stay", "basichut", "fireplace"),
  osmPlace("stay", "hotel", "apartment"),
  osmPlace("stay", "guesthouse", "bedroom_parent"),
  osmPlace("stay", "chalet", "chalet"),
  osmPlace("stay", "campsite", "camping"),
];

// These are listed under Explore, with sightseeing
const OSM_EXPLORE = [osmPlace("explore", "ruins", "fort")];

// The others have a section each. A place from PLACES whose group is the section id is listed there too
const OSM_SECTIONS = [
  {
    id: "water",
    places: [
      osmPlace("water", "drinkingwater", "water_drop"),
      osmPlace("water", "spring", "water"),
      osmPlace("water", "waterpoint", "faucet"),
    ],
  },
  {
    id: "bike",
    places: [
      osmPlace("bike", "ebikecharging", "battery_charging_full"),
      osmPlace("bike", "bikerepair", "handyman"),
      osmPlace("bike", "airpump", "air"),
      osmPlace("bike", "bikerental", "pedal_bike"),
    ],
  },
  {
    id: "rest",
    places: [
      osmPlace("rest", "picnicsite", "park"),
      osmPlace("rest", "picnictable", "table_restaurant"),
      osmPlace("rest", "firepit", "local_fire_department"),
      osmPlace("rest", "toilets", "wc"),
      osmPlace("rest", "shower", "shower"),
    ],
  },
  {
    id: "nature",
    places: [
      osmPlace("nature", "waterfall", "waves"),
      osmPlace("nature", "mountainpass", "altitude"),
      osmPlace("nature", "cave", "explore"),
      osmPlace("nature", "swimmingarea", "pool"),
      osmPlace("nature", "bathingplace", "beach_access"),
    ],
  },
];

// Every toggle in the panel is a layer: the data files it shows, how to build their map items, and which filter applies
const LAYERS = buildLayers();

// Chrome drops requests when thousands start at once, so downloads are queued
const MAX_DOWNLOADS = 100;

// Hand-made sightseeing entries start at this id; SchweizMobil has no page for them
const HANDMADE_SIGHTSEEING_ID = 10001;

// While files arrive, the map redraws at most this often and regroups markers only once everything has loaded
const LOADING_RENDER_DELAY = 300;

// The visitor's saved routes and places are kept in the browser under this name. The version allows a later change of format
const SAVED_STORAGE_KEY = "swissroutes.saved";
const SAVED_VERSION = 1;

// A photo spot this far (about 1 km) outside the box around its route is a data error. 20 such points exist, some 100 km away
const SPOT_MARGIN = 0.01;

// Photo pins sit above every bubble, whose z-index is 1000 plus its count, so under 60,000 with every layer on
const PHOTO_ZINDEX = 100000;

// The address is rewritten this long after the last change
const ADDRESS_DELAY = 300;

// How long the map takes, in milliseconds, to glide to a route picked on it
const GLIDE_DURATION = 800;

// Route filters kept in the address as <activity>.<key>=<min>-<max>, by the name of their inputs (see rangeFilter)
const ADDRESS_RANGES = { length: "length", ascent: "climb" };

// Chip filters kept in the address as <activity>.<key>=<grade>,<grade>, by the name of their chip row (see gradeFilter)
const ADDRESS_GRADES = { difficulty: "grade", fitness: "fitness" };

// Besides one key per activity and <activity>.<filter>, the address owns these. Other keys, like campaign tags, are left alone
const ADDRESS_KEYS = ["url", "type", "places", "favorites", "map", "maptype"];

// Below this width (style.css) the panels are hidden behind a notice, so the address's rows are not restored
const SMALL_SCREEN = matchMedia("(max-width: 1023.98px)").matches;

// Browsers before spring 2024 can't switch colors by scheme, so they keep the light look and get no Theme row
const LIGHT_DARK = CSS.supports("color", "light-dark(#fff, #000)");

// Google sets the map's colors only when it is created, so the map and everything drawn on it keep the theme the page opened with
const MAP_SCHEME =
  LIGHT_DARK &&
  (PAGE_THEME === "dark" ||
    (PAGE_THEME === "auto" &&
      matchMedia("(prefers-color-scheme: dark)").matches))
    ? "dark"
    : "light";

// The map position the address opened with, or undefined
const ADDRESS_POSITION = readPosition();

let map = undefined;
let pointIndex = undefined;
let pointIndexVersion = 0;
let pointItems = [];
let selected = undefined;
let uploaded = undefined;
let profileMarker = undefined;
let sharedItem = undefined;
let galleryIndex = 0;
let focusReturn = undefined;
let progressTotal = 0;
let progressDone = 0;
let renderPending = false;
let loadingRenderTimeout = undefined;
let filterTimeout = undefined;
let downloadsActive = 0;
let addressTimeout = undefined;
// The interface language, a key of LANGUAGE_TAGS (index.html)
let language = PAGE_LANGUAGE;
let glideFrame = undefined;
// While the map shows the view it opened with, the position stays out of the address. Empty when the address gave a position (then it is always kept); undefined until the map first settles
let openingPosition = ADDRESS_POSITION ? "" : undefined;
// Keys of the saved items: the data file path, plus #<id> for a place inside an OpenStreetMap or charging-station file
let saved = readSaved() ?? new Set();
// Once a write fails, the stored list is out of date, so it is no longer read back
let savedWritable = true;

const activeLayers = new Set();
const files = new Map();
const requests = new Map();
const downloadQueue = [];
// What is on the map right now: a place item or a bubble key, mapped to its marker
const drawn = new Map();

// The page's own text is translated before the map arrives
translatePage();
mapsReady.then(mapLoaded);

function mapLoaded() {
  document.getElementById("map").style.colorScheme = MAP_SCHEME;

  map = new google.maps.Map(document.getElementById("map"), {
    center: ADDRESS_POSITION?.center ?? {
      lat: 46.75,
      lng: 8.1,
    },
    zoom: ADDRESS_POSITION?.zoom ?? 8,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "roadmap",
    colorScheme: MAP_SCHEME === "dark" ? "DARK" : "LIGHT",
    disableDefaultUI: true,
    clickableIcons: false,
  });

  if (!ADDRESS_POSITION) {
    map.fitBounds(INITIAL_VIEW, 0);
  }

  map.addListener("click", () => {
    closeMenu();
    closeDetails();
  });
  map.addListener("idle", drawPins);

  // The user's own move takes over from a glide (see glideTo)
  map.addListener("dragstart", stopGlide);
  map.getDiv().addEventListener("wheel", stopGlide, { passive: true });
  map.getDiv().addEventListener("keydown", stopGlide);
  document
    .querySelector(".map-controls")
    .addEventListener("pointerdown", stopGlide);

  // The first idle only records the opening view, so a plain visit keeps a bare address
  google.maps.event.addListenerOnce(map, "idle", () => {
    openingPosition ??= mapPosition();
    map.addListener("idle", scheduleAddress);
  });

  buildPanel();
  bindControls();

  // The shared item's file is queued before the restored rows, so its details open first
  if (PARAM_URL && PARAM_TYPE) {
    openSharedItem(PARAM_TYPE, PARAM_URL);
  }

  if (!SMALL_SCREEN) {
    restoreView();
  }
}

function buildLayers() {
  const layers = {};

  for (const activity of ACTIVITIES) {
    for (const level of LEVELS) {
      layers[`${activity.id}.${level.id}`] = routeLayer(
        activity,
        level,
        activity.ids[level.id],
        activity.id,
        activity.id,
      );
    }
  }

  for (const place of PLACES) {
    layers[place.id] = placeLayer(place, place.ids, place.id);
  }

  const osmPlaces = [
    ...OSM_STAY,
    ...OSM_EXPLORE,
    ...OSM_SECTIONS.flatMap((section) => section.places),
  ];

  for (const place of osmPlaces) {
    layers[place.id] = placeLayer(place, undefined, place.id);
  }

  const hiking = ACTIVITIES.find((activity) => activity.id === "hiking");
  const local = LEVELS.find((level) => level.id === "local");
  const sightseeing = PLACES.find((place) => place.id === "sightseeing");

  layers["favorites.hiking"] = routeLayer(
    hiking,
    local,
    FAVORITES_HIKING_IDS,
    "favorites.hiking",
  );
  layers["favorites.visit"] = placeLayer(
    sightseeing,
    FAVORITES_VISIT_IDS,
    "favorites.visit",
  );

  layers["saved.routes"] = savedLayer("saved.routes");
  layers["saved.places"] = savedLayer("saved.places");

  return layers;
}

function routeLayer(activity, level, ids, row, filter) {
  return {
    row: row,
    filter: filter,
    urls: ids.map((id) => `${activity.id}/${level.id}/${id}.json`),
    build: (url, json) => buildRoute(url, json, activity, level),
  };
}

function osmPlace(group, id, icon) {
  return {
    id: id,
    group: group,
    icon: icon,
    osm: true,
    files: [`osm/${id}.json`],
  };
}

function placeLayer(place, ids, row) {
  if (place.osm) {
    // The counts come from ids.js, so a layer loads only when its toggle is turned on
    return {
      row: row,
      count: PLACE_COUNTS[place.id],
      urls: place.files,
      build: (url, json) => buildOsmPlaces(url, json, place),
    };
  }

  if (place.files) {
    return {
      row: row,
      count: PLACE_COUNTS[place.id],
      urls: place.files,
      build: (url, json) => buildChargingStations(url, json, place),
    };
  }

  return {
    row: row,
    urls: ids.map((id) => `${place.folder}/${id}.json`),
    build: (url, json) => buildPlace(url, json, place),
  };
}

// A saved row lists files of every kind: each file is built by the layer that owns it, and only its saved items are shown
function savedLayer(row) {
  return {
    row: row,
    urls: [],
    count: 0,
    keep: (item) => saved.has(item.url),
    build: (url, json) => fileLayer(url).build(url, json),
  };
}

// Panel

function buildPanel() {
  const [hiking, cycling, mountainBiking] = ACTIVITIES;

  let content = group(
    "routes",
    byCount([mountainBiking, hiking, cycling]).map(activityRow).join(""),
    false,
  );
  content += group(
    "stay",
    byCount([...PLACES.filter((place) => place.group === "stay"), ...OSM_STAY])
      .map(placeRow)
      .join(""),
  );
  content += group(
    "explore",
    byCount([
      ...PLACES.filter((place) => place.group === "explore"),
      ...OSM_EXPLORE,
    ])
      .map(placeRow)
      .join(""),
  );

  for (const section of OSM_SECTIONS) {
    const places = [
      ...PLACES.filter((place) => place.group === section.id),
      ...section.places,
    ];
    content += group(section.id, byCount(places).map(placeRow).join(""));
  }

  if (FAVORITES_ENABLED) {
    const favorites =
      toggleRow(
        "favorites.hiking",
        t("favorites.hikes"),
        iconSwatch(hiking.icon),
        "var(--ink)",
      ) +
      toggleRow(
        "favorites.visit",
        t("favorites.places"),
        iconSwatch("visibility"),
        GROUP_COLORS.explore,
      );
    content += group("favorites", favorites);
  }

  const layers = document.getElementById("layers");
  layers.innerHTML = content;
  document.getElementById("menuSaved").innerHTML = group(
    "saved",
    savedRows(),
    false,
  );

  // The Saved rows live in the header menu, outside #layers
  for (const button of document.querySelectorAll("[data-layer]")) {
    button.addEventListener("click", () => toggleLayer(button));
  }

  for (const button of document.querySelectorAll("[data-saved-delete]")) {
    button.addEventListener("click", () =>
      confirmRemoveSaved(button.dataset.savedDelete),
    );
  }

  for (const input of layers.querySelectorAll("input, select")) {
    input.addEventListener("input", onFilterChange);
  }

  for (const chip of layers.querySelectorAll("[data-grade-filter]")) {
    chip.addEventListener("click", () => {
      chip.setAttribute(
        "aria-pressed",
        chip.getAttribute("aria-pressed") !== "true",
      );
      onFilterChange();
    });
  }

  updateSavedLayers();
  updateCounts({});
}

// Rows with more places come first
function byCount(items) {
  return [...items].sort((a, b) => rowTotal(b.id) - rowTotal(a.id));
}

// Routes stays open. Every other group starts collapsed
function group(id, rows, collapsible = true) {
  const name = t(`section.${id}`);
  const icon = SECTION_ICONS[id]
    ? `<span class="material-symbols-outlined" aria-hidden="true">${SECTION_ICONS[id]}</span>`
    : "";
  const badge = '<span class="badge" hidden></span>';

  if (!collapsible) {
    return `<section class="group" data-section="${id}"><h2>${icon}${name}${badge}</h2>${rows}</section>`;
  }

  return `<details class="group" data-section="${id}"><summary><h2>${icon}${name}${badge}</h2><span class="material-symbols-outlined">chevron_right</span></summary>${rows}</details>`;
}

function activityRow(activity) {
  const chips = LEVELS.map(
    (level) =>
      `<button type="button" class="chip" data-layer="${activity.id}.${level.id}" aria-pressed="false">${t(`level.${level.id}`)}<span class="chip-count">${activity.ids[level.id].length}</span></button>`,
  ).join("");

  let content = '<div class="row" style="--color:var(--ink)">';
  content += `<div class="row-head">${iconSwatch(activity.icon)}<span class="row-name">${t(`activity.${activity.id}`)}</span><span class="row-count" data-count="${activity.id}"></span></div>`;
  content += `<div class="chips" role="group" aria-label="${t(`activity.${activity.id}.chips`)}">${chips}</div>`;
  content += `<div class="filters" data-filters="${activity.id}" hidden>`;
  content += rangeFilter(
    `filter-${activity.id}-length`,
    t("filter.length"),
    "km",
  );
  content += rangeFilter(`filter-${activity.id}-climb`, t("stat.ascent"), "m");

  if (activity.grades) {
    content += gradeFilter(activity, "grade", activity.grades);
  }

  content += gradeFilter(activity, "fitness", GRADES);
  content += "</div></div>";

  return content;
}

function placeRow(place) {
  return toggleRow(
    place.id,
    t(`place.${place.id}.name`),
    iconSwatch(place.icon),
    GROUP_COLORS[place.group],
  );
}

function toggleRow(layer, name, swatch, color) {
  const style = color ? ` style="--color:${color}"` : "";

  return `<button type="button" class="toggle" data-layer="${layer}" aria-pressed="false"${style}>${swatch}<span class="row-name">${name}</span><span class="row-count" data-count="${layer}"></span></button>`;
}

function iconSwatch(icon) {
  return `<span class="swatch swatch-icon material-symbols-outlined">${icon}</span>`;
}

function rangeFilter(id, label, unit) {
  let content = `<div class="range"><span>${label}</span>`;
  content += `<input type="number" min="0" id="${id}Min" placeholder="${t("filter.min")}" aria-label="${t("filter.minLabel", { label, unit })}">`;
  content += '<span class="range-dash">–</span>';
  content += `<input type="number" min="0" id="${id}Max" placeholder="${t("filter.max")}" aria-label="${t("filter.maxLabel", { label, unit })}">`;
  content += `<span>${unit}</span></div>`;

  return content;
}

// No data-layer attribute, so these chips filter routes instead of turning a layer on. name is grade or fitness
function gradeFilter(activity, name, grades) {
  const chips = grades
    .map(
      (grade) =>
        `<button type="button" class="chip" data-grade-filter="${activity.id}-${name}" data-grade="${grade}" aria-pressed="false">${t(`grade.${grade}`)}</button>`,
    )
    .join("");

  return `<div class="range"><span>${t(`filter.${name}`)}</span><div class="range-chips" role="group" aria-label="${t(`filter.${activity.id}.${name}`)}">${chips}</div></div>`;
}

function toggleLayer(button) {
  const id = button.dataset.layer;
  const active = !activeLayers.has(id);

  setLayer(button, active);

  if (active) {
    track("layer_toggle", { layer: id });
  }

  sharedItem = undefined;
  layersChanged();
  scheduleAddress();
}

// Rows restored from the address go only through here, so they are not reported as clicks and don't clear the shared item
function setLayer(button, active) {
  const id = button.dataset.layer;

  button.setAttribute("aria-pressed", active);

  if (active) {
    activeLayers.add(id);

    const layer = LAYERS[id];

    for (const url of layer.urls) {
      loadFile(url, layer.build);
    }
  } else {
    activeLayers.delete(id);
  }
}

function layersChanged() {
  updateBadges();

  for (const filters of document.querySelectorAll("[data-filters]")) {
    filters.hidden = ![...activeLayers].some(
      (layer) => LAYERS[layer].filter === filters.dataset.filters,
    );
  }

  scheduleRender();
}

// Each section title shows how many of its rows are on
function updateBadges() {
  for (const section of document.querySelectorAll(".group")) {
    const selected = pressedRows(section);
    const badge = section.querySelector(".badge");

    badge.textContent = selected;
    badge.hidden = !selected;
  }

  // The Saved rows are hidden with the menu, so the menu button repeats their badge
  const savedBadge = document.querySelector("#menuSaved .badge");
  const menuBadge = document.getElementById("menuBadge");
  menuBadge.textContent = savedBadge.textContent;
  menuBadge.hidden = savedBadge.hidden;

  // Clear all acts on the panel's rows only, so the Saved rows don't show it
  document.getElementById("clearAll").hidden =
    pressedRows(document.getElementById("layers")) === 0;
}

// A route row counts once, however many levels are on, and its filter chips don't count
function pressedRows(element) {
  return element.querySelectorAll(
    '.toggle[aria-pressed="true"], .row:has(.chip[data-layer][aria-pressed="true"])',
  ).length;
}

function onFilterChange() {
  sharedItem = undefined;
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(scheduleRender, 250);
  scheduleAddress();
}

function readFilters() {
  const filters = {};

  for (const activity of ACTIVITIES) {
    filters[activity.id] = {
      lengthMin: readInt(`filter-${activity.id}-lengthMin`),
      lengthMax: readInt(`filter-${activity.id}-lengthMax`),
      climbMin: readInt(`filter-${activity.id}-climbMin`),
      climbMax: readInt(`filter-${activity.id}-climbMax`),
      grade: pressedGrades(`${activity.id}-grade`),
      fitness: pressedGrades(`${activity.id}-fitness`),
    };
  }

  return filters;
}

function matchesFilter(filter, item) {
  if (!filter) {
    return true;
  }

  return (
    inRange(item.length, filter.lengthMin, filter.lengthMax) &&
    inRange(item.climb, filter.climbMin, filter.climbMax) &&
    inGrades(item.grade, filter.grade) &&
    inGrades(item.fitness, filter.fitness)
  );
}

function inRange(value, min, max) {
  if (min && value < min) {
    return false;
  }

  if (max && value > max) {
    return false;
  }

  return true;
}

// No pressed chip means any grade
function inGrades(value, grades) {
  return grades.length === 0 || grades.includes(value);
}

function updateCounts(counts) {
  for (const element of document.querySelectorAll("[data-count]")) {
    const count = counts[element.dataset.count];

    if (count) {
      const shown = formatNumber(count.shown);
      element.textContent =
        count.shown < count.total
          ? t("count.of", { shown, total: formatNumber(count.total) })
          : shown;
      element.classList.add("active");
    } else {
      element.textContent = formatNumber(rowTotal(element.dataset.count));
      element.classList.remove("active");
    }
  }
}

function rowTotal(row) {
  let total = 0;

  for (const layer of Object.values(LAYERS)) {
    if (layer.row === row) {
      total += layer.count ?? layer.urls.length;
    }
  }

  return total;
}

// Loading

function loadFile(url, build) {
  if (!requests.has(url)) {
    progressTotal++;
    updateProgress();

    const request = fetchJson(`data/${url}`)
      .then((json) => {
        const items = build(url, json);
        files.set(url, items);

        return items;
      })
      .catch((error) => {
        console.error(`Could not load ${url}`, error);
        requests.delete(url);

        return [];
      })
      .finally(() => {
        progressDone++;
        updateProgress();
        scheduleLoadingRender();
      });

    requests.set(url, request);
  }

  return requests.get(url);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    downloadQueue.push({ url, resolve, reject });
    nextDownload();
  });
}

function nextDownload() {
  while (downloadsActive < MAX_DOWNLOADS && downloadQueue.length > 0) {
    const download = downloadQueue.shift();
    downloadsActive++;

    fetch(download.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then(download.resolve, download.reject)
      .finally(() => {
        downloadsActive--;
        nextDownload();
      });
  }
}

function updateProgress() {
  const progress = document.getElementById("progress");
  const bar = document.getElementById("progressBar");

  if (progressDone < progressTotal) {
    const percent = Math.round((progressDone * 100) / progressTotal);
    bar.style.width = `${percent}%`;
    progress.setAttribute("aria-valuenow", percent);
    progress.classList.add("loading");
    setStatus(t("status.loading"));
  } else {
    bar.style.width = "100%";
    progress.setAttribute("aria-valuenow", 100);
    progress.classList.remove("loading");
    progressTotal = 0;
    progressDone = 0;
    setStatus(t("status.loaded"));
  }
}

// A live region for screen readers: the progress bar alone is not announced as it moves
function setStatus(text) {
  const status = document.getElementById("status");

  if (status.textContent !== text) {
    status.textContent = text;
  }
}

// Map items

function buildRoute(url, json, activity, level) {
  const properties = json.properties;
  const paths = json.geometry.coordinates.map((stage) =>
    stage.map((coordinate) => point(coordinate[0], coordinate[1])),
  );
  const bounds = getBounds(paths.flat());
  // A route missing from an outdated ids.js takes the first color
  const colors = ROUTE_PALETTE[ROUTE_COLORS[url]] ?? ROUTE_PALETTE[0];

  const item = {
    url: url,
    json: json,
    kind: "route",
    type: activity.id,
    activity: activity,
    level: level,
    label: routeLabel(properties),
    color: cssColor(colors),
    lineColor: colors[MAP_SCHEME],
    weight: level.weight,
    zIndex: level.zIndex,
    length: parseInt(properties.length),
    climb: parseInt(properties.height_difference),
    grade: properties.category_grade,
    fitness: properties.category_condition,
    paths: paths,
    bounds: bounds,
    gallery: getGallery(json, bounds),
    casings: [],
  };

  item.lines = paths.map((path) => createLine(item, path));
  item.badge = createMarker(
    paths[0][0],
    plate(properties.r_number, item.color),
    item,
  );

  return [item];
}

function buildPlace(url, json, place) {
  const position = point(
    json.geometry.coordinates[0],
    json.geometry.coordinates[1],
  );

  const item = {
    url: url,
    json: json,
    kind: "place",
    type: place.icon,
    place: place,
    label: placeLabel(json.properties),
    position: position,
    bounds: around(position, 0.1),
    gallery: getGallery(json),
  };

  return [item];
}

function buildChargingStations(url, json, place) {
  const items = [];

  json.forEach((entry) => {
    const coordinates = entry.Point.coordinates.split(",");
    const latitude = parseFloat(coordinates[1]);
    const longitude = parseFloat(coordinates[0]);

    if (
      latitude >= CHARGING_BOUNDS.south &&
      latitude <= CHARGING_BOUNDS.north &&
      longitude >= CHARGING_BOUNDS.west &&
      longitude <= CHARGING_BOUNDS.east
    ) {
      const position = point(latitude, longitude);

      // Keyed by position, not by index, which shifts when the file is refreshed
      const item = {
        url: `${url}#${entry.Point.coordinates}`,
        json: entry,
        kind: "charging",
        place: place,
        label:
          typeof entry.name === "string" ? entry.name : entry.name["__cdata"],
        position: position,
        bounds: around(position, 0.1),
        gallery: [],
      };

      items.push(item);
    }
  });

  return items;
}

function buildOsmPlaces(url, json, place) {
  return json.map((entry) => {
    const position = point(entry.coordinates[0], entry.coordinates[1]);

    // Keyed by OpenStreetMap id, not by index, which shifts when the file is refreshed
    const item = {
      url: `${url}#${entry.id}`,
      json: entry,
      kind: "osm",
      place: place,
      label: entry.name ?? t(`place.${place.id}.label`),
      position: position,
      bounds: around(position, 0.1),
      gallery: [],
    };

    return item;
  });
}

// A route's number and title, in the interface language unless code names another
function routeLabel(properties, code) {
  return `${properties.r_number} ${localText(properties, "title", code)}`;
}

// My Switzerland places keep their name in name, not title
function placeLabel(properties, code) {
  return properties.title
    ? localText(properties, "title", code)
    : properties.name;
}

function createLine(item, path) {
  const line = new google.maps.Polyline({ path: path });

  line.addListener("click", () => selectItem(item));
  line.addListener("mouseover", (event) => showTooltip(item, event));
  line.addListener("mousemove", moveTooltip);
  line.addListener("mouseout", hideTooltip);

  return line;
}

function createMarker(position, content, item) {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: position,
    content: content,
    title: item.label,
    gmpClickable: true,
  });

  marker.addEventListener("gmp-click", () => selectItem(item));

  return marker;
}

function plate(text, color) {
  const content = document.createElement("div");
  content.className = "plate map-plate";
  content.style.setProperty("--color", color);
  content.textContent = text;

  return content;
}

function markerIcon(place) {
  const content = document.createElement("span");
  content.className = "marker material-symbols-outlined";
  content.style.setProperty("--color", GROUP_COLORS[place.group]);
  content.textContent = place.icon;

  return content;
}

function renderCluster(id, count, position, index) {
  const content = document.createElement("div");
  content.className = "cluster";
  content.textContent = count;

  if (count >= 100) {
    content.classList.add("cluster-large");
  } else if (count >= 10) {
    content.classList.add("cluster-medium");
  }

  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: position,
    content: content,
    title: t("cluster.title", { count: formatNumber(count) }),
    zIndex: 1000 + count,
    gmpClickable: true,
  });

  marker.addEventListener("gmp-click", () => {
    stopGlide();
    map.panTo(position);
    map.setZoom(index.getClusterExpansionZoom(id));
  });

  return marker;
}

// Rendering

function scheduleRender() {
  if (!renderPending) {
    renderPending = true;

    requestAnimationFrame(() => {
      renderPending = false;
      render();
    });
  }
}

function scheduleLoadingRender() {
  // The progress counters reset once every requested file has finished
  if (progressTotal === 0) {
    clearTimeout(loadingRenderTimeout);
    loadingRenderTimeout = undefined;
    scheduleRender();
  } else if (!loadingRenderTimeout) {
    loadingRenderTimeout = setTimeout(() => {
      loadingRenderTimeout = undefined;
      render(false);
    }, LOADING_RENDER_DELAY);
  }
}

function render(regroup = true) {
  const filters = readFilters();
  const visible = new Set();
  const counts = {};

  for (const id of activeLayers) {
    const layer = LAYERS[id];
    const count = counts[layer.row] ?? { shown: 0, total: 0 };

    // Until the layer's files have arrived, the row keeps showing its total instead of a count that starts at 0
    if (layer.urls.every((url) => files.has(url))) {
      counts[layer.row] = count;
    }

    for (const url of layer.urls) {
      for (const item of files.get(url) ?? []) {
        // A saved row shows only the saved items of a file, such as one fountain of the drinking water file
        if (layer.keep && !layer.keep(item)) {
          continue;
        }

        count.total++;

        if (matchesFilter(filters[layer.filter], item)) {
          count.shown++;
          visible.add(item);
        }
      }
    }
  }

  if (selected) {
    visible.add(selected);
  }

  if (sharedItem) {
    visible.add(sharedItem);
  }

  const points = [];

  for (const items of files.values()) {
    for (const item of items) {
      if (item.place) {
        // Pins are made on demand by drawPins, so a place only needs to be handed to the index
        if (regroup && item !== selected && visible.has(item)) {
          points.push(item);
        }
      } else {
        const shown = visible.has(item);

        if (item.shown !== shown) {
          item.shown = shown;
          item.badge.map = shown ? map : null;

          for (const line of item.lines) {
            line.setMap(shown ? map : null);
          }
        }

        styleRoute(item);
      }
    }
  }

  if (regroup) {
    setPoints(points);
    drawPins();
  }

  updateCounts(counts);
}

// Places are grouped into bubbles by the index, and a pin is made only for what is in view
function setPoints(items) {
  const changed =
    !pointIndex ||
    items.length !== pointItems.length ||
    items.some((item, i) => item !== pointItems[i]);

  if (changed) {
    pointItems = items;
    pointIndexVersion++;
    pointIndex = new Supercluster({ radius: 60, maxZoom: 16 }).load(
      items.map((item, i) => ({
        type: "Feature",
        id: i,
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [item.position.lng, item.position.lat],
        },
      })),
    );
  }
}

function drawPins() {
  const bounds = map?.getBounds();

  if (!bounds || !pointIndex) {
    return;
  }

  const index = pointIndex;
  const view = bounds.toJSON();

  // A margin around the screen, so pins at the edge are there before they are panned in
  const marginLat = (view.north - view.south) * 0.25;
  const marginLng = (view.east - view.west) * 0.25;
  const box = [
    Math.max(view.west - marginLng, -180),
    Math.max(view.south - marginLat, -85),
    Math.min(view.east + marginLng, 180),
    Math.min(view.north + marginLat, 85),
  ];

  const wanted = new Map();

  for (const feature of index.getClusters(box, Math.round(map.getZoom()))) {
    const [lng, lat] = feature.geometry.coordinates;
    const properties = feature.properties;

    if (properties.cluster) {
      const key = `${pointIndexVersion}:${properties.cluster_id}`;

      wanted.set(
        key,
        drawn.get(key) ??
          renderCluster(
            properties.cluster_id,
            properties.point_count,
            point(lat, lng),
            index,
          ),
      );
    } else {
      // The id of a point is its position in the list given to the index
      const item = pointItems[feature.id];

      wanted.set(item, drawn.get(item) ?? pinFor(item));
    }
  }

  if (selected?.place) {
    wanted.set(selected, drawn.get(selected) ?? pinFor(selected));
  }

  for (const [key, marker] of drawn) {
    if (!wanted.has(key)) {
      marker.map = null;
    }
  }

  drawn.clear();

  for (const [key, marker] of wanted) {
    if (typeof key !== "string") {
      marker.content.classList.toggle("selected", key === selected);
      marker.zIndex = key === selected ? 2000 : null;
    }

    if (marker.map !== map) {
      marker.map = map;
    }

    drawn.set(key, marker);
  }
}

function pinFor(item) {
  item.marker ??= createMarker(item.position, markerIcon(item.place), item);

  return item.marker;
}

function styleRoute(item) {
  const emphasized = item === selected;
  const faded = !!selected?.lines && !emphasized;
  const weight = item.weight + (emphasized ? 2 : 0);
  const opacity = faded ? 0.35 : 0.95;
  const zIndex = emphasized ? 1000 : item.zIndex;
  const cased = item.shown && emphasized;
  const key = `${weight}|${opacity}|${zIndex}|${cased}`;

  if (item.styleKey === key) {
    return;
  }

  item.styleKey = key;
  item.badge.content.classList.toggle("faded", faded);
  item.badge.zIndex = emphasized ? 1000 : null;

  for (const line of item.lines) {
    line.setOptions(lineStyle(item, weight, opacity, zIndex));
  }

  if (cased && item.casings.length === 0) {
    item.casings = item.paths.map((path) => createLine(item, path));
  }

  for (const casing of item.casings) {
    casing.setOptions({
      strokeColor: CASING_COLORS[MAP_SCHEME],
      strokeOpacity: opacity,
      strokeWeight: weight + 4,
      zIndex: zIndex - 1,
    });
    casing.setMap(cased ? map : null);
  }
}

function lineStyle(item, weight, opacity, zIndex) {
  return {
    strokeColor: item.lineColor,
    strokeOpacity: opacity,
    strokeWeight: weight,
    zIndex: zIndex,
  };
}

function showTooltip(item, event) {
  const tooltip = document.getElementById("tooltip");
  tooltip.textContent = item.label;
  tooltip.hidden = false;
  moveTooltip(event);
}

function hideTooltip() {
  document.getElementById("tooltip").hidden = true;
}

function moveTooltip(event) {
  const tooltip = document.getElementById("tooltip");

  // A route goes on reporting the pointer after it moves onto one of the route's photo pins, which show no tooltip
  if (event.domEvent.target.closest(".photo-pin")) {
    tooltip.hidden = true;
    return;
  }

  tooltip.style.left = `${event.domEvent.clientX + 14}px`;
  tooltip.style.top = `${event.domEvent.clientY + 14}px`;
}

// Details

function selectItem(item, source = "map") {
  const reselected = item === selected;

  // Remember where the keyboard was, so closing the panel can put it back
  if (!selected) {
    focusReturn = document.activeElement;
  }

  hidePhotoSpots(selected);
  hideProfilePoint();
  selected = item;
  galleryIndex = 0;

  track("select_content", {
    content_type: contentType(item),
    content_id: trackLabel(item),
    source: source,
  });

  const details = document.getElementById("details");
  details.innerHTML = detailsContent(item);

  // The close button is placed against the panel, so it is moved clear of the scrollbar, in line with the photo arrows
  const scroll = details.querySelector(".details-scroll");
  details.style.setProperty(
    "--scrollbar",
    `${scroll.offsetWidth - scroll.clientWidth}px`,
  );

  details.classList.add("open");
  details.inert = false;
  document.body.classList.add("has-details");
  details.querySelector(".details-close").focus();

  // A route picked on the map is brought fully into view, once the open panel has narrowed the map. Picking it again leaves the view alone
  if (item.kind === "route" && source === "map" && !reselected) {
    glideTo(item.bounds);
  }

  render();
  drawPhotoSpots();
  scheduleAddress();
}

function closeDetails() {
  if (!selected) {
    return;
  }

  hidePhotoSpots(selected);
  hideProfilePoint();
  selected = undefined;

  const details = document.getElementById("details");
  const hadFocus = details.contains(document.activeElement);
  details.classList.remove("open");
  details.inert = true;
  document.body.classList.remove("has-details");

  // Only a keyboard user inside the panel needs focus handed back; a click on the map has already moved it
  if (hadFocus && focusReturn?.isConnected) {
    focusReturn.focus();
  }

  focusReturn = undefined;

  render();
  scheduleAddress();
}

function openSharedItem(type, url) {
  const build = sharedItemBuilder(type, url);

  if (build) {
    loadFile(url, build).then((items) => {
      if (items.length > 0) {
        sharedItem = items[0];
        selectItem(items[0], linkSource());

        // A position in the address wins over the item's own
        if (!ADDRESS_POSITION) {
          map.fitBounds(items[0].bounds, mapPadding());
        }
      }
    });
  }
}

function sharedItemBuilder(type, url) {
  const activity = ACTIVITIES.find((activity) => activity.id === type);

  if (activity) {
    const level =
      LEVELS.find((level) => level.id === url.split("/")[1]) ??
      LEVELS[LEVELS.length - 1];

    return (url, json) => buildRoute(url, json, activity, level);
  }

  const place = PLACES.find((place) => place.icon === type && !place.files);

  if (place) {
    return (url, json) => buildPlace(url, json, place);
  }

  return undefined;
}

function detailsContent(item) {
  let content = `<button type="button" class="details-close" data-action="close" aria-label="${t("details.close")}"><span class="material-symbols-outlined">close</span></button>`;
  content += `<div class="details-scroll">${gallerySection(item)}<div class="details-body">`;

  if (item.kind === "route") {
    content += routeDetails(item);
  } else if (item.kind === "place") {
    content += placeDetails(item);
  } else if (item.kind === "osm") {
    content += osmDetails(item);
  } else if (item.kind === "upload") {
    content += uploadDetails(item);
  } else {
    content += chargingStationDetails(item);
  }

  return content + "</div></div>";
}

function routeDetails(item) {
  const properties = item.json.properties;
  const badge = safeUrl(properties.logo)
    ? `<img class="details-logo" src="${escapeHtml(properties.logo)}" alt="${t("route.logo", { number: properties.r_number })}">`
    : plateBadge(item);

  let content = `<div class="details-kind">${badge}${t(`kind.${item.activity.id}.${item.level.id}`)}</div>`;
  content += `<h2 class="details-title">${escapeHtml(localText(properties, "title"))}</h2>`;

  if (properties.start && properties.end) {
    content += `<p class="details-subtitle">${escapeHtml(routeEnds(properties))}</p>`;
  }

  content += actions([
    shareAction(),
    saveAction(item),
    `<button type="button" class="action" data-action="download"><span class="material-symbols-outlined">download</span>${t("action.downloadGpx")}</button>`,
    externalAction(routePage(item), "SchweizMobil"),
  ]);

  let stats = stat(t("stat.distance"), item.length, "km");
  stats += stat(
    t("stat.ascent"),
    formatNumber(properties.height_difference),
    "m",
  );
  stats += stat(
    t("stat.descent"),
    formatNumber(properties.height_difference_back),
    "m",
  );

  if (typeof properties.hiking_time === "number") {
    stats += stat(t("stat.hikingTime"), duration(properties.hiking_time), "");
  }

  if (typeof properties.length_asphalt === "number") {
    stats += stat(
      t("stat.asphalt"),
      parseInt((properties.length_asphalt * 100) / item.length),
      "%",
    );
  }

  content += `<dl class="stats">${stats}</dl>`;

  let facts = "";

  if (GRADES.includes(item.grade)) {
    const grade = t(`grade.${item.grade}`);
    facts += fact(
      t("filter.grade"),
      item.activity.trails?.includes(item.grade)
        ? `${grade} · ${t(`trail.${item.grade}`)}`
        : grade,
    );
  }

  if (GRADES.includes(item.fitness)) {
    facts += fact(t("filter.fitness"), t(`grade.${item.fitness}`));
  }

  // Compared as text, so float noise in the hours doesn't count as a difference
  if (
    typeof properties.hiking_time_back === "number" &&
    duration(properties.hiking_time_back) !== duration(properties.hiking_time)
  ) {
    facts += fact(
      t("fact.otherDirection"),
      duration(properties.hiking_time_back),
    );
  }

  if (facts) {
    content += `<dl class="facts">${facts}</dl>`;
  }

  // Worked out on selection, not in buildRoute, which runs for thousands of routes
  item.profile ??= routeProfile(item);
  content += profileSection(item);

  if (properties.abstract) {
    content += `<p class="details-lead" lang="${textLanguage(properties, "abstract")}">${localText(properties, "abstract")}</p>`;
  }

  if (properties.description) {
    content += `<div class="details-description" lang="${textLanguage(properties, "description")}">${localText(properties, "description")}</div>`;
  }

  return content;
}

// SchweizMobil's page of the route in the interface language. It has none in Spanish or Portuguese, and older files have no links
function routePage(item) {
  const properties = item.json.properties;
  const page = [properties[`url_${language}`], properties.url_en].find(safeUrl);

  return page
    ? escapeHtml(page)
    : `https://www.schweizmobil.ch/en/${item.type}-in-switzerland/route-${properties.r_number}`;
}

function placeDetails(item) {
  const properties = item.json.properties;
  const isBasic = properties.city !== undefined;
  const isHandMade =
    item.type === "visibility" && item.json.id >= HANDMADE_SIGHTSEEING_ID;

  let baseLink = "";

  if (item.type === "build") {
    baseLink = "https://schweizmobil.ch/en/cycle-service-";
  } else if (item.type === "visibility") {
    if (!isHandMade) {
      baseLink = "https://schweizmobil.ch/en/place-of-interest-";
    }
  } else if (!isBasic) {
    baseLink = "https://schweizmobil.ch/en/accommodation-";
  }

  let content = `<div class="details-kind" style="--color:${GROUP_COLORS[item.place.group]}">${iconSwatch(item.place.icon)}${t(`place.${item.place.id}.label`)}</div>`;
  content += `<h2 class="details-title">${escapeHtml(item.label)}</h2>`;

  let external;

  if (baseLink) {
    external = externalAction(`${baseLink}${item.json.id}`, "SchweizMobil");
  } else if (isHandMade && safeUrl(properties.url1_link)) {
    external = externalAction(escapeHtml(properties.url1_link), "Google Maps");
  } else {
    external = externalAction(
      `https://www.google.com/maps/search/${encodeURIComponent([item.label, properties.city].filter(Boolean).join(" "))}`,
      "Google Maps",
    );
  }

  content += actions([shareAction(), saveAction(item), external]);

  if (properties.abstract) {
    content += `<p class="details-lead" lang="${textLanguage(properties, "abstract")}">${localText(properties, "abstract")}</p>`;
  }

  if (properties.description) {
    content += `<div class="details-description" lang="${textLanguage(properties, "description")}">${localText(properties, "description")}</div>`;
  }

  const contact = [];

  if (isBasic) {
    contact.push(
      contactLine(
        "location_on",
        `<a href="https://www.google.com/maps/place/${item.position.lat},${item.position.lng}" target="_blank" rel="noopener noreferrer">${t("place.showOnGoogleMaps")}</a>`,
      ),
    );
  }

  if (properties.tel) {
    contact.push(
      contactLine(
        "call",
        `<a href="tel:${escapeHtml(String(properties.tel).replace(/\s/g, ""))}">${escapeHtml(properties.tel)}</a>`,
      ),
    );
  }

  if (properties.email) {
    contact.push(
      contactLine(
        "mail",
        `<a href="mailto:${escapeHtml(properties.email)}">${escapeHtml(properties.email)}</a>`,
      ),
    );
  }

  if (properties.street) {
    const address = `${properties.street}, ${properties.zip} ${properties.place}`;
    contact.push(
      contactLine(
        "location_on",
        `<a href="https://www.google.com/maps/search/${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer">${escapeHtml(address)}</a>`,
      ),
    );
  }

  const urls = new Set(
    [
      properties.url1_link,
      properties.url2_link,
      localText(properties, "url_sightseeing"),
    ].filter(safeUrl),
  );

  for (const url of urls) {
    contact.push(
      contactLine(
        "link",
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`,
      ),
    );
  }

  if (contact.length > 0) {
    content += `<ul class="contact">${contact.join("")}</ul>`;
  }

  return content;
}

function chargingStationDetails(item) {
  let content = `<div class="details-kind" style="--color:${GROUP_COLORS[item.place.group]}">${iconSwatch(item.place.icon)}${t(`place.${item.place.id}.label`)}</div>`;
  content += `<h2 class="details-title">${item.label}</h2>`;
  content += actions([
    saveAction(item),
    externalAction(
      `https://www.google.com/maps/place/${item.position.lat},${item.position.lng}`,
      "Google Maps",
    ),
  ]);

  if (item.json.description) {
    content += `<div class="details-description">${item.json.description.__cdata}</div>`;
  }

  return content;
}

// OpenStreetMap is edited by anyone, so its text is escaped before it goes into the panel
function osmDetails(item) {
  const tags = item.json.tags;

  let content = `<div class="details-kind" style="--color:${GROUP_COLORS[item.place.group]}">${iconSwatch(item.place.icon)}${t(`place.${item.place.id}.label`)}</div>`;
  content += `<h2 class="details-title">${escapeHtml(item.label)}</h2>`;

  content += actions([
    saveAction(item),
    externalAction(
      `https://www.openstreetmap.org/${item.json.id}`,
      "OpenStreetMap",
    ),
    externalAction(
      `https://www.google.com/maps/place/${item.position.lat},${item.position.lng}`,
      "Google Maps",
    ),
  ]);

  if (tags.description) {
    content += `<div class="details-description">${escapeHtml(tags.description)}</div>`;
  }

  let stats = "";
  const elevation = parseFloat(tags.ele);
  const capacity = parseInt(tags.capacity);

  if (Number.isFinite(elevation)) {
    stats += stat(
      t("stat.elevation"),
      formatNumber(Math.round(elevation)),
      "m",
    );
  }

  if (Number.isFinite(capacity)) {
    stats += stat(t("stat.capacity"), formatNumber(capacity), "");
  }

  if (stats) {
    content += `<dl class="stats">${stats}</dl>`;
  }

  const contact = [];

  if (tags.opening_hours) {
    contact.push(contactLine("schedule", escapeHtml(tags.opening_hours)));
  }

  if (tags.phone) {
    contact.push(
      contactLine(
        "call",
        `<a href="tel:${escapeHtml(tags.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(tags.phone)}</a>`,
      ),
    );
  }

  if (safeUrl(tags.website)) {
    contact.push(
      contactLine(
        "link",
        `<a href="${escapeHtml(tags.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(tags.website)}</a>`,
      ),
    );
  }

  if (tags.operator) {
    contact.push(
      contactLine(
        "info",
        t("osm.operator", { operator: escapeHtml(tags.operator) }),
      ),
    );
  }

  if (tags.fee) {
    contact.push(
      contactLine("info", t("osm.fee", { fee: osmValue(tags.fee) })),
    );
  }

  if (tags.access) {
    contact.push(
      contactLine("info", t("osm.access", { access: osmValue(tags.access) })),
    );
  }

  if (contact.length > 0) {
    content += `<ul class="contact">${contact.join("")}</ul>`;
  }

  return content;
}

// Yes and no, nearly every fee and most access values, are translated. Any other value is shown as OpenStreetMap has it
function osmValue(value) {
  return value === "yes" || value === "no"
    ? t(`osm.${value}`)
    : escapeHtml(value);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

// Links built from downloaded data must be web addresses: a "javascript:" value would run when clicked
function safeUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function actions(buttons) {
  return `<div class="actions">${buttons.join("")}</div>`;
}

function shareAction() {
  return `<button type="button" class="action" data-action="share"><span class="material-symbols-outlined">link</span><span class="action-label">${t("action.copyLink")}</span></button>`;
}

// The visible label changes, so there is no aria-pressed: a toggle's name must not change while it is used
function saveAction(item) {
  const isSaved = saved.has(item.url);

  return `<button type="button" class="action${isSaved ? " saved" : ""}" data-action="save"><span class="material-symbols-outlined">star</span><span class="action-label">${t(isSaved ? "action.saved" : "action.save")}</span></button>`;
}

function externalAction(url, label) {
  return `<a class="action" href="${url}" target="_blank" rel="noopener noreferrer"><span class="material-symbols-outlined">open_in_new</span>${label}</a>`;
}

function stat(label, value, unit) {
  return `<div><dt>${label}</dt><dd>${value}<span class="stat-unit">${unit}</span></dd></div>`;
}

// Most routes are loops: "Loop from Thun" rather than "Thun to Thun"
function routeEnds(properties) {
  const start = properties.start.trim();
  const end = properties.end.trim();
  const ends =
    start === end
      ? t("route.loop", { start })
      : t("route.ends", { start, end });

  return properties.via
    ? t("route.via", { route: ends, via: properties.via.trim() })
    : ends;
}

// Hiking times are stored in hours, in steps of 5 minutes: 5.4166665 is 5 h 25 min
function duration(hours) {
  const minutes = Math.round(hours * 60);
  const parts = [];

  if (minutes >= 60) {
    parts.push(`${Math.floor(minutes / 60)}<span class="stat-unit">h</span>`);
  }

  if (minutes % 60 > 0) {
    parts.push(`${minutes % 60}<span class="stat-unit">min</span>`);
  }

  return parts.join(" ");
}

function fact(label, value) {
  return `<dt>${label}</dt><dd>${value}</dd>`;
}

function contactLine(icon, content) {
  return `<li><span class="material-symbols-outlined">${icon}</span><span>${content}</span></li>`;
}

function gallerySection(item) {
  const gallery = item.gallery;

  if (gallery.length === 0) {
    return "";
  }

  let content = `<div class="details-media"><img id="galleryImage" src="${escapeHtml(gallery[0].src)}" alt="${escapeHtml(item.label)}">`;

  if (gallery.length > 1) {
    content += `<button type="button" class="media-button previous" data-action="previous" aria-label="${t("gallery.previous")}"><span class="material-symbols-outlined">chevron_left</span></button>`;
    content += `<button type="button" class="media-button next" data-action="next" aria-label="${t("gallery.next")}"><span class="material-symbols-outlined">chevron_right</span></button>`;
    content += `<span class="media-counter" id="galleryIndex">1 / ${gallery.length}</span>`;
  }

  return content + "</div>";
}

function plateBadge(item) {
  return `<span class="plate" style="--color:${item.color}">${item.json.properties.r_number}</span>`;
}

function plusSlides(offset) {
  const gallery = selected.gallery;
  galleryIndex = (galleryIndex + offset + gallery.length) % gallery.length;

  showPhoto();

  // The map follows the gallery when the photo was taken outside the visible area
  const position = gallery[galleryIndex]?.position;

  if (position && !map.getBounds()?.contains(position)) {
    stopGlide();
    map.panTo(position);
  }
}

function showPhoto() {
  const gallery = selected.gallery;
  const media = document.querySelector(".details-media");

  // The arrows about to be removed may hold the keyboard focus
  if (gallery.length < 2 && media.contains(document.activeElement)) {
    document.querySelector(".details-close").focus();
  }

  if (gallery.length === 0) {
    media.remove();
  } else if (gallery.length === 1) {
    document.getElementById("galleryImage").src = gallery[0].src;
    media.querySelectorAll(".media-button, .media-counter").forEach((element) => element.remove());
  } else {
    document.getElementById("galleryImage").src = gallery[galleryIndex].src;
    document.getElementById("galleryIndex").textContent =
      `${galleryIndex + 1} / ${gallery.length}`;
  }

  drawPhotoSpots();
}

// A photo that fails to load is dropped, so the panel never shows an empty block
function dropPhoto(image) {
  const gallery = selected.gallery;

  // A late error of a photo the user already moved past must not drop the one now shown
  if (image.getAttribute("src") !== gallery[galleryIndex]?.src) {
    return;
  }

  // The photo's pin goes with it
  const [photo] = gallery.splice(galleryIndex, 1);

  if (photo.marker) {
    photo.marker.map = null;
  }

  galleryIndex = galleryIndex % Math.max(gallery.length, 1);

  showPhoto();
}

function copyLink(button) {
  const link = `${location.origin}${location.pathname}?url=${encodeURIComponent(selected.url)}&type=${encodeURIComponent(selected.type)}`;
  const label = button.querySelector(".action-label");
  const icon = button.querySelector(".material-symbols-outlined");
  // The selection can change before the clipboard write finishes
  const item = selected;

  navigator.clipboard.writeText(link).then(
    () => {
      track("share", {
        method: "copy_link",
        content_type: contentType(item),
        item_id: trackLabel(item),
      });

      label.textContent = t("action.linkCopied");
      icon.textContent = "check";

      setTimeout(() => {
        label.textContent = t("action.copyLink");
        icon.textContent = "link";
      }, 2000);
    },
    () => {
      window.open(link, "_blank");
    },
  );
}

// Only a route passes its box, so only route photos get a position and a pin
function getGallery(json, bounds) {
  const properties = json.properties;
  const candidates = [
    galleryPhotos(properties, properties.photo_gallery_big, bounds),
    galleryPhotos(properties, properties.photo_gallery_master, bounds),
    galleryPhotos(properties, properties.photo_gallery, bounds),
    galleryPhotos(properties, properties.photo_gallery_small, bounds),
    properties.foto ? [{ src: properties.foto }] : [],
  ];
  const maxLength = Math.max(...candidates.map((photos) => photos.length));

  // The first longest list wins, or an empty one when there are no photos
  return candidates.find((photos) => photos.length === maxLength);
}

// Each photo with its credit and position. Those lists run alongside the photo lists, so they are matched by position before empty photos are dropped
function galleryPhotos(properties, list, bounds) {
  const photos = [];

  if (list) {
    const credited = list.length === properties.photo_gallery_author?.length;

    list.forEach((src, index) => {
      if (src && src.trim().length > 0) {
        photos.push({
          src: src.trim(),
          credit: credited ? photoCredit(properties, index) : undefined,
          position: bounds
            ? photoPosition(properties, index, bounds)
            : undefined,
        });
      }
    });
  }

  return photos;
}

// The author field is the tidier copy of the copyright field. Only the first line is kept: one photographer added a postal address
function photoCredit(properties, index) {
  for (const credits of [
    properties.photo_gallery_author,
    properties.photo_gallery_copyright,
  ]) {
    const credit = String(credits?.[index] ?? "")
      .split("\n")[0]
      .replace(/^\s*(\(c\)|©)/i, "")
      .replace(/[\s;,]+$/, "")
      .trim();

    if (credit) {
      return credit;
    }
  }

  return undefined;
}

// Photo spots

// A spot is written "[(lng, lat)]", longitude first, the reverse of the rest of the data
function photoPosition(properties, index, bounds) {
  const match = /\(([-\d.]+),\s*([-\d.]+)\)/.exec(
    properties.photo_gallery_coords?.[index] ?? "",
  );
  const position = match
    ? point(parseFloat(match[2]), parseFloat(match[1]))
    : undefined;
  // NaN fails these comparisons too
  const near =
    position &&
    position.lat <= bounds.north + SPOT_MARGIN &&
    position.lat >= bounds.south - SPOT_MARGIN &&
    position.lng <= bounds.east + SPOT_MARGIN &&
    position.lng >= bounds.west - SPOT_MARGIN;

  return near ? position : undefined;
}

function photoPin(photo, color) {
  const content = document.createElement("span");
  content.className = "marker photo-pin material-symbols-outlined";
  content.style.setProperty("--color", color);
  content.textContent = "photo_camera";

  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: photo.position,
    content: content,
    gmpClickable: true,
  });

  // Not made with createMarker, whose click selects the item instead
  marker.addEventListener("gmp-click", () => showSpotPhoto(photo));

  return marker;
}

// Only the pins whose number or state changed are restyled, so a step through the gallery touches two of them
function drawPhotoSpots() {
  const gallery = selected?.gallery ?? [];

  gallery.forEach((photo, i) => {
    if (!photo.position) {
      return;
    }

    photo.marker ??= photoPin(photo, selected.color);

    const marker = photo.marker;
    const count = gallery.length;
    const shown = i === galleryIndex;
    const key = `${i}|${count}|${shown}|${language}`;

    if (photo.key !== key) {
      photo.key = key;
      // A label for screen readers only: Google turns a title into a browser tooltip as well
      marker.setAttribute(
        "aria-label",
        t(shown ? "photo.titleShown" : "photo.title", {
          index: i + 1,
          total: count,
        }),
      );
      // Where pins overlap, the earlier photo wins, and the pin of the photo on show is always drawn
      marker.zIndex = shown ? PHOTO_ZINDEX + 1 : PHOTO_ZINDEX - i;
      marker.collisionBehavior = shown
        ? google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
        : google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY;
      marker.content.classList.toggle("selected", shown);
    }

    if (marker.map !== map) {
      marker.map = map;
    }
  });
}

function hidePhotoSpots(item) {
  for (const photo of item?.gallery ?? []) {
    if (photo.marker) {
      photo.marker.map = null;
    }
  }
}

function showSpotPhoto(photo) {
  const index = selected?.gallery.indexOf(photo) ?? -1;

  if (index < 0) {
    return;
  }

  galleryIndex = index;
  showPhoto();
  // The photo is at the top of the panel, which the user may have scrolled down
  document.querySelector(".details-scroll").scrollTop = 0;
  setStatus(
    t("photo.title", { index: index + 1, total: selected.gallery.length }),
  );
}

// Elevation profile

// Only the first line: it is the whole route from start to end, and the other lines are short variants along it
function routeProfile(item) {
  return buildProfile(
    [item.paths[0]],
    [item.json.geometry.coordinates[0].map((coordinate) => coordinate[2])],
  );
}

// The chart of some paths and their heights, or undefined when fewer than two points have a height.
// Distance adds up inside each path only, so the gaps between the segments of a GPX file don't count
function buildProfile(paths, elevations) {
  const known = [];
  let length = 0;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];

    for (let j = 0; j < path.length; j++) {
      if (j > 0) {
        length += kilometersBetween(path[j - 1], path[j]);
      }

      const height = elevations[i][j];

      if (Number.isFinite(height)) {
        known.push({ distance: length, height: height, position: path[j] });
      }
    }
  }

  if (known.length < 2 || length === 0) {
    return undefined;
  }

  // The lowest and highest point of each column of the chart, so both peaks and valleys are kept
  const columns = [];

  for (const entry of known) {
    const column = Math.min(
      PROFILE.width - 1,
      Math.floor((entry.distance / length) * PROFILE.width),
    );
    const extremes = columns[column];

    if (!extremes) {
      columns[column] = { low: entry, high: entry };
    } else if (entry.height < extremes.low.height) {
      extremes.low = entry;
    } else if (entry.height > extremes.high.height) {
      extremes.high = entry;
    }
  }

  const points = [];

  for (const { low, high } of columns.filter(Boolean)) {
    const [first, second] =
      low.distance <= high.distance ? [low, high] : [high, low];
    points.push(first);

    if (second !== first) {
      points.push(second);
    }
  }

  const heights = points.map((entry) => entry.height);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const low = Math.floor(min / 100) * 100;
  const high = Math.ceil(max / 100) * 100;

  return {
    length: length,
    min: min,
    max: max,
    low: low,
    // At least 100 m, so a flat lakeside route draws as a flat line instead of magnified noise
    high: high > low ? high : low + 100,
    points: points,
  };
}

function profileX(profile, distance) {
  return (distance / profile.length) * PROFILE.width;
}

function profileY(profile, height) {
  return (
    PROFILE.bottom -
    ((height - profile.low) / (profile.high - profile.low)) *
      (PROFILE.bottom - PROFILE.top)
  );
}

function profileKilometers(value) {
  return formatNumber(value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function profileSection(item) {
  const profile = item.profile;

  if (!profile) {
    return "";
  }

  const min = formatNumber(Math.round(profile.min));
  const max = formatNumber(Math.round(profile.max));
  const length = profileKilometers(profile.length);
  const points = profile.points;
  const line = points
    .map(
      (entry, i) =>
        `${i === 0 ? "M" : "L"}${profileX(profile, entry.distance).toFixed(1)},${profileY(profile, entry.height).toFixed(1)}`,
    )
    .join("");
  const start = profileX(profile, points[0].distance).toFixed(1);
  const end = profileX(profile, points[points.length - 1].distance).toFixed(1);
  const area = `${line}L${end},${PROFILE.bottom}L${start},${PROFILE.bottom}Z`;

  let content = `<div class="profile" style="--color:${item.color}">`;
  content += `<div class="profile-head"><span>${t("profile.title")}</span><span class="profile-readout" id="profileReadout" data-default="${min}–${max} m">${min}–${max} m</span></div>`;
  content += `<svg class="profile-chart" viewBox="0 0 ${PROFILE.width} ${PROFILE.height}" role="img" aria-label="${t("profile.label", { low: min, high: max, length })}">`;
  content += `<line class="profile-grid" x1="0" y1="${PROFILE.top}" x2="${PROFILE.width}" y2="${PROFILE.top}"/>`;
  content += `<line class="profile-grid" x1="0" y1="${PROFILE.bottom}" x2="${PROFILE.width}" y2="${PROFILE.bottom}"/>`;
  content += `<path class="profile-area" d="${area}"/>`;
  content += `<path class="profile-line" d="${line}"/>`;
  // Inside the chart, so neither height is cut off at its edge
  content += `<text class="profile-label" x="0" y="${PROFILE.top + 12}">${formatNumber(profile.high)} m</text>`;
  content += `<text class="profile-label" x="0" y="${PROFILE.bottom - 4}">${formatNumber(profile.low)} m</text>`;
  content += `<text class="profile-label" x="0" y="${PROFILE.height - 2}">0</text>`;
  content += `<text class="profile-label" x="${PROFILE.width}" y="${PROFILE.height - 2}" text-anchor="end">${length} km</text>`;
  content += `<line class="profile-cursor" id="profileCursor" y1="${PROFILE.top}" y2="${PROFILE.bottom}" visibility="hidden"/>`;
  content +=
    '<circle class="profile-dot" id="profileDot" r="4" visibility="hidden"/>';

  return content + "</svg></div>";
}

function showProfilePoint(chart, event) {
  const profile = selected?.profile;

  if (!profile) {
    return;
  }

  const box = chart.getBoundingClientRect();
  const fraction = Math.min(
    1,
    Math.max(0, (event.clientX - box.left) / box.width),
  );
  const distance = fraction * profile.length;
  let nearest = profile.points[0];

  for (const entry of profile.points) {
    if (
      Math.abs(entry.distance - distance) <
      Math.abs(nearest.distance - distance)
    ) {
      nearest = entry;
    }
  }

  const x = profileX(profile, nearest.distance);
  const cursor = document.getElementById("profileCursor");
  cursor.setAttribute("x1", x);
  cursor.setAttribute("x2", x);
  cursor.setAttribute("visibility", "visible");

  const dot = document.getElementById("profileDot");
  dot.setAttribute("cx", x);
  dot.setAttribute("cy", profileY(profile, nearest.height));
  dot.setAttribute("visibility", "visible");

  document.getElementById("profileReadout").textContent =
    `${profileKilometers(nearest.distance)} km · ${formatNumber(Math.round(nearest.height))} m`;

  // Above the selected pin (2000), the bubbles (1000 plus their count) and the photo pins
  if (!profileMarker) {
    const content = document.createElement("div");
    content.className = "profile-marker";

    profileMarker = new google.maps.marker.AdvancedMarkerElement({
      content: content,
      zIndex: PHOTO_ZINDEX * 2,
    });
  }

  profileMarker.content.style.setProperty("--color", selected.color);
  profileMarker.position = nearest.position;

  if (profileMarker.map !== map) {
    profileMarker.map = map;
  }
}

// Runs on every pointer move over the panel outside the chart, so it does nothing once the point is hidden
function hideProfilePoint() {
  if (profileMarker?.map) {
    profileMarker.map = null;
  }

  const cursor = document.getElementById("profileCursor");

  if (cursor?.getAttribute("visibility") === "visible") {
    cursor.setAttribute("visibility", "hidden");
    document.getElementById("profileDot").setAttribute("visibility", "hidden");

    const readout = document.getElementById("profileReadout");
    readout.textContent = readout.dataset.default;
  }
}

// Controls

function bindControls() {
  document
    .getElementById("zoomIn")
    .addEventListener("click", () => map.setZoom(map.getZoom() + 1));
  document
    .getElementById("zoomOut")
    .addEventListener("click", () => map.setZoom(map.getZoom() - 1));

  for (const button of document.querySelectorAll("[data-map-type]")) {
    button.addEventListener("click", () => {
      setMapType(button.dataset.mapType);
      scheduleAddress();
    });
  }

  for (const button of document.querySelectorAll("[data-language]")) {
    button.addEventListener("click", () =>
      setLanguage(button.dataset.language),
    );
  }

  // Hidden with the attribute, not only by CSS, so opening the menu doesn't focus its invisible first button
  if (LIGHT_DARK) {
    for (const button of document.querySelectorAll("[data-theme-choice]")) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.themeChoice === PAGE_THEME,
      );
      button.addEventListener("click", () =>
        setTheme(button.dataset.themeChoice),
      );
    }
  } else {
    document.getElementById("themeRow").hidden = true;
  }

  document.getElementById("menuToggle").addEventListener("click", () => {
    if (menuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document
    .getElementById("clearAll")
    .addEventListener("click", confirmClearAll);

  // The form fills the box, so only a click on the backdrop reaches the dialog itself
  const dialog = document.getElementById("confirm");
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  const input = document.getElementById("gpxInput");

  document
    .getElementById("uploadButton")
    .addEventListener("click", () => input.click());
  // The menu closes first, while the keyboard is still on the button that is about to hide
  document.getElementById("uploadRemove").addEventListener("click", () => {
    closeMenu();
    removeUpload();
  });
  input.addEventListener("change", () => {
    const file = input.files[0];
    // Cleared so that choosing the same file again still fires a change
    input.value = "";

    if (file) {
      loadUpload(file);
    }
  });

  // The error event of an image doesn't bubble, so it is caught on the way down
  document.getElementById("details").addEventListener(
    "error",
    (event) => {
      const image = event.target;

      if (!selected || image.tagName !== "IMG") {
        return;
      }

      if (image.id === "galleryImage") {
        dropPhoto(image);
      } else if (image.classList.contains("details-logo")) {
        image.outerHTML = plateBadge(selected);
      }
    },
    true,
  );

  document.getElementById("details").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const action = button?.dataset.action;

    if (action === "close") {
      closeDetails();
    } else if (action === "share") {
      copyLink(button);
    } else if (action === "save") {
      toggleSaved(button);
    } else if (action === "download") {
      download();
    } else if (action === "remove-upload") {
      removeUpload();
    } else if (action === "previous") {
      plusSlides(-1);
    } else if (action === "next") {
      plusSlides(1);
    }
  });

  // The elevation chart is rebuilt with the panel, so its pointer events are caught on the panel.
  // A touch press that doesn't move fires no pointermove, so pointerdown shows the point too
  for (const type of ["pointerdown", "pointermove"]) {
    document.getElementById("details").addEventListener(type, (event) => {
      const chart = event.target.closest(".profile-chart");

      if (chart) {
        showProfilePoint(chart, event);
      } else {
        hideProfilePoint();
      }
    });
  }

  // A lifted finger is gone, while a mouse stays where it is
  document.getElementById("details").addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") {
      hideProfilePoint();
    }
  });

  // pointerleave doesn't bubble, so it fires only when the pointer leaves the whole panel. Leaving the chart inside the panel is caught by pointermove
  for (const type of ["pointerleave", "pointercancel"]) {
    document.getElementById("details").addEventListener(type, hideProfilePoint);
  }

  // A wheel scroll moves the chart away from a mouse that stays still, which fires no pointermove. Scroll doesn't bubble, so it is caught on the way down
  document
    .getElementById("details")
    .addEventListener("scroll", hideProfilePoint, true);

  document.addEventListener("keydown", (event) => {
    // The open dialog takes Escape for itself, so the menu or details behind it stay open
    if (event.key === "Escape" && !document.getElementById("confirm").open) {
      hideTooltip();

      // One panel at a time: the menu first, then the details
      if (menuOpen()) {
        closeMenu();
      } else {
        closeDetails();
      }
    }
  });
}

function setMapType(type) {
  map.setMapTypeId(type);

  for (const button of document.querySelectorAll("[data-map-type]")) {
    button.setAttribute("aria-pressed", button.dataset.mapType === type);
  }
}

function mapPadding() {
  // The panels sit beside the map, so only the zoom and map type controls need room
  return {
    top: 24,
    bottom: 48,
    left: 24,
    right: 24,
  };
}

// Moves the map step by step to the view fitBounds would jump to: the bounds inside the padding, at a whole zoom
function glideTo(bounds) {
  stopGlide();

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    map.fitBounds(bounds, mapPadding());
    return;
  }

  // Positions in world coordinates, the map's pixels at zoom 0
  const projection = map.getProjection();
  const padding = mapPadding();
  const northWest = projection.fromLatLngToPoint(
    point(bounds.north, bounds.west),
  );
  const southEast = projection.fromLatLngToPoint(
    point(bounds.south, bounds.east),
  );
  const width = map.getDiv().clientWidth - padding.left - padding.right;
  const height = map.getDiv().clientHeight - padding.top - padding.bottom;

  const zoom = Math.floor(
    Math.log2(
      Math.min(
        width / (southEast.x - northWest.x),
        height / (southEast.y - northWest.y),
      ),
    ),
  );

  // The padding is uneven, so the map's center sits off the middle of the bounds
  const scale = 2 ** zoom;
  const target = {
    x: (northWest.x + southEast.x + (padding.right - padding.left) / scale) / 2,
    y: (northWest.y + southEast.y + (padding.bottom - padding.top) / scale) / 2,
  };

  const start = projection.fromLatLngToPoint(map.getCenter());
  const startZoom = map.getZoom();
  const change = zoom - startZoom;
  const began = performance.now();

  // A raster map only takes whole zooms unless told otherwise. The glide still ends on one
  map.setOptions({ isFractionalZoomEnabled: true });

  const step = (now) => {
    const time = Math.min((now - began) / GLIDE_DURATION, 1);
    const eased = time < 0.5 ? 4 * time ** 3 : 1 - (2 - 2 * time) ** 3 / 2;
    // The pan keeps pace with the zoom, so the view zooms about one fixed spot instead of swinging the route out and back
    const share =
      change === 0 ? eased : (1 - 2 ** (-change * eased)) / (1 - 2 ** -change);

    map.moveCamera({
      center: projection.fromPointToLatLng(
        new google.maps.Point(
          start.x + (target.x - start.x) * share,
          start.y + (target.y - start.y) * share,
        ),
      ),
      zoom: startZoom + change * eased,
    });

    if (time < 1) {
      glideFrame = requestAnimationFrame(step);
    } else {
      stopGlide();
    }
  };

  glideFrame = requestAnimationFrame(step);
}

function stopGlide() {
  if (glideFrame) {
    cancelAnimationFrame(glideFrame);
    glideFrame = undefined;
    map.setOptions({ isFractionalZoomEnabled: false });
  }
}

// Confirm

// Asks before clearing what the visitor set up. Cancel, Escape and a click beside the box all cancel
function confirmAction(title, text, label, onConfirm) {
  const dialog = document.getElementById("confirm");
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmText").textContent = text;
  document.getElementById("confirmAction").textContent = label;
  dialog.returnValue = "";

  dialog.addEventListener(
    "close",
    () => {
      if (dialog.returnValue === "confirm") {
        onConfirm();
      }
    },
    { once: true },
  );

  dialog.showModal();
}

// Clear all

function confirmClearAll() {
  const rows = pressedRows(document.getElementById("layers"));

  confirmAction(
    t("clear.title"),
    tCount("clear.text", rows),
    t("clear.button"),
    clearAll,
  );
}

// The Saved rows, the open details, an uploaded track and the map type stay as they are
function clearAll() {
  const layers = document.getElementById("layers");

  for (const button of layers.querySelectorAll(
    '[data-layer][aria-pressed="true"]',
  )) {
    setLayer(button, false);
  }

  for (const input of layers.querySelectorAll("input")) {
    input.value = "";
  }

  for (const chip of layers.querySelectorAll(
    '[data-grade-filter][aria-pressed="true"]',
  )) {
    chip.setAttribute("aria-pressed", "false");
  }

  track("layers_clear");
  sharedItem = undefined;
  layersChanged();
  scheduleAddress();

  // The button hides once nothing is on, so focus moves on instead of being lost with it. The open menu makes the rows unreachable
  const target = menuOpen()
    ? document.getElementById("menuToggle")
    : layers.querySelector("[data-layer]");
  target.focus();
}

// Saved

function savedRows() {
  return (
    savedRow(
      "saved.routes",
      t("saved.routes"),
      t("saved.removeRoutes"),
      '<span class="swatch swatch-line"></span>',
    ) +
    savedRow(
      "saved.places",
      t("saved.places"),
      t("saved.removePlaces"),
      iconSwatch("location_on"),
    ) +
    `<p class="saved-empty" id="savedEmpty">${t("saved.empty")}</p>`
  );
}

// A button can't hold another, so the delete button sits beside the row's toggle. It is enabled by updateSavedLayers
function savedRow(layer, name, removeLabel, swatch) {
  return `<div class="saved-row">${toggleRow(layer, name, swatch, "var(--ink)")}<button type="button" class="saved-delete" data-saved-delete="${layer}" aria-label="${removeLabel}" disabled><span class="material-symbols-outlined">delete</span></button></div>`;
}

// Route files sit in a folder named after their activity
function isRouteUrl(url) {
  return ACTIVITIES.some((activity) => url.startsWith(`${activity.id}/`));
}

// The stored list, or undefined when the browser blocks storage. A list of another format is read as empty
function readSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY));

    if (stored?.version === SAVED_VERSION && Array.isArray(stored.items)) {
      return new Set(stored.items.filter((key) => typeof key === "string"));
    }

    return new Set();
  } catch {
    return undefined;
  }
}

function writeSaved() {
  try {
    localStorage.setItem(
      SAVED_STORAGE_KEY,
      JSON.stringify({ version: SAVED_VERSION, items: [...saved] }),
    );
  } catch (error) {
    // Blocked or full storage: the list lasts until the page closes
    savedWritable = false;
    console.error("Could not keep the saved list", error);
  }
}

// The layer that lists a data file, or undefined when no layer does any more
function fileLayer(url) {
  return Object.values(LAYERS).find(
    (layer) => !layer.keep && layer.urls.includes(url),
  );
}

// A saved item whose file no layer lists any more is skipped, and stays in storage in case it comes back
function updateSavedLayers() {
  const routes = LAYERS["saved.routes"];
  const places = LAYERS["saved.places"];

  for (const layer of [routes, places]) {
    layer.urls = [];
    layer.count = 0;
  }

  for (const key of saved) {
    const url = key.split("#")[0];

    if (!fileLayer(url)) {
      continue;
    }

    const layer = isRouteUrl(url) ? routes : places;

    if (!layer.urls.includes(url)) {
      layer.urls.push(url);
    }

    layer.count++;
  }

  for (const layer of [routes, places]) {
    document.querySelector(`[data-saved-delete="${layer.row}"]`).disabled =
      layer.count === 0;
  }

  document.getElementById("savedEmpty").hidden =
    routes.count + places.count > 0;
}

function toggleSaved(button) {
  const item = selected;
  // The button decides, not the stored list, so a tab whose list is out of date still does what was clicked
  const save = !button.classList.contains("saved");

  // Read again first, so the saves of other tabs are kept
  if (savedWritable) {
    saved = readSaved() ?? saved;
  }

  if (save) {
    saved.add(item.url);
  } else {
    saved.delete(item.url);
  }

  writeSaved();
  track(save ? "save_item" : "unsave_item", {
    content_type: contentType(item),
    item_id: trackLabel(item),
  });

  showSaved(button, save);
  setStatus(t(save ? "status.saved" : "status.unsaved"));

  updateSavedLayers();
  loadSavedFiles();
  scheduleRender();
}

// Loaded files are cached, but an item saved in another tab may need its file
function loadSavedFiles() {
  for (const id of ["saved.routes", "saved.places"]) {
    if (activeLayers.has(id)) {
      for (const url of LAYERS[id].urls) {
        loadFile(url, LAYERS[id].build);
      }
    }
  }
}

// Changed in place, so the gallery keeps its photo
function showSaved(button, isSaved) {
  button.classList.toggle("saved", isSaved);
  button.querySelector(".action-label").textContent = t(
    isSaved ? "action.saved" : "action.save",
  );
}

function confirmRemoveSaved(row) {
  const title =
    row === "saved.routes"
      ? "saved.removeRoutesTitle"
      : "saved.removePlacesTitle";

  confirmAction(
    tCount(title, LAYERS[row].count),
    t("saved.removeText"),
    t("action.remove"),
    () => removeSaved(row),
  );
}

// Every stored item of the row's kind goes, also those no longer in the data
function removeSaved(row) {
  const routes = row === "saved.routes";

  if (savedWritable) {
    saved = readSaved() ?? saved;
  }

  for (const key of saved) {
    if (isRouteUrl(key) === routes) {
      saved.delete(key);
    }
  }

  writeSaved();
  track("saved_clear", { content_type: routes ? "routes" : "places" });

  const button = document.querySelector(`[data-layer="${row}"]`);

  if (activeLayers.has(row)) {
    setLayer(button, false);
  }

  updateSavedLayers();
  loadSavedFiles();

  const save = document.querySelector('#details [data-action="save"]');

  if (selected && save && !saved.has(selected.url)) {
    showSaved(save, false);
  }

  layersChanged();

  // The delete button is now disabled, so focus moves to its row instead of being lost
  button.focus();
}

// Theme

// A color pair as one CSS value, which takes the side of the color scheme where it is used: the page's in the panels, the map's on it.
// Browsers without light-dark() would drop the whole value, so they get the light color
function cssColor(colors) {
  if (!LIGHT_DARK) {
    return colors.light;
  }

  return `light-dark(${colors.light}, ${colors.dark})`;
}

// The scheme the panels show now: the visitor's pick, or the system's under Auto
function pageScheme(theme) {
  if (theme !== "auto") {
    return theme;
  }

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// The panels switch at once through color-scheme in style.css. The map keeps its scheme until the next visit, which the hint says
function setTheme(theme) {
  const buttons = document.querySelectorAll("[data-theme-choice]");
  const current = [...buttons].find(
    (button) => button.getAttribute("aria-pressed") === "true",
  );

  if (theme === current.dataset.themeChoice) {
    return;
  }

  if (theme === "auto") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }

  try {
    if (theme === "auto") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch (error) {
    // Blocked storage: the choice lasts until the page closes
  }

  for (const button of buttons) {
    button.setAttribute("aria-pressed", button.dataset.themeChoice === theme);
  }

  document.getElementById("themeHint").hidden =
    pageScheme(theme) === MAP_SCHEME;

  track("theme_change", { theme: theme });
}

// Menu

function menuOpen() {
  return document.getElementById("menu").classList.contains("open");
}

// The menu covers the layer rows, so they are taken out of the keyboard order while it is open
function openMenu() {
  const menu = document.getElementById("menu");
  menu.classList.add("open");
  menu.inert = false;
  document.getElementById("layers").inert = true;

  const toggle = document.getElementById("menuToggle");
  toggle.setAttribute("aria-expanded", true);
  toggle.firstElementChild.textContent = "close";

  // The buttons of a hidden row carry no hidden of their own
  menu.querySelector("button:not([hidden]):not([hidden] *)").focus();
}

function closeMenu() {
  if (!menuOpen()) {
    return;
  }

  const menu = document.getElementById("menu");
  const hadFocus = menu.contains(document.activeElement);
  menu.classList.remove("open");
  menu.inert = true;
  document.getElementById("layers").inert = false;

  const toggle = document.getElementById("menuToggle");
  toggle.setAttribute("aria-expanded", false);
  toggle.firstElementChild.textContent = "menu";

  // The error was announced when it appeared, and is out of date once the menu opens again
  showUploadError(undefined);

  // Focus inside the hidden menu would be lost, so it goes back to the menu button. A click on the map has already moved it
  if (hadFocus) {
    toggle.focus();
  }
}

// Uploaded GPX

async function loadUpload(file) {
  const parsed = parseGpx(await file.text().catch(() => ""), file.name);

  if (typeof parsed === "string") {
    showUploadError(t(parsed));
    return;
  }

  showUploadError(undefined);
  removeUpload();

  uploaded = buildUpload(parsed);
  document.getElementById("uploadRemove").hidden = false;
  track("gpx_upload");

  // Closed first, so the keyboard is on the menu button when the track's details open. Closing them returns it there, unless other details were already open (selectItem keeps their return point)
  closeMenu();
  selectItem(uploaded, "upload");
  map.fitBounds(uploaded.bounds, mapPadding());
}

function showUploadError(message) {
  const error = document.getElementById("uploadError");
  error.textContent = message ?? "";
  error.hidden = !message;
}

// Returns the track, or the key of the message to show when the file has none
function parseGpx(text, filename) {
  const xml = new DOMParser().parseFromString(text, "application/xml");

  if (
    xml.querySelector("parsererror") ||
    xml.documentElement.localName !== "gpx"
  ) {
    return "upload.notGpx";
  }

  const track = xml.getElementsByTagName("trk")[0];
  const route = xml.getElementsByTagName("rte")[0];
  const segments = track
    ? [...track.getElementsByTagName("trkseg")].map((segment) => [
        ...segment.getElementsByTagName("trkpt"),
      ])
    : route
      ? [[...route.getElementsByTagName("rtept")]]
      : [];

  const paths = [];
  const elevations = [];

  for (const segment of segments) {
    const path = [];
    const heights = [];

    for (const element of segment) {
      const lat = parseFloat(element.getAttribute("lat"));
      const lng = parseFloat(element.getAttribute("lon"));
      const height = parseFloat(
        element.getElementsByTagName("ele")[0]?.textContent,
      );

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        path.push(point(lat, lng));
        heights.push(height);
      }
    }

    if (path.length >= 2) {
      paths.push(path);
      elevations.push(heights);
    }
  }

  if (paths.length === 0) {
    return "upload.noTrack";
  }

  const owner = track ?? route;
  const name = [...owner.children]
    .find((child) => child.localName === "name")
    ?.textContent.trim();

  return {
    name: name || filename.replace(/\.gpx$/i, ""),
    paths: paths,
    elevations: elevations,
  };
}

function buildUpload(parsed) {
  const { ascent, descent } = climbs(parsed.elevations);

  const item = {
    kind: "upload",
    type: "upload",
    label: parsed.name,
    color: cssColor(UPLOAD_COLORS),
    lineColor: UPLOAD_COLORS[MAP_SCHEME],
    length: parsed.paths.reduce((sum, path) => sum + pathLength(path), 0),
    ascent: ascent,
    descent: descent,
    profile: buildProfile(parsed.paths, parsed.elevations),
    paths: parsed.paths,
    bounds: getBounds(parsed.paths.flat()),
    gallery: [],
    casings: [],
    markers: [],
  };

  item.lines = item.paths.map((path) => {
    const line = createLine(item, path);
    line.setOptions(lineStyle(item, 4, 0.95, 900));
    line.setMap(map);

    return line;
  });

  // The outline keeps the track readable on top of the routes
  for (const path of item.paths) {
    item.casings.push(
      new google.maps.Polyline({
        path: path,
        strokeColor: CASING_COLORS[MAP_SCHEME],
        strokeOpacity: 0.95,
        strokeWeight: 8,
        zIndex: 899,
        clickable: false,
        map: map,
      }),
    );
  }

  const lastPath = item.paths[item.paths.length - 1];
  const ends = [
    ["start", item.paths[0][0]],
    ["end", lastPath[lastPath.length - 1]],
  ];

  for (const [name, position] of ends) {
    const content = document.createElement("div");
    content.className = `track-end track-end-${name}`;

    const marker = createMarker(position, content, item);
    marker.title = t(`upload.${name}`, { name: item.label });
    marker.zIndex = 900;
    marker.map = map;
    item.markers.push(marker);
  }

  return item;
}

function removeUpload() {
  if (!uploaded) {
    return;
  }

  for (const line of [...uploaded.lines, ...uploaded.casings]) {
    line.setMap(null);
  }

  for (const marker of uploaded.markers) {
    marker.map = null;
  }

  if (selected === uploaded) {
    closeDetails();
  }

  uploaded = undefined;
  document.getElementById("uploadRemove").hidden = true;
}

// Kilometers
function pathLength(path) {
  let length = 0;

  for (let i = 1; i < path.length; i++) {
    length += kilometersBetween(path[i - 1], path[i]);
  }

  return length;
}

function kilometersBetween(a, b) {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLng = (b.lng - a.lng) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * radians) *
      Math.cos(b.lat * radians) *
      Math.sin(dLng / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Ascent and descent in meters, or undefined when the file has no elevation
function climbs(elevations) {
  let ascent = 0;
  let descent = 0;
  let known = 0;

  for (const heights of elevations) {
    const valid = heights.filter(Number.isFinite);
    known += valid.length;

    // The reference moves only once the height has changed by more than the noise
    let reference = valid[0];

    for (const height of valid) {
      if (height - reference >= ELEVATION_NOISE) {
        ascent += height - reference;
        reference = height;
      } else if (reference - height >= ELEVATION_NOISE) {
        descent += reference - height;
        reference = height;
      }
    }
  }

  return known >= 2
    ? { ascent: Math.round(ascent), descent: Math.round(descent) }
    : { ascent: undefined, descent: undefined };
}

function uploadDetails(item) {
  let content = `<div class="details-kind"><span class="swatch swatch-line" style="--color:${item.color}"></span>${t("upload.kind")}</div>`;
  content += `<h2 class="details-title">${escapeHtml(item.label)}</h2>`;
  content += actions([
    `<button type="button" class="action" data-action="remove-upload"><span class="material-symbols-outlined">delete</span>${t("action.remove")}</button>`,
  ]);

  let stats = stat(
    t("stat.distance"),
    formatNumber(item.length, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    "km",
  );

  if (item.ascent !== undefined) {
    stats += stat(t("stat.ascent"), formatNumber(item.ascent), "m");
    stats += stat(t("stat.descent"), formatNumber(item.descent), "m");
  }

  return content + `<dl class="stats">${stats}</dl>` + profileSection(item);
}

// Address

function readPosition() {
  const match = PARAMS.get("map")?.match(
    /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/,
  );

  if (!match) {
    return undefined;
  }

  const [lat, lng, zoom] = match.slice(1).map(Number);

  if (Math.abs(lat) > 85 || Math.abs(lng) > 180 || zoom > 22) {
    return undefined;
  }

  return {
    center: point(lat, lng),
    zoom: zoom,
  };
}

// 5 decimals are about 1 m. The zoom can be fractional when the map is drawn as vector
function mapPosition() {
  const center = map.getCenter();

  return [
    Number(center.lat().toFixed(5)),
    Number(center.lng().toFixed(5)),
    Number(map.getZoom().toFixed(2)),
  ].join(",");
}

function addressList(key) {
  return (PARAMS.get(key) ?? "").split(",").filter(Boolean);
}

function activeLevels(activity) {
  return LEVELS.filter((level) =>
    activeLayers.has(`${activity.id}.${level.id}`),
  );
}

// Only routes and SchweizMobil / My Switzerland places have a Copy link, and only they can be rebuilt from one (see sharedItemBuilder)
function addressItem() {
  return selected?.kind === "route" || selected?.kind === "place"
    ? selected
    : sharedItem;
}

function scheduleAddress() {
  if (SMALL_SCREEN) {
    return;
  }

  clearTimeout(addressTimeout);
  addressTimeout = setTimeout(writeAddress, ADDRESS_DELAY);
}

function restoreView() {
  const buttons = new Map(
    [...document.querySelectorAll("[data-layer]")].map((button) => [
      button.dataset.layer,
      button,
    ]),
  );
  const rows = [
    ...ACTIVITIES.flatMap((activity) =>
      addressList(activity.id).map((level) => `${activity.id}.${level}`),
    ),
    ...addressList("places").filter((id) => !id.includes(".")),
    ...addressList("favorites").map((id) => `favorites.${id}`),
  ];

  // A row the panel lacks (a favorite without ?favorites=1, a row removed since) is skipped
  for (const id of rows) {
    const button = buttons.get(id);

    if (button && !activeLayers.has(id)) {
      setLayer(button, true);
    }
  }

  // Setting a value or a pressed state fires no event, so the shared item stays on the map.
  // A filter whose activity has no level on would wait in its hidden box and apply later, so it is skipped
  for (const activity of ACTIVITIES) {
    if (activeLevels(activity).length === 0) {
      continue;
    }

    for (const [key, input] of Object.entries(ADDRESS_RANGES)) {
      const match = PARAMS.get(`${activity.id}.${key}`)?.match(/^(\d*)-(\d*)$/);

      if (match) {
        document.getElementById(`filter-${activity.id}-${input}Min`).value =
          match[1];
        document.getElementById(`filter-${activity.id}-${input}Max`).value =
          match[2];
      }
    }

    for (const [key, filter] of Object.entries(ADDRESS_GRADES)) {
      const grades = addressList(`${activity.id}.${key}`);

      for (const chip of document.querySelectorAll(
        `[data-grade-filter="${activity.id}-${filter}"]`,
      )) {
        if (grades.includes(chip.dataset.grade)) {
          chip.setAttribute("aria-pressed", "true");
        }
      }
    }
  }

  // Compared with the buttons' values, so the address's value never goes into a selector
  const mapType = PARAMS.get("maptype");

  for (const button of document.querySelectorAll("[data-map-type]")) {
    if (button.dataset.mapType === mapType) {
      setMapType(mapType);
    }
  }

  layersChanged();
}

// The owned keys are rewritten in a fixed order, so the same view always gives the same address
function writeAddress() {
  const params = new URLSearchParams(location.search);

  for (const key of [...params.keys()]) {
    if (
      ADDRESS_KEYS.includes(key) ||
      ACTIVITIES.some(
        (activity) => key === activity.id || key.startsWith(`${activity.id}.`),
      )
    ) {
      params.delete(key);
    }
  }

  const item = addressItem();

  if (item) {
    params.set("url", item.url);
    params.set("type", item.type);
  }

  for (const activity of ACTIVITIES) {
    const levels = activeLevels(activity);

    if (levels.length === 0) {
      continue;
    }

    params.set(activity.id, levels.map((level) => level.id).join(","));

    for (const [key, input] of Object.entries(ADDRESS_RANGES)) {
      const min = readInt(`filter-${activity.id}-${input}Min`);
      const max = readInt(`filter-${activity.id}-${input}Max`);

      // Zero and negative bounds filter nothing (see inRange)
      if (min > 0 || max > 0) {
        params.set(
          `${activity.id}.${key}`,
          `${min > 0 ? min : ""}-${max > 0 ? max : ""}`,
        );
      }
    }

    for (const [key, filter] of Object.entries(ADDRESS_GRADES)) {
      const grades = pressedGrades(`${activity.id}-${filter}`);

      if (grades.length > 0) {
        params.set(`${activity.id}.${key}`, grades.join(","));
      }
    }
  }

  // In definition order, not panel order, so a data refresh that reorders the panel doesn't change addresses
  const places = Object.keys(LAYERS).filter(
    (id) => !id.includes(".") && activeLayers.has(id),
  );

  if (places.length > 0) {
    params.set("places", places.join(","));
  }

  if (FAVORITES_ENABLED) {
    const favorites = Object.keys(LAYERS)
      .filter((id) => id.startsWith("favorites.") && activeLayers.has(id))
      .map((id) => id.split(".")[1]);

    params.set("favorites", favorites.length > 0 ? favorites.join(",") : "1");
  }

  const position = mapPosition();

  if (openingPosition !== undefined && position !== openingPosition) {
    params.set("map", position);
  }

  if (map.getMapTypeId() !== "roadmap") {
    params.set("maptype", map.getMapTypeId());
  }

  replaceQuery(params);
}

// Commas and slashes mean nothing in a query, so they stay readable
function replaceQuery(params) {
  const search = params.toString().replace(/%2C/g, ",").replace(/%2F/g, "/");
  const address = search ? `${location.pathname}?${search}` : location.pathname;

  if (address !== location.pathname + location.search) {
    history.replaceState(history.state, "", address + location.hash);
  }
}

// Languages

// The text of key in the interface language, with each {name} filled from params. A missing translation shows the English
function t(key, params = {}) {
  const text = STRINGS[key]?.[language] ?? STRINGS[key]?.en ?? key;

  return text.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

// The text of key for a number of things: key.one or key.other, as the language's plural rules pick, with {count} filled in
function tCount(key, count) {
  const form = new Intl.PluralRules(LANGUAGE_TAGS[language]).select(count);
  const variant = STRINGS[`${key}.${form}`] ? form : "other";

  return t(`${key}.${variant}`, { count: formatNumber(count) });
}

// SchweizMobil's text of a route or sightseeing place in the interface language, or in code's. Without a translation (Spanish, Portuguese, hand-made entries) it is the English
function localText(properties, field, code = language) {
  return properties.translations?.[code]?.[field] ?? properties[field];
}

// The tag of the language localText gives field in, for a lang attribute
function textLanguage(properties, field) {
  return properties.translations?.[language]?.[field]
    ? LANGUAGE_TAGS[language]
    : "en";
}

// Numbers in the interface language's format: Swiss for German, French and Italian, Spain's and Portugal's for Spanish and Portuguese. English keeps the browser's own format, as before
function formatNumber(value, options) {
  return value.toLocaleString(
    language === "en" ? undefined : LANGUAGE_TAGS[language],
    options,
  );
}

// The text written in index.html, which carries its keys in data-i18n (text) and data-i18n-label (aria-label)
function translatePage() {
  document.documentElement.lang = LANGUAGE_TAGS[language];
  document.title = t("page.title");

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }

  for (const element of document.querySelectorAll("[data-i18n-label]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nLabel));
  }

  for (const button of document.querySelectorAll("[data-language]")) {
    button.setAttribute("aria-pressed", button.dataset.language === language);
  }
}

// Everything changes in place, so rows, filters, the open item, the map and an uploaded track all stay. Google's own map labels change at the next visit
function setLanguage(code) {
  if (code === language || !Object.hasOwn(LANGUAGE_TAGS, code)) {
    return;
  }

  const previous = language;
  language = code;

  try {
    localStorage.setItem(LANGUAGE_KEY, code);
  } catch (error) {
    // Blocked storage: the choice lasts until the page closes
  }

  // A lang in the address would win over the new choice at the next load
  const params = new URLSearchParams(location.search);

  if (params.has("lang")) {
    params.delete("lang");
    replaceQuery(params);
  }

  translatePage();
  rebuildPanel();
  refreshMapText();

  if (selected) {
    refreshDetails();
  }

  track("language_change", { previous_language: previous });
}

// The panel is built again with what the visitor set in it: the filters, the open sections and the scroll
function rebuildPanel() {
  const layers = document.getElementById("layers");
  const values = [...layers.querySelectorAll("input")].map((input) => [
    input.id,
    input.value,
  ]);
  const grades = [
    ...layers.querySelectorAll('[data-grade-filter][aria-pressed="true"]'),
  ].map((chip) => [chip.dataset.gradeFilter, chip.dataset.grade]);
  const open = [...document.querySelectorAll("details.group[open]")].map(
    (details) => details.dataset.section,
  );
  const scroll = layers.scrollTop;

  buildPanel();

  // Setting a value or a pressed state fires no event, so the shared item stays on the map
  for (const [id, value] of values) {
    document.getElementById(id).value = value;
  }

  for (const [filter, grade] of grades) {
    layers
      .querySelector(`[data-grade-filter="${filter}"][data-grade="${grade}"]`)
      .setAttribute("aria-pressed", "true");
  }

  for (const section of open) {
    document.querySelector(`details[data-section="${section}"]`).open = true;
  }

  // Page-wide, as the Saved rows in the menu are built again too
  for (const button of document.querySelectorAll("[data-layer]")) {
    button.setAttribute("aria-pressed", activeLayers.has(button.dataset.layer));
  }

  // The error was announced when it appeared, and isn't repeated in the new language
  showUploadError(undefined);
  layersChanged();

  // Once the filter boxes are shown again, or the panel would be too short to scroll that far
  layers.scrollTop = scroll;
}

// The details are written again at the same photo and scroll. Focus stays on the language button
function refreshDetails() {
  const details = document.getElementById("details");
  const scroll = details.querySelector(".details-scroll").scrollTop;

  hideProfilePoint();
  details.innerHTML = detailsContent(selected);

  if (galleryIndex > 0) {
    showPhoto();
  }

  details.querySelector(".details-scroll").scrollTop = scroll;
  drawPhotoSpots();
}

// Map items keep the text they were made with, so the titles that are interface text are set again
function refreshMapText() {
  for (const items of files.values()) {
    for (const item of items) {
      if (item.kind === "route") {
        item.label = routeLabel(item.json.properties);
        item.badge.title = item.label;
      } else if (item.kind === "place") {
        item.label = placeLabel(item.json.properties);
      } else if (item.kind === "osm" && !item.json.name) {
        item.label = t(`place.${item.place.id}.label`);
      } else {
        continue;
      }

      if (item.marker) {
        item.marker.title = item.label;
      }
    }
  }

  // The first marker is the start
  uploaded?.markers.forEach((marker, i) => {
    marker.title = t(i === 0 ? "upload.start" : "upload.end", {
      name: uploaded.label,
    });
  });

  // New keys make drawPins create every bubble again, with the new title
  pointIndexVersion++;
  drawPins();
}

// Analytics

// Set by the Firebase snippet in index.html, and missing when analytics is blocked
function track(name, params) {
  window.trackEvent?.(name, { ...params, ui_language: language });
}

// The item's name for reports, in English so reports don't split by language. An unnamed OpenStreetMap place is named by its kind
function trackLabel(item) {
  // The name of an uploaded file is the user's own, so it is not sent
  if (item.kind === "upload") {
    return "upload";
  }

  if (item.kind === "route") {
    return routeLabel(item.json.properties, "en");
  }

  if (item.kind === "place") {
    return placeLabel(item.json.properties, "en");
  }

  if (item.kind === "osm" && !item.json.name) {
    return STRINGS[`place.${item.place.id}.label`].en;
  }

  return item.label;
}

// The address keeps the open item, so a reload or a step back to the site reopens it without anyone sharing a link
function linkSource() {
  const type = performance.getEntriesByType("navigation")[0]?.type;

  return type === "reload" || type === "back_forward"
    ? "reload"
    : "shared_link";
}

// Places report their category (camping, hostel…), routes their activity
function contentType(item) {
  return item.place?.id ?? item.type;
}

// Helpers

function point(lat, lng) {
  return {
    lat: lat,
    lng: lng,
  };
}

function getBounds(points) {
  const bounds = {
    north: -90,
    south: 90,
    east: -180,
    west: 180,
  };

  for (const coordinate of points) {
    bounds.north = Math.max(bounds.north, coordinate.lat);
    bounds.south = Math.min(bounds.south, coordinate.lat);
    bounds.east = Math.max(bounds.east, coordinate.lng);
    bounds.west = Math.min(bounds.west, coordinate.lng);
  }

  return bounds;
}

function around(position, gap) {
  return {
    north: position.lat + gap,
    south: position.lat - gap,
    east: position.lng + gap,
    west: position.lng - gap,
  };
}

function download() {
  track("gpx_download", { item_id: trackLabel(selected) });

  const data = gpxData(selected.json);
  const filename = `${selected.json.properties.r_number} - ${localText(selected.json.properties, "title")}.gpx`;
  const file = new Blob([data], { type: "application/xml" });

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else {
    const a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

function gpxData(json) {
  const name = escapeHtml(
    `${json.properties.r_number} - ${localText(json.properties, "title")}`,
  );
  let xml = "<?xml version='1.0' encoding='UTF-8'?>\n";
  xml +=
    "<gpx version='1.1' xmlns='http://www.topografix.com/GPX/1/1' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'>\n";
  xml += "\t<metadata>\n";
  xml += `\t\t<name>${name}</name>\n`;
  xml += "\t</metadata>\n";
  xml += "\t<trk>\n";
  xml += `\t\t<name>${name}</name>\n`;

  for (const stage of json.geometry.coordinates) {
    xml += "\t\t<trkseg>\n";

    for (const point of stage) {
      const lat = point[0];
      const lon = point[1];
      const ele = Number.isFinite(point[2]) ? `<ele>${point[2]}</ele>` : "";

      xml += `\t\t\t<trkpt lat='${lat}' lon='${lon}'>${ele}</trkpt>\n`;
    }

    xml += "\t\t</trkseg>\n";
  }

  xml += "\t</trk>\n";
  xml += "</gpx>";

  return xml;
}

function readInt(field) {
  const value = document.getElementById(field).value;

  return value ? parseInt(value) : undefined;
}

// The grades of the pressed chips of one filter row. Cycling has no Difficulty chips, so its list is always empty
function pressedGrades(filter) {
  return [
    ...document.querySelectorAll(
      `[data-grade-filter="${filter}"][aria-pressed="true"]`,
    ),
  ].map((chip) => chip.dataset.grade);
}
