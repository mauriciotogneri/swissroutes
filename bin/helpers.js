const fs = require('fs')

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

  writeFile(`functions/static/index/${group}/${folder}.json`, ids);
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

    const newJson = await getFile(`https://www.sac-cas.ch/en/?type=1567765346410&tx_usersaccas2020_sac2020[routeId]=${originalJson.properties.sac_orig_id}`)
    originalJson.segments = newJson.segments
    writeFile(filePath, newJson)
  }

  writeFile(`functions/static/index/${group}/${folder}.json`, ids);
}

module.exports = {
  writeFile,
  downloadRoute,
  downloadPoint,
  downloadMountainHike,
}