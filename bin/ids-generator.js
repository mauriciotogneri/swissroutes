const fs = require('fs')

const IDS = {
  // mountainbiking
  MOUNTAINBIKING_NATIONAL_IDS: 'mountainbiking/national',
  MOUNTAINBIKING_REGIONAL_IDS: 'mountainbiking/regional',
  MOUNTAINBIKING_LOCAL_IDS: 'mountainbiking/local',

  // cycling
  CYCLING_NATIONAL_IDS: 'cycling/national',
  CYCLING_REGIONAL_IDS: 'cycling/regional',
  CYCLING_LOCAL_IDS: 'cycling/local',

  // hiking
  HIKING_NATIONAL_IDS: 'hiking/national',
  HIKING_REGIONAL_IDS: 'hiking/regional',
  HIKING_LOCAL_IDS: 'hiking/local',

  // accommodation
  ACCOMMODATION_BACKPACKER_IDS: 'accommodation/backpacker',
  ACCOMMODATION_CAMPING_IDS: 'accommodation/camping',
  ACCOMMODATION_FARM_IDS: 'accommodation/farm',
  ACCOMMODATION_MOUNTAINHUT_IDS: 'accommodation/mountainhut',
  ACCOMMODATION_SLEEPINGSTRAW_IDS: 'accommodation/sleepingstraw',
  ACCOMMODATION_HOSTEL_IDS: 'accommodation/hostels',
  ACCOMMODATION_BNB_IDS: 'accommodation/bnb',
  ACCOMMODATION_GROUPHOUSE_IDS: 'accommodation/grouphouse',

  // other
  OTHER_SERVICESHOP_IDS: 'other/serviceshop',
  OTHER_SIGHTSEEING_IDS: 'other/sightseeing',

  // favorites
  FAVORITES_HIKING_IDS: 'favorites/hiking',
  FAVORITES_VISIT_IDS: 'favorites/visit',
}

// OpenStreetMap places: one file per type in public/data/osm/, with no id list
const OSM_TYPES = [
  'drinkingwater', 'spring',
  'alpinehut', 'wildernesshut', 'basichut', 'hotel', 'guesthouse', 'chalet', 'campsite',
  'ruins',
  'ebikecharging', 'bikerepair', 'airpump', 'bikerental',
  'picnicsite', 'picnictable', 'firepit', 'toilets',
  'waterfall', 'mountainpass', 'cave', 'swimmingarea', 'bathingplace', 'hotspring',
  'dumpstation', 'waterpoint', 'shower',
]

// The charging stations files cover other countries too: the site shows only the stations inside this box
const CHARGING_BOUNDS = { north: 47.858446, south: 46.128503, east: 10.583217, west: 5.923137 }
const CHARGING_FILES = [
  'other/chargingstations/chargingstations.json',
  'other/chargingstations/ebike-sockets.json',
]

// Counts of the rows that have no id list, so the panel can show them before their files load
function getPlaceCounts() {
  const counts = {}

  // A downloaded type missing from OSM_TYPES would show a wrong count in the panel
  const unlisted = fs.readdirSync('public/data/osm').map((file) => file.replace(/\.json$/, '')).filter((type) => !OSM_TYPES.includes(type))

  if (unlisted.length > 0) {
    throw new Error(`public/data/osm has files that OSM_TYPES lacks: ${unlisted.join(', ')}`)
  }

  for (const type of OSM_TYPES) {
    counts[type] = JSON.parse(fs.readFileSync(`public/data/osm/${type}.json`, 'utf-8')).length
  }

  counts.chargingstation = 0

  for (const file of CHARGING_FILES) {
    for (const entry of JSON.parse(fs.readFileSync(`public/data/${file}`, 'utf-8'))) {
      const coordinates = entry.Point.coordinates.split(',')
      const latitude = parseFloat(coordinates[1])
      const longitude = parseFloat(coordinates[0])

      if ((latitude >= CHARGING_BOUNDS.south) && (latitude <= CHARGING_BOUNDS.north) && (longitude >= CHARGING_BOUNDS.west) && (longitude <= CHARGING_BOUNDS.east)) {
        counts.chargingstation++
      }
    }
  }

  return counts
}

function run() {
  let content = ''

  for (const [name, path] of Object.entries(IDS)) {
    const ids = [...new Set(JSON.parse(fs.readFileSync(`ids/${path}.json`, 'utf-8')))]
    content += `const ${name} = ${JSON.stringify(ids)}\n`
  }

  content += `const CHARGING_BOUNDS = ${JSON.stringify(CHARGING_BOUNDS)}\n`
  content += `const PLACE_COUNTS = ${JSON.stringify(getPlaceCounts())}\n`

  fs.writeFileSync('public/ids.js', content, 'utf-8')
}

run()
