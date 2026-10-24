const fs = require('fs')

// Favorites lists point at the data files of another layer
const DATA_FOLDERS = {
  'favorites/hiking': 'hiking/local',
  'favorites/visit': 'other/sightseeing',
}

function run() {
  const referenced = {}
  const skipped = new Set()

  for (const group of fs.readdirSync('ids')) {
    for (const file of fs.readdirSync(`ids/${group}`)) {
      const list = `${group}/${file.replace(/\.json$/, '')}`
      const folder = DATA_FOLDERS[list] ?? list
      const ids = JSON.parse(fs.readFileSync(`ids/${list}.json`, 'utf-8'))

      if (ids.length === 0) {
        skipped.add(folder)
      }

      referenced[folder] = referenced[folder] ?? new Set()
      ids.forEach((id) => referenced[folder].add(`${id}.json`))
    }
  }

  for (const [folder, files] of Object.entries(referenced)) {
    if (skipped.has(folder)) {
      console.log(`${folder}: skipped, an id list for it is empty`)
      continue
    }

    const directory = `public/data/${folder}`
    const stale = fs.readdirSync(directory).filter((file) => !files.has(file))

    for (const file of stale) {
      fs.unlinkSync(`${directory}/${file}`)
    }

    console.log(`${folder}: deleted ${stale.length}`)
  }
}

run()
