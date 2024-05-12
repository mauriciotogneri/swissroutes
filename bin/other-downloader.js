const helpers = require('./helpers.js')

async function run() {
  await helpers.downloadPoint('other', 'serviceshop', 'Cycleservice')
  await helpers.downloadPoint('other', 'sightseeing', 'Sightseeing')
  await helpers.downloadPoint('other', 'mountain', 'MountainHiking')
}

run().catch(console.error)