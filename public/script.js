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
  },
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
  },
];

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

let map = undefined;
let pointIndex = undefined;
let pointIndexVersion = 0;
let pointItems = [];
let selected = undefined;
let sharedItem = undefined;
let galleryIndex = 0;
let focusReturn = undefined;
let progressTotal = 0;
let progressDone = 0;
let renderPending = false;
let loadingRenderTimeout = undefined;
let filterTimeout = undefined;
let downloadsActive = 0;

const activeLayers = new Set();
const files = new Map();
const requests = new Map();
const downloadQueue = [];
// What is on the map right now: a place item or a bubble key, mapped to its marker
const drawn = new Map();

function mapLoaded() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 46.75,
      lng: 8.1,
    },
    zoom: 8,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "roadmap",
    disableDefaultUI: true,
    clickableIcons: false,
  });

  map.fitBounds(INITIAL_VIEW, 0);
  map.addListener("click", closeDetails);
  map.addListener("idle", drawPins);

  buildPanel();
  bindControls();

  if (PARAM_URL && PARAM_TYPE) {
    openSharedItem(PARAM_TYPE, PARAM_URL);
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

  updateCounts({});
}

// Rows with more places come first
function byCount(items) {
  return [...items].sort((a, b) => rowTotal(b.id) - rowTotal(a.id));
}

// Routes stay open. Every other group starts collapsed
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

function toggleLayer(button) {
  const id = button.dataset.layer;
  const active = !activeLayers.has(id);

  button.setAttribute("aria-pressed", active);

  if (active) {
    activeLayers.add(id);
    track("layer_toggle", { layer: id });

    const layer = LAYERS[id];

    for (const url of layer.urls) {
      loadFile(url, layer.build);
    }
  } else {
    activeLayers.delete(id);
  }

  sharedItem = undefined;
  updateBadges();

  for (const filters of document.querySelectorAll("[data-filters]")) {
    filters.hidden = ![...activeLayers].some(
      (layer) => LAYERS[layer].filter === filters.dataset.filters,
    );
  }

  scheduleRender();
}

