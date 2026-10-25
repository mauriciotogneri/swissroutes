"use strict";

// The map opens fitted to this area: zoom 9 around Lucerne on a 1920 × 1080 screen, one step further out on smaller windows
const INITIAL_VIEW = {
  north: 47.59,
  south: 45.9,
  east: 10.2,
  west: 6.08,
};

const LEVELS = [
  { id: "national", name: "National", weight: 5, zIndex: 30 },
  { id: "regional", name: "Regional", weight: 4, zIndex: 20 },
  { id: "local", name: "Local", weight: 3, zIndex: 10 },
];

// SchweizMobil rates every route easy, medium or difficult for fitness (category_condition), and hiking and mountain bike routes for difficulty too (category_grade)
const GRADES = { easy: "Easy", medium: "Medium", difficult: "Difficult" };

const ACTIVITIES = [
  {
    id: "hiking",
    name: "Hiking",
    noun: "hiking route",
    color: "#d52b1e",
    ids: {
      national: HIKING_NATIONAL_IDS,
      regional: HIKING_REGIONAL_IDS,
      local: HIKING_LOCAL_IDS,
    },
    // The grade follows the trail type. No hiking route is difficult today, but the chip is shown so both Difficulty rows offer all three grades
    grades: ["easy", "medium", "difficult"],
    trails: { easy: "hiking trail", medium: "mountain hiking trail" },
  },
  // Cycling routes have no difficulty grade, only fitness
  {
    id: "cycling",
    name: "Cycling",
    noun: "cycling route",
    color: "#0b5cad",
    ids: {
      national: CYCLING_NATIONAL_IDS,
      regional: CYCLING_REGIONAL_IDS,
      local: CYCLING_LOCAL_IDS,
    },
  },
  {
    id: "mountainbiking",
    name: "Mountain biking",
    noun: "mountain bike route",
    color: "#0e6b35",
    ids: {
      national: MOUNTAINBIKING_NATIONAL_IDS,
      regional: MOUNTAINBIKING_REGIONAL_IDS,
      local: MOUNTAINBIKING_LOCAL_IDS,
    },
    grades: ["easy", "medium", "difficult"],
  },
];

// The color of an uploaded GPX track, apart from the three route colors
const UPLOAD_COLOR = "#7a2e8e";

// Climbs and drops smaller than this are GPS noise, so ascent and descent ignore them
const ELEVATION_NOISE = 5;

// The elevation chart is drawn one column per pixel of the panel's text width (384 − 1 border − 2 × 22)
const PROFILE = { width: 339, height: 128, top: 8, bottom: 110 };

const GROUP_COLORS = {
  stay: "#22303c",
  explore: "#22303c",
};

// Icons of the panel sections. Routes has none
const SECTION_ICONS = {
  Stay: "bed",
  Explore: "explore",
  Water: "water_drop",
  "Bike support": "pedal_bike",
  "Rest stops": "table_restaurant",
  Nature: "park",
  Favorites: "favorite",
};

