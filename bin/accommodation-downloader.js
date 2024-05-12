const helpers = require('./helpers.js')

async function run() {
  const allIds = []

  await downloadType('camping', 'Campingsite', allIds)
  await downloadType('backpacker', 'Backpacker', allIds)
  await downloadType('sleepingstraw', 'Sleepingstraw', allIds)
  await downloadType('farm', 'Farmaccom', allIds)
  await downloadType('mountainhut', 'Mountainhut', allIds)
}

async function downloadType(folder, type, allIds) {
  const ids = await helpers.getIds(type)

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