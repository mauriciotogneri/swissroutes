const fs = require('fs')
const path = require('path')

function hashCode(text) {
  let result = 0

  for (let i = 0; i < text.length; i++) {
    result = (result << 5) - result + text.charCodeAt(i) | 0
  }

  return 100000000 + Math.abs(result % 900000000)
}

async function getPois() {
  const url = 'https://www.myswitzerland.com/api/maps/GetPointsOfInterests/?mapid=4bf4b9f9-affe-4599-bbc9-d7d2facf6711&language=en-CH&siteName=myswitzerland'

  try {
    return getFile(url)
  } catch (e) {
    console.log(`Error downloading file: ${url}\n${e.toString()}`)
  }
}

async function getPoisByCategory(category) {
  const pois = await getPois()
  const result = []

  for (const poi of pois) {
    if (poi.categories.includes(category)) {
      result.push(poi)
    }
  }

  return result
}

async function getPoisByCategory(category) {
  const pois = await getPois()
  const result = []

  for (const poi of pois) {
    if (poi.categories.includes(category)) {
      result.push(poi)
    }
  }

  return result
}

async function downloadFile(name, id, filePath, isPoint) {
  const url = `https://map.schweizmobil.ch/api/4/query/featuresmultilayers?attributes=yes&translated=true&language=en&${name}=${id}`

  try {
    const json = await getFile(url)

    const features = json.features

    if (features.length > 1) {
      console.log(`MORE THAN ONE FEATURE: ${url}`)
      return
    }

    if (features.length === 1) {
      const element = features[0]
      const coordinates = element.geometry.coordinates
      let newCoordinates = []

      if (isPoint) {
        const y = parseInt(coordinates[0])
        const x = parseInt(coordinates[1])
        newCoordinates = getPoint(y, x)
      } else {
        for (let i = 0; i < coordinates.length; i++) {
          const stage = coordinates[i]
          const newStage = []

          for (let j = 0; j < stage.length; j++) {
            const point = stage[j]
            const y = parseInt(point[0])
            const x = parseInt(point[1])
            const newPoint = getPoint(y, x)

            newStage.push(newPoint)
          }

          newCoordinates.push(newStage)
        }
      }

      element.geometry.coordinates = newCoordinates

      const properties = element.properties
      properties.street = sanitize(properties.street)
      properties.zip = sanitize(properties.zip)
      properties.place = sanitize(properties.place)
      properties.tel = sanitize(properties.tel)
      properties.email = sanitize(properties.email)
      properties.abstract = sanitize(properties.abstract)
      properties.description = sanitize(properties.description)
      properties.highlights = sanitize(properties.highlights)
      properties.title = sanitize(properties.title)
      properties.name = sanitize(properties.name)
      properties.url1_link = sanitize(properties.url1_link)
      properties.url2_link = sanitize(properties.url2_link)
      properties.url_sightseeing = sanitize(properties.url_sightseeing)

      writeFile(filePath, element)

      return id
    }
  } catch (e) {
    console.log(`Error downloading file: ${url}\n${e.toString()}`)
    throw e
  }
}

function sanitize(value) {
  return value ? value.trim() : value
}

async function getFile(url, attempts = 3) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (e) {
    if (attempts <= 1) {
      throw e
    }

    console.log(`Retrying: ${url}\n${e.toString()}`)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return getFile(url, attempts - 1)
  }
}

function writeFile(filePath, json) {
  const content = JSON.stringify(json)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function getPoint(y, x) {
  const y_aux = (y - 600000) / 1000000
  const x_aux = (x - 200000) / 1000000

  const lng = (2.6779094
    + 4.728982 * y_aux
    + 0.791484 * y_aux * x_aux
    + 0.1306 * y_aux * Math.pow(x_aux, 2)
    - 0.0436 * Math.pow(y_aux, 3)) * 100 / 36

  const lat = (16.9023892
    + 3.238272 * x_aux
    - 0.270978 * Math.pow(y_aux, 2)
    - 0.002528 * Math.pow(x_aux, 2)
    - 0.0447 * Math.pow(y_aux, 2) * x_aux
    - 0.0140 * Math.pow(x_aux, 3)) * 100 / 36

  return [lat, lng]
}

async function getIds(type) {
  const url = `https://data.schweizmobil.ch/poi-clusters-prod/21781/clustered_${type}.geojson`
  const result = []

  try {
    const json = await getFile(url)
    const features = json.features

    for (let i = 0; i < features.length; i++) {
      const feature = features[i]
      result.push(parseInt(feature['id']))
    }
  } catch (e) {
    console.log(`Error getting ids: ${url}\n${e.toString()}`)
    throw e
  }

  if (result.length === 0) {
    throw new Error(`NO IDS FOUND: ${url}`)
  }

  result.sort((a, b) => a - b)

  return result
}

async function downloadRoute(id, group, type, folder, total) {
  console.log(`${group}-${type}: ${id} (${parseInt((id / total) * 100)}%)`)
  const filePath = `public/data/${folder}/${id}.json`

  return downloadFile(`${group}${type}`, id, filePath, false)
}

async function downloadPoint(group, folder, type) {
  const ids = await getIds(type)

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    console.log(`${folder.toUpperCase()}: ${id} (${parseInt((i / ids.length) * 100)}%)`)
    const filePath = `public/data/${group}/${folder}/${id}.json`
    await downloadFile(type, id, filePath, true)
  }

  writeFile(`ids/${group}/${folder}.json`, ids)
}

async function downloadPois(group, folder, category, append) {
  const pois = await getPoisByCategory(category)
  const idsFilePath = `ids/${group}/${folder}.json`
  const originalIds = append ? JSON.parse(fs.readFileSync(idsFilePath, 'utf-8')) : []
  const ids = []

  for (const poi of pois) {
    const id = hashCode(poi.id)

    if (ids.includes(id) || originalIds.includes(id)) {
      throw new Error(`DUPLICATED ID ${id}: ${poi.id}`)
    }

    ids.push(id)

    const json = {
      id: id,
      properties: {
        title: poi.title,
        r_number: id,
        foto: poi.imageUrl,
        city: poi.placeTitle
      },
      geometry: {
        coordinates: [
          poi.lat,
          poi.long
        ]
      }
    }

    const filePath = `public/data/${group}/${folder}/${id}.json`
    writeFile(filePath, json)
  }

  ids.push(...originalIds)
  writeFile(idsFilePath, ids)
}

module.exports = {
  writeFile,
  downloadRoute,
  downloadPoint,
  downloadPois,
}