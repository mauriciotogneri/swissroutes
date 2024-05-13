const helpers = require('./helpers.js')

async function run() {
  await helpers.downloadPoint('accommodation', 'camping', 'Campingsite')
  await helpers.downloadPoint('accommodation', 'backpacker', 'Backpacker')
  await helpers.downloadPoint('accommodation', 'sleepingstraw', 'Sleepingstraw')
  await helpers.downloadPoint('accommodation', 'farm', 'Farmaccom')
  await helpers.downloadPoint('accommodation', 'mountainhut', 'Mountainhut')
}

run().catch(console.error)