const PLACES = [
  {
    id: "camping",
    group: "stay",
    name: "Camping",
    label: "Campsite",
    icon: "camping",
    folder: "accommodation/camping",
    ids: ACCOMMODATION_CAMPING_IDS,
  },
  {
    id: "backpacker",
    group: "stay",
    name: "Backpackers",
    label: "Backpacker hostel",
    icon: "backpack",
    folder: "accommodation/backpacker",
    ids: ACCOMMODATION_BACKPACKER_IDS,
  },
  {
    id: "hostel",
    group: "stay",
    name: "Hostels",
    label: "Hostel",
    icon: "gite",
    folder: "accommodation/hostels",
    ids: ACCOMMODATION_HOSTEL_IDS,
  },
  {
    id: "bnb",
    group: "stay",
    name: "B&Bs",
    label: "B&B",
    icon: "hotel",
    folder: "accommodation/bnb",
    ids: ACCOMMODATION_BNB_IDS,
  },
  {
    id: "grouphouse",
    group: "stay",
    name: "Group houses",
    label: "Group house",
    icon: "house",
    folder: "accommodation/grouphouse",
    ids: ACCOMMODATION_GROUPHOUSE_IDS,
  },
  {
    id: "farm",
    group: "stay",
    name: "Farm stays",
    label: "Farm stay",
    icon: "agriculture",
    folder: "accommodation/farm",
    ids: ACCOMMODATION_FARM_IDS,
  },
  {
    id: "sleepingstraw",
    group: "stay",
    name: "Sleeping in straw",
    label: "Sleeping in straw",
    icon: "bed",
    folder: "accommodation/sleepingstraw",
    ids: ACCOMMODATION_SLEEPINGSTRAW_IDS,
  },
  {
    id: "mountainhut",
    group: "stay",
    name: "Mountain huts",
    label: "Mountain hut",
    icon: "night_shelter",
    folder: "accommodation/mountainhut",
    ids: ACCOMMODATION_MOUNTAINHUT_IDS,
  },
  {
    id: "sightseeing",
    group: "explore",
    name: "Sightseeing",
    label: "Sightseeing",
    icon: "visibility",
    folder: "other/sightseeing",
    ids: OTHER_SIGHTSEEING_IDS,
  },
  {
    id: "serviceshop",
    group: "explore",
    section: "Bike support",
    name: "Bike service",
    label: "Bike service",
    icon: "build",
    folder: "other/serviceshop",
    ids: OTHER_SERVICESHOP_IDS,
  },
  {
    id: "chargingstation",
    group: "explore",
    section: "Bike support",
    name: "E-bike charging",
    label: "E-bike charging station",
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
  osmPlace("stay", "alpinehut", "Alpine huts", "Alpine hut", "cabin"),
  osmPlace(
    "stay",
    "wildernesshut",
    "Wilderness huts",
    "Wilderness hut",
    "cottage",
  ),
  osmPlace("stay", "basichut", "Basic huts", "Basic hut", "fireplace"),
  osmPlace("stay", "hotel", "Hotels", "Hotel", "apartment"),
  osmPlace(
    "stay",
    "guesthouse",
    "Guest houses",
    "Guest house",
    "bedroom_parent",
  ),
  osmPlace("stay", "chalet", "Chalets", "Chalet", "chalet"),
  osmPlace("stay", "campsite", "Campsites", "Campsite", "camping"),
];

// These are listed under Explore, with sightseeing
const OSM_EXPLORE = [osmPlace("explore", "ruins", "Ruins", "Ruins", "fort")];

// The others have a section each. A place from PLACES with the same section name is listed there too
const OSM_SECTIONS = [
  {
    name: "Water",
    places: [
      osmPlace(
        "explore",
        "drinkingwater",
        "Drinking water",
        "Drinking water",
        "water_drop",
      ),
      osmPlace("explore", "spring", "Springs", "Spring", "water"),
      osmPlace(
        "explore",
        "waterpoint",
        "Water points",
        "Water point",
        "faucet",
      ),
    ],
  },
  {
    name: "Bike support",
    places: [
      osmPlace(
        "explore",
        "ebikecharging",
        "E-bike charging points",
        "E-bike charging point",
        "battery_charging_full",
      ),
      osmPlace(
        "explore",
        "bikerepair",
        "Repair stations",
        "Bike repair station",
        "handyman",
      ),
      osmPlace("explore", "airpump", "Air pumps", "Air pump", "air"),
      osmPlace(
        "explore",
        "bikerental",
        "Bike rental",
        "Bike rental",
        "pedal_bike",
      ),
    ],
  },
  {
    name: "Rest stops",
    places: [
      osmPlace("explore", "picnicsite", "Picnic sites", "Picnic site", "park"),
      osmPlace(
        "explore",
        "picnictable",
        "Picnic tables",
        "Picnic table",
        "table_restaurant",
      ),
      osmPlace(
        "explore",
        "firepit",
        "Fire pits",
        "Fire pit",
        "local_fire_department",
      ),
      osmPlace("explore", "toilets", "Toilets", "Toilet", "wc"),
      osmPlace("explore", "shower", "Showers", "Shower", "shower"),
    ],
  },
  {
    name: "Nature",
    places: [
      osmPlace("explore", "waterfall", "Waterfalls", "Waterfall", "waves"),
      osmPlace(
        "explore",
        "mountainpass",
        "Mountain passes",
        "Mountain pass",
        "altitude",
      ),
      osmPlace("explore", "cave", "Caves", "Cave", "explore"),
      osmPlace(
        "explore",
        "swimmingarea",
        "Swimming areas",
        "Swimming area",
        "pool",
      ),
      osmPlace(
        "explore",
        "bathingplace",
        "Bathing places",
        "Bathing place",
        "beach_access",
      ),
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
let glideFrame = undefined;
// While the map shows the view it opened with, the position stays out of the address. Empty when the address gave a position (then it is always kept); undefined until the map first settles
let openingPosition = ADDRESS_POSITION ? "" : undefined;

const activeLayers = new Set();
const files = new Map();
const requests = new Map();
const downloadQueue = [];
// What is on the map right now: a place item or a bubble key, mapped to its marker
const drawn = new Map();

function mapLoaded() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: ADDRESS_POSITION?.center ?? {
      lat: 46.75,
      lng: 8.1,
    },
    zoom: ADDRESS_POSITION?.zoom ?? 8,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "roadmap",
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

function osmPlace(group, id, name, label, icon) {
  return {
    id: id,
    group: group,
    name: name,
    label: label,
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

// Panel

function buildPanel() {
  const [hiking, cycling, mountainBiking] = ACTIVITIES;

  let content = group(
    "Routes",
    byCount([mountainBiking, hiking, cycling]).map(activityRow).join(""),
    false,
  );
  content += group(
    "Stay",
    byCount([...PLACES.filter((place) => place.group === "stay"), ...OSM_STAY])
      .map(placeRow)
      .join(""),
  );
  content += group(
    "Explore",
    byCount([
      ...PLACES.filter((place) => place.group === "explore" && !place.section),
      ...OSM_EXPLORE,
    ])
      .map(placeRow)
      .join(""),
  );

  for (const section of OSM_SECTIONS) {
    const places = [
      ...PLACES.filter((place) => place.section === section.name),
      ...section.places,
    ];
    content += group(section.name, byCount(places).map(placeRow).join(""));
  }

  if (FAVORITES_ENABLED) {
    const favorites =
      toggleRow(
        "favorites.hiking",
        "Hikes",
        '<span class="swatch swatch-line"></span>',
        hiking.color,
      ) +
      toggleRow(
        "favorites.visit",
        "Places",
        iconSwatch("visibility"),
        GROUP_COLORS.explore,
      );
    content += group("Favorites", favorites);
  }

  const layers = document.getElementById("layers");
  layers.innerHTML = content;

  for (const button of layers.querySelectorAll("[data-layer]")) {
    button.addEventListener("click", () => toggleLayer(button));
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

  updateCounts({});
}

// Rows with more places come first
function byCount(items) {
  return [...items].sort((a, b) => rowTotal(b.id) - rowTotal(a.id));
}

// Routes stays open. Every other group starts collapsed
function group(name, rows, collapsible = true) {
  const icon = SECTION_ICONS[name]
    ? `<span class="material-symbols-outlined" aria-hidden="true">${SECTION_ICONS[name]}</span>`
    : "";
  const badge = '<span class="badge" hidden></span>';

  if (!collapsible) {
    return `<section class="group"><h2>${icon}${name}${badge}</h2>${rows}</section>`;
  }

  return `<details class="group"><summary><h2>${icon}${name}${badge}</h2><span class="material-symbols-outlined">chevron_right</span></summary>${rows}</details>`;
}

function activityRow(activity) {
  const chips = LEVELS.map(
    (level) =>
      `<button type="button" class="chip" data-layer="${activity.id}.${level.id}" aria-pressed="false">${level.name}<span class="chip-count">${activity.ids[level.id].length}</span></button>`,
  ).join("");

  let content = `<div class="row" style="--color:${activity.color}">`;
  content += `<div class="row-head"><span class="swatch swatch-line"></span><span class="row-name">${activity.name}</span><span class="row-count" data-count="${activity.id}"></span></div>`;
  content += `<div class="chips" role="group" aria-label="${activity.name} routes">${chips}</div>`;
  content += `<div class="filters" data-filters="${activity.id}" hidden>`;
  content += rangeFilter(`filter-${activity.id}-length`, "Length", "km");
  content += rangeFilter(`filter-${activity.id}-climb`, "Ascent", "m");

  if (activity.grades) {
    content += gradeFilter(activity, "grade", "Difficulty", activity.grades);
  }

  content += gradeFilter(activity, "fitness", "Fitness", Object.keys(GRADES));
  content += "</div></div>";

  return content;
}

function placeRow(place) {
  return toggleRow(
    place.id,
    place.name,
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
  content += `<input type="number" min="0" id="${id}Min" placeholder="Min" aria-label="${label} minimum in ${unit}">`;
  content += '<span class="range-dash">–</span>';
  content += `<input type="number" min="0" id="${id}Max" placeholder="Max" aria-label="${label} maximum in ${unit}">`;
  content += `<span>${unit}</span></div>`;

  return content;
}

// No data-layer attribute, so these chips filter routes instead of turning a layer on
function gradeFilter(activity, name, label, grades) {
  const chips = grades
    .map(
      (grade) =>
        `<button type="button" class="chip" data-grade-filter="${activity.id}-${name}" data-grade="${grade}" aria-pressed="false">${GRADES[grade]}</button>`,
    )
    .join("");

  return `<div class="range"><span>${label}</span><div class="range-chips" role="group" aria-label="${activity.name} ${label.toLowerCase()}">${chips}</div></div>`;
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

// Each section title shows how many of its rows are on. A route row counts once, however many levels are on, and its filter chips don't count
function updateBadges() {
  for (const section of document.querySelectorAll(".group")) {
    const selected = section.querySelectorAll(
      '.toggle[aria-pressed="true"], .row:has(.chip[data-layer][aria-pressed="true"])',
    ).length;
    const badge = section.querySelector(".badge");

    badge.textContent = selected;
    badge.hidden = !selected;
  }
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
      const shown = count.shown.toLocaleString();
      element.textContent =
        count.shown < count.total
          ? `${shown} of ${count.total.toLocaleString()}`
          : shown;
      element.classList.add("active");
    } else {
      element.textContent = rowTotal(element.dataset.count).toLocaleString();
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
    setStatus("Loading map data");
  } else {
    bar.style.width = "100%";
    progress.setAttribute("aria-valuenow", 100);
    progress.classList.remove("loading");
    progressTotal = 0;
    progressDone = 0;
    setStatus("Map data loaded");
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

  const item = {
    url: url,
    json: json,
    kind: "route",
    type: activity.id,
    activity: activity,
    level: level,
    label: `${properties.r_number} ${properties.title}`,
    color: activity.color,
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
    plate(properties.r_number, activity.color),
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
    label: json.properties.title ? json.properties.title : json.properties.name,
    position: position,
    bounds: around(position, 0.1),
    gallery: getGallery(json),
  };

  return [item];
}

function buildChargingStations(url, json, place) {
  const items = [];

  json.forEach((entry, index) => {
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

      const item = {
        url: `${url}#${index}`,
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
  return json.map((entry, index) => {
    const position = point(entry.coordinates[0], entry.coordinates[1]);

    const item = {
      url: `${url}#${index}`,
      json: entry,
      kind: "osm",
      place: place,
      label: entry.name ?? place.label,
      position: position,
      bounds: around(position, 0.1),
      gallery: [],
    };

    return item;
  });
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
    title: `${count} places, click to zoom in`,
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
      strokeColor: "#ffffff",
      strokeOpacity: opacity,
      strokeWeight: weight + 4,
      zIndex: zIndex - 1,
    });
    casing.setMap(cased ? map : null);
  }
}

function lineStyle(item, weight, opacity, zIndex) {
  return {
    strokeColor: item.color,
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
    // The name of an uploaded file is the user's own, so it is not sent
    content_id: item.kind === "upload" ? "upload" : item.label,
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
  let content =
    '<button type="button" class="details-close" data-action="close" aria-label="Close details"><span class="material-symbols-outlined">close</span></button>';
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
    ? `<img class="details-logo" src="${escapeHtml(properties.logo)}" alt="Route ${properties.r_number}">`
    : plateBadge(item);

  let content = `<div class="details-kind">${badge}${item.level.name} ${item.activity.noun}</div>`;
  content += `<h2 class="details-title">${escapeHtml(properties.title)}</h2>`;

  if (properties.start && properties.end) {
    content += `<p class="details-subtitle">${escapeHtml(routeEnds(properties))}</p>`;
  }

  content += actions([
    shareAction(),
    '<button type="button" class="action" data-action="download"><span class="material-symbols-outlined">download</span>Download GPX</button>',
    externalAction(
      `https://www.schweizmobil.ch/en/${item.type}-in-switzerland/route-${properties.r_number}`,
      "SchweizMobil",
    ),
  ]);

  let stats = stat("Distance", item.length, "km");
  stats += stat("Ascent", properties.height_difference.toLocaleString(), "m");
  stats += stat(
    "Descent",
    properties.height_difference_back.toLocaleString(),
    "m",
  );

  if (typeof properties.hiking_time === "number") {
    stats += stat("Hiking time", duration(properties.hiking_time), "");
  }

  if (typeof properties.length_asphalt === "number") {
    stats += stat(
      "Asphalt",
      parseInt((properties.length_asphalt * 100) / item.length),
      "%",
    );
  }

  content += `<dl class="stats">${stats}</dl>`;

  let facts = "";

  if (GRADES[item.grade]) {
    const trail = item.activity.trails?.[item.grade];
    facts += fact(
      "Difficulty",
      trail ? `${GRADES[item.grade]} · ${trail}` : GRADES[item.grade],
    );
  }

  if (GRADES[item.fitness]) {
    facts += fact("Fitness", GRADES[item.fitness]);
  }

  // Compared as text, so float noise in the hours doesn't count as a difference
  if (
    typeof properties.hiking_time_back === "number" &&
    duration(properties.hiking_time_back) !== duration(properties.hiking_time)
  ) {
    facts += fact("Other direction", duration(properties.hiking_time_back));
  }

  if (facts) {
    content += `<dl class="facts">${facts}</dl>`;
  }

  // Worked out on selection, not in buildRoute, which runs for thousands of routes
  item.profile ??= routeProfile(item);
  content += profileSection(item);

  if (properties.abstract) {
    content += `<p class="details-lead">${properties.abstract}</p>`;
  }

  if (properties.description) {
    content += `<div class="details-description">${properties.description}</div>`;
  }

  return content;
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

  let content = `<div class="details-kind" style="--color:${GROUP_COLORS[item.place.group]}">${iconSwatch(item.place.icon)}${item.place.label}</div>`;
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

  content += actions([shareAction(), external]);

  if (properties.abstract) {
    content += `<p class="details-lead">${properties.abstract}</p>`;
  }

  if (properties.description) {
    content += `<div class="details-description">${properties.description}</div>`;
  }

  const contact = [];

  if (isBasic) {
    contact.push(
      contactLine(
        "location_on",
        `<a href="https://www.google.com/maps/place/${item.position.lat},${item.position.lng}" target="_blank" rel="noopener noreferrer">Show on Google Maps</a>`,
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
      properties.url_sightseeing,
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
  let content = `<div class="details-kind" style="--color:${GROUP_COLORS[item.place.group]}">${iconSwatch(item.place.icon)}${item.place.label}</div>`;
  content += `<h2 class="details-title">${item.label}</h2>`;
  content += actions([
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

  let content = `<div class="details-kind" style="--color:${GROUP_COLORS[item.place.group]}">${iconSwatch(item.place.icon)}${item.place.label}</div>`;
  content += `<h2 class="details-title">${escapeHtml(item.label)}</h2>`;

  content += actions([
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
    stats += stat("Elevation", Math.round(elevation).toLocaleString(), "m");
  }

  if (Number.isFinite(capacity)) {
    stats += stat("Capacity", capacity.toLocaleString(), "");
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
      contactLine("info", `Operated by ${escapeHtml(tags.operator)}`),
    );
  }

  if (tags.fee) {
    contact.push(contactLine("info", `Fee: ${escapeHtml(tags.fee)}`));
  }

  if (tags.access) {
    contact.push(contactLine("info", `Access: ${escapeHtml(tags.access)}`));
  }

  if (contact.length > 0) {
    content += `<ul class="contact">${contact.join("")}</ul>`;
  }

  return content;
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
  return '<button type="button" class="action" data-action="share"><span class="material-symbols-outlined">link</span><span class="action-label">Copy link</span></button>';
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
  const ends = start === end ? `Loop from ${start}` : `${start} to ${end}`;

  return properties.via ? `${ends} via ${properties.via.trim()}` : ends;
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
    content +=
      '<button type="button" class="media-button previous" data-action="previous" aria-label="Previous photo"><span class="material-symbols-outlined">chevron_left</span></button>';
    content +=
      '<button type="button" class="media-button next" data-action="next" aria-label="Next photo"><span class="material-symbols-outlined">chevron_right</span></button>';
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
        item_id: item.label,
      });

      label.textContent = "Link copied";
      icon.textContent = "check";

      setTimeout(() => {
        label.textContent = "Copy link";
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
    const key = `${i}|${count}|${shown}`;

    if (photo.key !== key) {
      photo.key = key;
      // A label for screen readers only: Google turns a title into a browser tooltip as well
      marker.setAttribute(
        "aria-label",
        `Photo ${i + 1} of ${count}${shown ? ", on show" : ""}`,
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
  setStatus(`Photo ${index + 1} of ${selected.gallery.length}`);
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
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function profileSection(item) {
  const profile = item.profile;

  if (!profile) {
    return "";
  }

  const min = Math.round(profile.min).toLocaleString();
  const max = Math.round(profile.max).toLocaleString();
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
  content += `<div class="profile-head"><span>Elevation</span><span class="profile-readout" id="profileReadout" data-default="${min}–${max} m">${min}–${max} m</span></div>`;
  content += `<svg class="profile-chart" viewBox="0 0 ${PROFILE.width} ${PROFILE.height}" role="img" aria-label="Elevation profile, ${min} to ${max} m over ${length} km">`;
  content += `<line class="profile-grid" x1="0" y1="${PROFILE.top}" x2="${PROFILE.width}" y2="${PROFILE.top}"/>`;
  content += `<line class="profile-grid" x1="0" y1="${PROFILE.bottom}" x2="${PROFILE.width}" y2="${PROFILE.bottom}"/>`;
  content += `<path class="profile-area" d="${area}"/>`;
  content += `<path class="profile-line" d="${line}"/>`;
  // Inside the chart, so neither height is cut off at its edge
  content += `<text class="profile-label" x="0" y="${PROFILE.top + 12}">${profile.high.toLocaleString()} m</text>`;
  content += `<text class="profile-label" x="0" y="${PROFILE.bottom - 4}">${profile.low.toLocaleString()} m</text>`;
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
    `${profileKilometers(nearest.distance)} km · ${Math.round(nearest.height).toLocaleString()} m`;

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

  document.getElementById("menuToggle").addEventListener("click", () => {
    if (menuOpen()) {
      closeMenu();
    } else {
      openMenu();
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
    if (event.key === "Escape") {
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

  menu.querySelector(".menu-item:not([hidden])").focus();
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
    showUploadError(parsed);
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

// Returns the track, or the message to show when the file has none
function parseGpx(text, filename) {
  const xml = new DOMParser().parseFromString(text, "application/xml");

  if (
    xml.querySelector("parsererror") ||
    xml.documentElement.localName !== "gpx"
  ) {
    return "This is not a GPX file. Choose a .gpx file from a GPS app or route planner.";
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
    return "This GPX file has no track or route with at least two points.";
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
    color: UPLOAD_COLOR,
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

  // The white outline keeps the track readable on top of the routes
  for (const path of item.paths) {
    item.casings.push(
      new google.maps.Polyline({
        path: path,
        strokeColor: "#ffffff",
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
    marker.title = `${name === "start" ? "Start" : "End"} of ${item.label}`;
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
  let content = `<div class="details-kind"><span class="swatch swatch-line" style="--color:${item.color}"></span>Your GPX track</div>`;
  content += `<h2 class="details-title">${escapeHtml(item.label)}</h2>`;
  content += actions([
    '<button type="button" class="action" data-action="remove-upload"><span class="material-symbols-outlined">delete</span>Remove</button>',
  ]);

  let stats = stat(
    "Distance",
    item.length.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    "km",
  );

  if (item.ascent !== undefined) {
    stats += stat("Ascent", item.ascent.toLocaleString(), "m");
    stats += stat("Descent", item.descent.toLocaleString(), "m");
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

  // Commas and slashes mean nothing in a query, so they stay readable
  const search = params.toString().replace(/%2C/g, ",").replace(/%2F/g, "/");
  const address = search ? `${location.pathname}?${search}` : location.pathname;

  if (address !== location.pathname + location.search) {
    history.replaceState(history.state, "", address + location.hash);
  }
}

// Analytics

// Set by the Firebase snippet in index.html, and missing when analytics is blocked
function track(name, params) {
  window.trackEvent?.(name, params);
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
  track("gpx_download", { item_id: selected.label });

  const data = gpxData(selected.json);
  const filename = `${selected.json.properties.r_number} - ${selected.json.properties.title}.gpx`;
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
    `${json.properties.r_number} - ${json.properties.title}`,
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
