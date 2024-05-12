const fs = require('fs')

async function run() {
  const json = await getFile('https://map.schweizmobil.ch/api/4/query/featuresmultilayers?attributes=yes&translated=true&language=en&MtblandRoutenNational=1')
  const content = JSON.stringify(json, null, 4)
  fs.writeFileSync('test.json', content, 'utf-8')
}

async function getFile(url) {
  const response = await fetch(url)

  return response.json()
}

run().catch(console.error)