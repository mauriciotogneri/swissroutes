const helpers = require('./helpers.js')

async function run() {
  await helpers.downloadPoint('accommodation', 'camping', 'Campingsite')
  await helpers.downloadPoint('accommodation', 'backpacker', 'Backpacker')
  await helpers.downloadPoint('accommodation', 'sleepingstraw', 'Sleepingstraw')
  await helpers.downloadPoint('accommodation', 'farm', 'Farmaccom')
  await helpers.downloadPoint('accommodation', 'mountainhut', 'Mountainhut')
  await helpers.downloadHuts('accommodation', 'mountainhut')
  await helpers.downloadPois('accommodation', 'hostels', '0d764ef3-3629-4ad6-a01a-daa46f4c477d', false)
  await helpers.downloadPois('accommodation', 'bnb', '4ff37ce8-bc56-46b1-b91a-19fc98ac531a', false)
  await helpers.downloadPois('accommodation', 'grouphouse', '9a60fc13-c7c1-455c-b3e6-8dc6674c5338', false)
  await helpers.downloadPois('accommodation', 'camping', '863e5bc3-a04e-4f3d-b20e-bcb2f1e931f0', true)
}

run().catch(console.error)