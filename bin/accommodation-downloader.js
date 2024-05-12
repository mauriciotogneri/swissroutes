const helpers = require('./helpers.js')

async function run() {
  const allIds = []

  await helpers.downloadPoint('accommodation', 'camping', 'Campingsite', allIds)
  await helpers.downloadPoint('accommodation', 'backpacker', 'Backpacker', allIds)
  await helpers.downloadPoint('accommodation', 'sleepingstraw', 'Sleepingstraw', allIds)
  await helpers.downloadPoint('accommodation', 'farm', 'Farmaccom', allIds)
  await helpers.downloadPoint('accommodation', 'mountainhut', 'Mountainhut', allIds)
}

run().catch(console.error)