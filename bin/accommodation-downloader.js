const helpers = require('./helpers.js')

async function run() {
  //await helpers.downloadPoint('accommodation', 'camping', 'Campingsite')
  //await helpers.downloadPoint('accommodation', 'backpacker', 'Backpacker')
  //await helpers.downloadPoint('accommodation', 'sleepingstraw', 'Sleepingstraw')
  //await helpers.downloadPoint('accommodation', 'farm', 'Farmaccom')
  //await helpers.downloadPoint('accommodation', 'mountainhut', 'Mountainhut')
  await helpers.downloadPois('accommodation', 'hostels', '0d764ef3-3629-4ad6-a01a-daa46f4c477d')
}

run().catch(console.error)