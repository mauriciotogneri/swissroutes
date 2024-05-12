const helpers = require('./helpers.js')

async function run() {
  const allIds = []
  downloadType('camping', 'Campingsite', allIds)
  downloadType('backpacker', 'Backpacker', allIds)
  downloadType('sleepingstraw', 'Sleepingstraw', allIds)
  downloadType('farm', 'Farmaccom', allIds)
  downloadType('mountainhut', 'Mountainhut', allIds)
}

async function downloadType(folder, type, allIds) {
  const ids = helpers.getIds(`https://wmts0.schweizmobil.ch/poi-clusters-prod/21781/clustered_${type}.geojson`)

  for (const id of ids) {
    if (!allIds.includes(id)) {
      allIds.push(id)
      console.log(`${folder.toUpperCase()}: ${id}`)
      const url = `https://map.schweizmobil.ch/api/4/query/featuresmultilayers?attributes=yes&translated=true&language=en&${type}=${id}`
      const filePath = `output/accommodation/${folder}/${id}.json`
      await helpers.downloadFile(url, filePath, true)
    }
  }
}

run().catch(console.error)