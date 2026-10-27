const helpers = require('./helpers.js')

async function run() {
  const campingIds = await helpers.downloadPointFiles('accommodation', 'camping', 'Campingsite')
  await helpers.downloadPois('accommodation', 'camping', '863e5bc3-a04e-4f3d-b20e-bcb2f1e931f0', campingIds)
  await helpers.downloadPoint('accommodation', 'backpacker', 'Backpacker')
  await helpers.downloadPoint('accommodation', 'sleepingstraw', 'Sleepingstraw')
  await helpers.downloadPoint('accommodation', 'farm', 'Farmaccom')
  await helpers.downloadPoint('accommodation', 'mountainhut', 'Mountainhut')
  await helpers.downloadPois('accommodation', 'hostels', '0d764ef3-3629-4ad6-a01a-daa46f4c477d')
  await helpers.downloadPois('accommodation', 'bnb', '4ff37ce8-bc56-46b1-b91a-19fc98ac531a')
  await helpers.downloadPois('accommodation', 'grouphouse', '9a60fc13-c7c1-455c-b3e6-8dc6674c5338')
}

run().catch(console.error)