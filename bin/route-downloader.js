const helpers = require('./helpers.js')

async function run() {
  await downloadGroup('Mtbland', 'mountainbiking')
  await downloadGroup('Veloland', 'cycling')
  await downloadGroup('Wanderland', 'hiking')
}

async function downloadGroup(group, folder) {
  for (let i = 1; i < 10; i++) {
    await helpers.downloadRoute(i, group, 'RoutenNational', `${folder}/national`)
  }

  for (let i = 1; i < 100; i++) {
    await helpers.downloadRoute(i, group, 'RoutenRegional', `${folder}/regional`)
  }

  for (let i = 1; i < 1000; i++) {
    await helpers.downloadRoute(i, group, 'RoutenLokal', `${folder}/local`)
  }
}

run().catch(console.error)