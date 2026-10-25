const fs = require('fs')

// Only the images the site shows are checked: the route logo and the photos of the gallery.
// SchweizMobil's own photos are skipped: there are tens of thousands, on the most stable host
const SKIPPED_HOST = 'images.schweizmobil.ch'
const SKIPPED_GROUPS = ['osm']
const SKIPPED_LAYERS = ['chargingstations']
// Hosts answer 403 when asked too fast, so the checks of one host are few and spaced out
const REQUESTS_PER_HOST = 2
const PAUSE = 200
const TIMEOUT = 15000

async function run() {
  const images = collect()
  const hosts = new Map()

  for (const url of images.keys()) {
    const host = hostOf(url)
    hosts.set(host, [...(hosts.get(host) || []), url])
  }

  console.log(`${images.size} images on ${hosts.size} hosts`)

  const broken = []
  const unreachable = []

  await Promise.all([...hosts.values()].map((urls) => checkHost(urls, images, broken, unreachable)))

  console.log('BROKEN')
  broken.sort().forEach((line) => console.log(`  ${line}`))
  console.log('UNREACHABLE')
  unreachable.sort().forEach((line) => console.log(`  ${line}`))

  console.log(`images ${images.size}, broken ${broken.length}, unreachable ${unreachable.length}`)
}

// Image address -> the data files that use it
function collect() {
  const images = new Map()

  for (const group of fs.readdirSync('public/data').filter((name) => !SKIPPED_GROUPS.includes(name))) {
    for (const layer of fs.readdirSync(`public/data/${group}`).filter((name) => !SKIPPED_LAYERS.includes(name))) {
      for (const file of fs.readdirSync(`public/data/${group}/${layer}`)) {
        const filePath = `${group}/${layer}/${file}`
        const properties = JSON.parse(fs.readFileSync(`public/data/${filePath}`, 'utf-8')).properties
        const urls = [...gallery(properties).filter((url) => hostOf(url) !== SKIPPED_HOST), ...clean([properties.logo])]

        for (const url of urls) {
          images.set(url, [...(images.get(url) || []), filePath])
        }
      }
    }
  }

  return images
}

// The same choice as getGallery in public/script.js: the longest photo list, the first one on a tie
function gallery(properties) {
  const lists = [
    properties.photo_gallery_big,
    properties.photo_gallery_master,
    properties.photo_gallery,
    properties.photo_gallery_small,
    [properties.foto],
  ].map(clean)
  const longest = Math.max(...lists.map((list) => list.length))

  return lists.find((list) => list.length === longest)
}

function clean(list) {
  return (list || []).filter((url) => url && url.trim().length > 0).map((url) => url.trim())
}

function hostOf(url) {
  try {
    return new URL(url).host
  } catch (e) {
    return 'invalid address'
  }
}

// Checks the addresses of one host, a few at a time so the host isn't flooded
async function checkHost(urls, images, broken, unreachable) {
  let next = 0

  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++]
      const result = await check(url)

      await new Promise((resolve) => setTimeout(resolve, PAUSE))

      const line = `${result.detail}: ${url} (${images.get(url).join(', ')})`

      if (result.state === 'broken') {
        broken.push(line)
      } else if (result.state === 'unreachable') {
        unreachable.push(line)
      }
    }
  }

  await Promise.all(Array.from({ length: REQUESTS_PER_HOST }, worker))
}

// Broken: the host answered that the image isn't there. Unreachable: no usable answer after all the attempts
async function check(url, attempts = 3) {
  try {
    let response = await request(url, 'HEAD')

    // Some hosts refuse HEAD but serve the image
    if (!response.ok) {
      response = await request(url, 'GET')
    }

    // A host that is asked too often answers 403 or 429, which says nothing about the image
    if (response.status >= 500 || response.status === 403 || response.status === 429) {
      throw new Error(`HTTP ${response.status}`)
    }

    if (!response.ok) {
      return { state: 'broken', detail: `HTTP ${response.status}` }
    }

    // Only a page of text is rejected: some hosts serve images as application/octet-stream, which browsers still show
    const type = response.headers.get('content-type') || ''

    if (type.startsWith('text/')) {
      return { state: 'broken', detail: `not an image (${type})` }
    }

    return { state: 'ok' }
  } catch (e) {
    if (attempts <= 1) {
      return { state: 'unreachable', detail: e.cause?.code || e.toString() }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))

    return check(url, attempts - 1)
  }
}

async function request(url, method) {
  const response = await fetch(url, { method, signal: AbortSignal.timeout(TIMEOUT) })
  await response.body?.cancel()

  return response
}

run().catch(console.error)
