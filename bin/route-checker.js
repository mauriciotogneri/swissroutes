const fs = require('fs')
const { DatabaseSync } = require('node:sqlite')

// The official route networks of the Federal Roads Office (ASTRA), the source of the SchweizMobil routes
const BASE_URL = 'https://data.geo.admin.ch'

// name: federal layer id and file name
// folder: where the route files of that layer are saved in public/data/
const LAYERS = [
  { name: 'wanderland', folder: 'hiking' },
  { name: 'veloland', folder: 'cycling' },
  { name: 'mountainbikeland', folder: 'mountainbiking' },
]

// The route sizes the downloaders save. The federal files also hold wheelchair routes ('handicap')
const AREAS = ['national', 'regional', 'local']

// Federal column: field of the saved route
const FIELDS = {
  LVRoute_ID: 'id',
  LaengeR: 'length',
  HoeheAufR: 'height_difference',
  HoeheAbR: 'height_difference_back',
}

async function run() {
  fs.mkdirSync('logs', { recursive: true })

  for (const layer of LAYERS) {
    console.log(`${layer.name.toUpperCase()}`)

    const filePath = await download(layer.name)
    const federal = readFederalRoutes(filePath)
    const saved = readSavedRoutes(layer.folder)

    compare(federal, saved)
  }
}

async function download(name, attempts = 3) {
  const url = `${BASE_URL}/ch.astra.${name}/${name}/${name}_2056.gpkg`
  const filePath = `logs/${name}_2056.gpkg`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()))

    return filePath
  } catch (e) {
    if (attempts <= 1) {
      throw e
    }

    console.log(`Retrying: ${url}\n${e.toString()}`)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return download(name, attempts - 1)
  }
}

// Federal routes by `<area>/<number>`. Cycling and mountain biking list a route once per direction
function readFederalRoutes(filePath) {
  const database = new DatabaseSync(filePath, { readOnly: true })
  const columns = Object.keys(FIELDS).join(', ')
  const rows = database.prepare(`SELECT DISTINCT Typ_TR, NrR, ${columns} FROM Route`).all()
  database.close()

  const routes = new Map()
  let skipped = 0

  for (const row of rows) {
    if (!AREAS.includes(row.Typ_TR)) {
      skipped++
      continue
    }

    const key = `${row.Typ_TR}/${row.NrR}`

    if (routes.has(key)) {
      throw new Error(`TWO DIFFERENT FEDERAL ROUTES: ${key}`)
    }

    routes.set(key, row)
  }

  if (skipped > 0) {
    console.log(`  skipped ${skipped} routes of another kind`)
  }

  return routes
}

// Saved routes by `<area>/<number>`
function readSavedRoutes(folder) {
  const routes = new Map()

  for (const area of AREAS) {
    for (const file of fs.readdirSync(`public/data/${folder}/${area}`)) {
      const json = JSON.parse(fs.readFileSync(`public/data/${folder}/${area}/${file}`, 'utf-8'))

      routes.set(`${area}/${file.replace(/\.json$/, '')}`, { id: json.id, ...json.properties })
    }
  }

  return routes
}

function compare(federal, saved) {
  const missingSaved = [...federal.keys()].filter((key) => !saved.has(key))
  const missingFederal = [...saved.keys()].filter((key) => !federal.has(key))
  let different = 0

  for (const [key, route] of federal) {
    const savedRoute = saved.get(key)

    if (!savedRoute) {
      continue
    }

    for (const [column, field] of Object.entries(FIELDS)) {
      if (route[column] !== savedRoute[field]) {
        console.log(`  different ${field}: ${key} "${savedRoute.title}": federal ${route[column]}, saved ${savedRoute[field]}`)
        different++
      }
    }
  }

  missingSaved.forEach((key) => console.log(`  not saved: ${key}`))
  missingFederal.forEach((key) => console.log(`  not in the federal file: ${key} "${saved.get(key).title}"`))

  console.log(`  federal ${federal.size}, saved ${saved.size}, not saved ${missingSaved.length}, not in the federal file ${missingFederal.length}, different values ${different}`)
}

run().catch(console.error)
