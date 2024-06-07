const fs = require('fs')

function hashCode(text) {
  let result = 0

  for (let i = 0; i < text.length; i++) {
    result = (result << 5) - result + text.charCodeAt(i++) | 0
  }

  result = Math.abs(result % 10000)

  while (result < 1000) {
    result = Math.abs((result * 2) % 10000)
  }

  return result
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

async function getHuts() {
  const url = 'https://www.suissealpine.sac-cas.ch/api/1/poi/search?lang=en&output_lang=en&order_by=display_name&type=hut&hut_type=all&limit=1000'

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

async function getSegments(id) {
  const url = `https://www.sac-cas.ch/en/?type=1567765346410&tx_usersaccas2020_sac2020[routeId]=${id}&output_lang=en`

  try {
    const json = await getFile(url)
    const result = []

    for (const segment of json.segments) {
      if (segment.geom) {
        const coordinates = segment.geom.coordinates
        let newCoordinates = []

        for (const coordinate of coordinates) {
          const y = parseInt(coordinate[0])
          const x = parseInt(coordinate[1])
          const newPoint = lv95ToLatLng(y, x)

          newCoordinates.push(newPoint)
        }

        segment.geom.coordinates = newCoordinates
        result.push(segment)
      }
    }

    return result
  } catch (e) {
    console.log(`Error downloading file: ${url}\n${e.toString()}`)
  }
}

async function downloadFile(name, id, filePath, isPoint) {
  const url = `https://map.schweizmobil.ch/api/4/query/featuresmultilayers?attributes=yes&translated=true&language=en&${name}=${id}`

  try {
    const json = await getFile(url)

    const features = json.features

    if (features.length > 1) {
      throw new Error(`MORE THAN ONE FEATURE: ${url}`)
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
  }
}

function sanitize(value) {
  return value ? value.trim() : value
}

async function getFile(url) {
  const response = await fetch(url)

  return response.json()
}

function writeFile(filePath, json) {
  const content = JSON.stringify(json)
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

function lv95ToLatLng(east, north) {
  const y_aux = (east - 2600000) / 1000000
  const x_aux = (north - 1200000) / 1000000

  const lat = (16.9023892
    + 3.238272 * x_aux
    - 0.270978 * Math.pow(y_aux, 2)
    - 0.002528 * Math.pow(x_aux, 2)
    - 0.0447 * Math.pow(y_aux, 2) * x_aux
    - 0.0140 * Math.pow(x_aux, 3)) * 100 / 36

  const lng = (2.6779094
    + 4.728982 * y_aux
    + 0.791484 * y_aux * x_aux
    + 0.1306 * y_aux * Math.pow(x_aux, 2)
    - 0.0436 * Math.pow(y_aux, 3)) * 100 / 36

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

  writeFile(`functions/static/index/${group}/${folder}.json`, ids)
}

async function downloadMountainHike(group, folder, type) {
  const ids = await getIds(type)

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    console.log(`${folder.toUpperCase()}: ${id} (${parseInt((i / ids.length) * 100)}%)`)
    const filePath = `public/data/${group}/${folder}/${id}.json`
    await downloadFile(type, id, filePath, true)

    const file = fs.readFileSync(filePath, 'utf-8')
    const originalJson = JSON.parse(file)
    originalJson.segments = await getSegments(originalJson.properties.sac_orig_id)
    writeFile(filePath, originalJson)
  }

  writeFile(`functions/static/index/${group}/${folder}.json`, ids)
}

async function downloadPois(group, folder, category, append) {
  const pois = await getPoisByCategory(category)
  const ids = []

  for (const poi of pois) {
    const id = hashCode(poi.id)
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

  const idsFilePath = `functions/static/index/${group}/${folder}.json`

  if (append) {
    const file = fs.readFileSync(idsFilePath, 'utf-8')
    const originalIds = JSON.parse(file)
    ids.push(...originalIds)
  }

  writeFile(idsFilePath, ids)
}

async function downloadHuts(group, folder, category) {
  const huts = await getHuts()

  for (const hut of huts.results) {
    const photos = []

    for (const photo of hut.photos) {
      const url = photo.photo.url

      if (url) {
        photos.push(url)
      }
    }

    const json = {
      id: hut.id,
      properties: {
        title: hut.display_name,
        abstract: hut.opentext.en ?? hut.opentext.fr ?? hut.opentext.it ?? hut.opentext.de,
        description: hut.description,
        r_number: hut.id,
        city: hut.regions_denormalization,
        place: hut.regions_denormalization,
        tel: hut.tel,
        email: hut.email,
        url1_link: hut.url,
        photo_gallery_big: photos
      },
      geometry: {
        coordinates: lv95ToLatLng(hut.geom.coordinates[0], hut.geom.coordinates[1])
      }
    }

    console.log(json)

    //const filePath = `public/data/${group}/${folder}/${id}.json`
    //writeFile(filePath, json)
  }

  /*const idsFilePath = `functions/static/index/${group}/${folder}.json`

  if (append) {
    const file = fs.readFileSync(idsFilePath, 'utf-8')
    const originalIds = JSON.parse(file)
    ids.push(...originalIds)
  }

  writeFile(idsFilePath, ids)*/
}

module.exports = {
  writeFile,
  downloadRoute,
  downloadPoint,
  downloadMountainHike,
  downloadPois,
  downloadHuts,
}