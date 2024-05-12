const helpers = require('./helpers.js')

async function run() {
  await downloadGroup('Mtbland', 'mountainbiking')
  await downloadGroup('Veloland', 'cycling')
  await downloadGroup('Wanderland', 'hiking')
}

async function downloadGroup(group, folder) {
  for (let i = 1; i < 10; i++) {
    await downloadType(i, group, 'RoutenNational', `${folder}/national`)
  }

  for (let i = 1; i < 100; i++) {
    await downloadType(i, group, 'RoutenRegional', `${folder}/regional`)
  }

  for (let i = 1; i < 1000; i++) {
    await downloadType(i, group, 'RoutenLokal', `${folder}/local`)
  }
}

async function downloadType(id, group, type, folder) {
  console.log(`${group}-${type}: ${id}`)
  const url = `https://map.schweizmobil.ch/api/4/query/featuresmultilayers?attributes=yes&translated=true&language=en&${group}${type}=${id}`
  const filePath = `output/${folder}/${id}.json`
  await helpers.downloadFile(url, filePath, false)
}

run().catch(console.error)