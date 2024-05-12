const fs = require('fs')

async function downloadFile(url, filePath, isPoint) {
  try {
    const json = await getFile(url)

    const features = json.features

    if (features.length > 1) {
      throw new Error(`MORE THAN ONE FEATURE: ${url}`)
    }

    if (features.length === 1) {
      const route = features[0]
      const coordinates = route.geometry.coordinates
      const newCoordinates = []

      if (isPoint) {
        const y = coordinates.get(0).getAsInt()
        const x = coordinates.get(1).getAsInt()
        newCoordinates.push(getPoint(y, x))
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

      route.geometry.coordinates = newCoordinates

      writeFile(filePath, route)
    }
  } catch (e) {
    console.log(`Error downloading file: ${url}\n${e.toString()}`)
  }
}

async function getFile(url) {
  const response = await fetch(url)

  return response.json()
}

function writeFile(filePath, json) {
  const content = JSON.stringify(json, null, 4)
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

module.exports = {
  downloadFile,

}