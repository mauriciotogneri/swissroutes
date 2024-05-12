const helpers = require('./helpers.js')

async function run() {
  await downloadType('serviceshop', 'Cycleservice')
  await downloadType('sightseeing', 'Sightseeing')
  await downloadType('mountain', 'MountainHiking')
}

async function downloadType(folder, type) {
  const ids = await helpers.getIds(type)

  for (const id of ids) {
    console.log(`${folder.toUpperCase()}: ${id}`)
    const url = `https://map.schweizmobil.ch/api/4/query/featuresmultilayers?attributes=yes&translated=true&language=en&${type}=${id}`
    const filePath = `output/other/${folder}/{id}.json`
    await helpers.downloadFile(url, filePath, true)
  }
}

run().catch(console.error)