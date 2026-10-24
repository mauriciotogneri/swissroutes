const fs = require('fs')

const IDS = {
  // mountainbiking
  MOUNTAINBIKING_NATIONAL_IDS: 'mountainbiking/national',
  MOUNTAINBIKING_REGIONAL_IDS: 'mountainbiking/regional',
  MOUNTAINBIKING_LOCAL_IDS: 'mountainbiking/local',

  // cycling
  CYCLING_NATIONAL_IDS: 'cycling/national',
  CYCLING_REGIONAL_IDS: 'cycling/regional',
  CYCLING_LOCAL_IDS: 'cycling/local',

  // hiking
  HIKING_NATIONAL_IDS: 'hiking/national',
  HIKING_REGIONAL_IDS: 'hiking/regional',
  HIKING_LOCAL_IDS: 'hiking/local',

  // accommodation
  ACCOMMODATION_BACKPACKER_IDS: 'accommodation/backpacker',
  ACCOMMODATION_CAMPING_IDS: 'accommodation/camping',
  ACCOMMODATION_FARM_IDS: 'accommodation/farm',
  ACCOMMODATION_MOUNTAINHUT_IDS: 'accommodation/mountainhut',
  ACCOMMODATION_SLEEPINGSTRAW_IDS: 'accommodation/sleepingstraw',
  ACCOMMODATION_HOSTEL_IDS: 'accommodation/hostels',
  ACCOMMODATION_BNB_IDS: 'accommodation/bnb',
  ACCOMMODATION_GROUPHOUSE_IDS: 'accommodation/grouphouse',

  // other
  OTHER_SERVICESHOP_IDS: 'other/serviceshop',
  OTHER_SIGHTSEEING_IDS: 'other/sightseeing',

  // favorites
  FAVORITES_HIKING_IDS: 'favorites/hiking',
  FAVORITES_VISIT_IDS: 'favorites/visit',
}

function run() {
  let content = ''

  for (const [name, path] of Object.entries(IDS)) {
    const ids = [...new Set(JSON.parse(fs.readFileSync(`ids/${path}.json`, 'utf-8')))]
    content += `const ${name} = ${JSON.stringify(ids)}\n`
  }

  fs.writeFileSync('public/ids.js', content, 'utf-8')
}

run()
