const fs = require('fs')

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
  await downloadFile(url, filePath, false)
}

async function downloadFile(url, filePath, isPoint) {
  const json = await getFile(url)
  const content = JSON.stringify(json, null, 4)
  fs.writeFileSync(filePath, content, 'utf-8')
}

async function getFile(url) {
  const response = await fetch(url)

  return response.json()
}

run().catch(console.error)