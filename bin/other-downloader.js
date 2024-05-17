const helpers = require('./helpers.js')

async function run() {
  await helpers.downloadPoint('other', 'serviceshop', 'Cycleservice')
  await helpers.downloadPoint('other', 'sightseeing', 'Sightseeing')
}

run().catch(console.error)