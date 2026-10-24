const fs = require('fs')
const helpers = require('./helpers.js')

// The Swiss OSM community's server. The main one, overpass-api.de, refused connections from the author's network
const OVERPASS_URL = 'https://overpass.osm.ch/api/interpreter'

// OSM points closer than this to a place we already have, of the same kind, are dropped
const DUPLICATE_METERS = 100

// Pause between queries, to stay within the Overpass usage limits
const PAUSE_MS = 5000

// Tags copied from OSM into the data files
const TAGS = ['opening_hours', 'fee', 'access', 'capacity', 'operator', 'ele', 'description']

// id: file name in public/data/osm/ and layer id in script.js
// query: the Overpass filter
// near: data folders with places of the same kind, used to drop duplicates
const LAYERS = [
  { id: 'drinkingwater', query: 'nwr[amenity=drinking_water]' },
  { id: 'spring', query: 'nwr[natural=spring][drinking_water=yes]' },

  { id: 'alpinehut', query: 'nwr[tourism=alpine_hut]', near: ['accommodation/mountainhut'] },
  { id: 'wildernesshut', query: 'nwr[tourism=wilderness_hut]', near: ['accommodation/mountainhut'] },
  { id: 'basichut', query: 'nwr[amenity=shelter][shelter_type=basic_hut]', near: ['accommodation/mountainhut'] },

  { id: 'bikerepair', query: 'nwr[amenity=bicycle_repair_station]', near: ['other/serviceshop'] },
  { id: 'airpump', query: 'nwr[amenity=compressed_air]', near: ['other/serviceshop'] },
  { id: 'bikerental', query: 'nwr[amenity=bicycle_rental]', near: ['other/serviceshop'] },
  { id: 'ebikecharging', query: 'nwr[amenity=charging_station][bicycle=yes]', near: ['other/chargingstations'] },

  { id: 'picnicsite', query: 'nwr[tourism=picnic_site]' },
  { id: 'picnictable', query: 'nwr[leisure=picnic_table]' },
  { id: 'firepit', query: 'nwr[leisure=firepit]' },
  { id: 'toilets', query: 'nwr[amenity=toilets][fee!=yes][access!~"^(customers|private|no)$"]' },

  { id: 'waterfall', query: 'nwr[waterway=waterfall]' },
  { id: 'mountainpass', query: 'nwr[mountain_pass=yes]' },
  { id: 'cave', query: 'nwr[natural=cave_entrance]' },
  { id: 'swimmingarea', query: 'nwr[leisure=swimming_area]' },
  { id: 'bathingplace', query: 'nwr[leisure=bathing_place]' },

  { id: 'ruins', query: 'nwr[historic=ruins]' },

  { id: 'waterpoint', query: 'nwr[amenity=water_point]' },
  { id: 'shower', query: 'nwr[amenity=shower]' },

  { id: 'hotel', query: 'nwr[tourism=hotel]' },
  { id: 'guesthouse', query: 'nwr[tourism=guest_house]', near: ['accommodation/bnb'] },
  { id: 'chalet', query: 'nwr[tourism=chalet]' },
  { id: 'campsite', query: 'nwr[tourism=camp_site][tents!=no]', near: ['accommodation/camping'] },
]

async function run() {
  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i]
    console.log(`${layer.id.toUpperCase()} (${parseInt((i / LAYERS.length) * 100)}%)`)

    const entries = (await getEntries(layer)).filter(notNearby(layer))

    if (entries.length === 0) {
      throw new Error(`NO ENTRIES FOUND: ${layer.id}`)
    }

    helpers.writeFile(`public/data/osm/${layer.id}.json`, entries)
    console.log(`${layer.id}: ${entries.length}`)

    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
  }
}

async function getEntries(layer) {
  const query = `[out:json][timeout:180];area["ISO3166-1"="CH"]->.a;(${layer.query}(area.a););out center tags;`
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`
  const json = await helpers.getFile(url)

  // Overpass answers a query that ran out of time or memory with status 200 and a partial result
  if (json.remark) {
    throw new Error(`OVERPASS REMARK: ${layer.id}: ${json.remark}`)
  }

  const entries = []

  for (const element of json.elements) {
    // Nodes carry their position, ways and relations carry their center
    const lat = element.lat ?? element.center?.lat
    const lng = element.lon ?? element.center?.lon

    if (lat !== undefined && lng !== undefined) {
      entries.push(toEntry(element, lat, lng))
    }
  }

  return entries.sort((a, b) => a.id.localeCompare(b.id))
}

function toEntry(element, lat, lng) {
  const tags = element.tags ?? {}
  const entry = { id: `${element.type}/${element.id}`, coordinates: [lat, lng], tags: {} }

  if (tags.name?.trim()) {
    entry.name = tags.name.trim()
  }

  for (const key of TAGS) {
    if (tags[key]?.trim()) {
      entry.tags[key] = tags[key].trim()
    }
  }

  const website = getWebsite(tags.website ?? tags['contact:website'])
  const phone = (tags.phone ?? tags['contact:phone'])?.split(';')[0].trim()

  if (website) {
    entry.tags.website = website
  }

  if (phone) {
    entry.tags.phone = phone
  }

  return entry
}

// The details panel links to this address, so anything that isn't a web address is dropped
function getWebsite(value) {
  const url = value?.split(';')[0].trim()

  if (!url || /\s/.test(url)) {
    return undefined
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  return url.includes('.') && !url.includes(':') ? `https://${url}` : undefined
}

function notNearby(layer) {
  const existing = (layer.near ?? []).flatMap(readPositions)

  return (entry) => !existing.some((position) => distance(entry.coordinates, position) < DUPLICATE_METERS)
}

// Positions of every place in a data folder, as [lat, lng]
function readPositions(folder) {
  const positions = []

  // Files of places that disappeared stay on disk until cleanup.js runs, so a folder with an id list is read through it
  const list = `ids/${folder}.json`
  const files = fs.existsSync(list)
    ? JSON.parse(fs.readFileSync(list, 'utf-8')).map((id) => `${id}.json`)
    : fs.readdirSync(`public/data/${folder}`)

  for (const file of files) {
    const path = `public/data/${folder}/${file}`

    // An id can be on the list without a file (a place the download skipped)
    if (!fs.existsSync(path)) {
      continue
    }

    const json = JSON.parse(fs.readFileSync(path, 'utf-8'))

    if (Array.isArray(json)) {
      // Charging stations, as exported from Google My Maps: "lng,lat,altitude"
      for (const entry of json) {
        const [lng, lat] = entry.Point.coordinates.split(',')
        positions.push([parseFloat(lat), parseFloat(lng)])
      }
    } else {
      positions.push(json.geometry.coordinates)
    }
  }

  return positions
}

// Meters between two [lat, lng] points, good enough for a few hundred meters
function distance(a, b) {
  const metersPerDegree = 111320
  const dLat = (a[0] - b[0]) * metersPerDegree
  const dLng = (a[1] - b[1]) * metersPerDegree * Math.cos(a[0] * Math.PI / 180)

  return Math.sqrt(dLat * dLat + dLng * dLng)
}

run().catch(console.error)
