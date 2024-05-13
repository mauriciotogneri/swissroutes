const helpers = require('./helpers.js')

async function run() {
  await downloadGroup('Mtbland', 'mountainbiking')
  await downloadGroup('Veloland', 'cycling')
  await downloadGroup('Wanderland', 'hiking')
}

async function downloadGroup(group, folder) {
  await downloadArea(group, 'RoutenNational', folder, 'national', 10)
  await downloadArea(group, 'RoutenRegional', folder, 'regional', 100)
  await downloadArea(group, 'RoutenLokal', folder, 'local', 1000)
}

async function downloadArea(group, name, folder, area, total) {
  const ids = []

  for (let i = 1; i < total; i++) {
    const id = await helpers.downloadRoute(i, group, name, `${folder}/${area}`, total)

    if (id) {
      ids.push(id)
    }
  }

  helpers.writeFile(`functions/static/index/${folder}/${area}.json`, ids)
}

run().catch(console.error)