const helpers = require('./helpers.js')

async function run() {
  const allIds = []

  await helpers.downloadPoint('other', 'serviceshop', 'Cycleservice', allIds)
  await helpers.downloadPoint('other', 'sightseeing', 'Sightseeing', allIds)
  await helpers.downloadPoint('other', 'mountain', 'MountainHiking', allIds)
}

run().catch(console.error)