// Each section title shows how many of its rows are on. A route row counts once, however many levels are on
function updateBadges() {
  for (const section of document.querySelectorAll(".group")) {
    const selected = section.querySelectorAll(
      '.toggle[aria-pressed="true"], .row:has(.chip[aria-pressed="true"])',
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
}

function readFilters() {
  const filters = {};

  for (const activity of ACTIVITIES) {
    filters[activity.id] = {
      lengthMin: readInt(`filter-${activity.id}-lengthMin`),
      lengthMax: readInt(`filter-${activity.id}-lengthMax`),
      climbMin: readInt(`filter-${activity.id}-climbMin`),
      climbMax: readInt(`filter-${activity.id}-climbMax`),
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
    inRange(item.climb, filter.climbMin, filter.climbMax)
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
    paths: paths,
    bounds: getBounds(paths.flat()),
    gallery: getGallery(json),
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
  tooltip.style.left = `${event.domEvent.clientX + 14}px`;
  tooltip.style.top = `${event.domEvent.clientY + 14}px`;
}

// Details

function selectItem(item, source = "map") {
  // Remember where the keyboard was, so closing the panel can put it back
  if (!selected) {
    focusReturn = document.activeElement;
  }

  selected = item;
  galleryIndex = 0;

  track("select_content", {
    content_type: contentType(item),
    content_id: item.label,
    source: source,
  });

  const details = document.getElementById("details");
  details.innerHTML = detailsContent(item);
  details.classList.add("open");
  details.inert = false;
  document.body.classList.add("has-details");
  details.querySelector(".details-close").focus();

  render();
}

function closeDetails() {
  if (!selected) {
    return;
  }

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
}

function openSharedItem(type, url) {
  const build = sharedItemBuilder(type, url);

  if (build) {
    loadFile(url, build).then((items) => {
      if (items.length > 0) {
        sharedItem = items[0];
        selectItem(items[0], "shared_link");
        map.fitBounds(items[0].bounds, mapPadding());
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
  } else {
    content += chargingStationDetails(item);
  }

  return content + "</div></div>";
}

function routeDetails(item) {
  const properties = item.json.properties;
  const logo = safeUrl(properties.logo);
  const badge = logo
    ? `<img class="details-logo" src="${escapeHtml(logo)}" alt="Route ${properties.r_number}">`
    : `<span class="plate" style="--color:${item.color}">${properties.r_number}</span>`;

  let content = `<div class="details-kind">${badge}${item.level.name} ${item.activity.noun}</div>`;
  content += `<h2 class="details-title">${escapeHtml(properties.title)}</h2>`;

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

  if (typeof properties.length_asphalt === "number") {
    stats += stat(
      "Asphalt",
      parseInt((properties.length_asphalt * 100) / item.length),
      "%",
    );
  }

  content += `<dl class="stats">${stats}</dl>`;

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
      `https://www.google.com/maps/search/${encodeURIComponent(`${item.label} ${properties.city}`)}`,
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

function contactLine(icon, content) {
  return `<li><span class="material-symbols-outlined">${icon}</span><span>${content}</span></li>`;
}

function gallerySection(item) {
  const gallery = item.gallery;

  if (gallery.length === 0) {
    return "";
  }

  let content = `<div class="details-media"><img id="galleryImage" src="${escapeHtml(gallery[0])}" alt="${escapeHtml(item.label)}">`;

  if (gallery.length > 1) {
    content +=
      '<button type="button" class="media-button previous" data-action="previous" aria-label="Previous photo"><span class="material-symbols-outlined">chevron_left</span></button>';
    content +=
      '<button type="button" class="media-button next" data-action="next" aria-label="Next photo"><span class="material-symbols-outlined">chevron_right</span></button>';
    content += `<span class="media-counter" id="galleryIndex">1 / ${gallery.length}</span>`;
  }

  return content + "</div>";
}

function plusSlides(offset) {
  const gallery = selected.gallery;
  galleryIndex = (galleryIndex + offset + gallery.length) % gallery.length;

  document.getElementById("galleryImage").src = gallery[galleryIndex];
  document.getElementById("galleryIndex").textContent =
    `${galleryIndex + 1} / ${gallery.length}`;
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

function getGallery(json) {
  const photoGalleryBig = filterEmptyImages(json.properties.photo_gallery_big);
  const photoGalleryMaster = filterEmptyImages(
    json.properties.photo_gallery_master,
  );
  const photoGallery = filterEmptyImages(json.properties.photo_gallery);
  const photoGallerySmall = filterEmptyImages(
    json.properties.photo_gallery_small,
  );
  const foto = json.properties.foto ? [json.properties.foto] : [];

  const candidates = [
    photoGalleryBig,
    photoGalleryMaster,
    photoGallery,
    photoGallerySmall,
    foto,
  ];

  const lengths = [
    photoGalleryBig.length,
    photoGalleryMaster.length,
    photoGallery.length,
    photoGallerySmall.length,
    foto.length,
  ];

  const maxLength = Math.max(...lengths);

  if (maxLength > 0) {
    return candidates.filter((e) => e.length === maxLength)[0];
  } else {
    return [];
  }
}

function filterEmptyImages(list) {
  const result = [];

  if (list) {
    for (const element of list) {
      if (element && element.trim().length > 0) {
        result.push(element.trim());
      }
    }
  }

  return result;
}

// Controls

function bindControls() {
  document
    .getElementById("zoomIn")
    .addEventListener("click", () => map.setZoom(map.getZoom() + 1));
  document
    .getElementById("zoomOut")
    .addEventListener("click", () => map.setZoom(map.getZoom() - 1));

  const mapTypes = document.querySelectorAll("[data-map-type]");

  for (const button of mapTypes) {
    button.addEventListener("click", () => {
      map.setMapTypeId(button.dataset.mapType);

      for (const other of mapTypes) {
        other.setAttribute("aria-pressed", other === button);
      }
    });
  }

  document.getElementById("details").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const action = button?.dataset.action;

    if (action === "close") {
      closeDetails();
    } else if (action === "share") {
      copyLink(button);
    } else if (action === "download") {
      download();
    } else if (action === "previous") {
      plusSlides(-1);
    } else if (action === "next") {
      plusSlides(1);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideTooltip();
      closeDetails();
    }
  });
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

// Analytics

// Set by the Firebase snippet in index.html, and missing when analytics is blocked
function track(name, params) {
  window.trackEvent?.(name, params);
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
  const name = `${json.properties.r_number} - ${json.properties.title}`;
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

      xml += `\t\t\t<trkpt lat='${lat}' lon='${lon}'></trkpt>\n`;
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
