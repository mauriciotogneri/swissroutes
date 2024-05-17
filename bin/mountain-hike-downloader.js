const helpers = require('./helpers.js')

async function run() {
  await helpers.downloadMountainHike('other', 'mountainhike', 'MountainHiking')
}

run().catch(console.error)