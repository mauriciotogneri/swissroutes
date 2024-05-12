"use strict"

let map = undefined
let openedInfoWindow = undefined
let markersAdded = []
let pathsAdded = []
let currentGallery = []
let currentGalleryIndex = 0
let currentJson = undefined

const COLORS = ['#e81123', '#c6ba15', '#ff8c00', '#ec008c', '#68217a', '#00188f', '#00bcf2', '#00b294', '#009e49', '#bad80a']

function mapLoaded() {
  const mapOptions = {
    zoom: 9,
    center: {
      lat: 46.75,
      lng: 8.10,
    }
  }

  map = new google.maps.Map(document.getElementById('map'), mapOptions)
  refresh()
}

function refresh() {
  for (let marker of markersAdded) {
    marker.setMap(null)
  }

  for (let path of pathsAdded) {
    path.setMap(null)
  }

  refreshMountainBiking()
  refreshCycling()
  refreshHiking()

  refreshAccommodation()
  refreshOther()

  if (PARAM_URL && PARAM_TYPE) {
    loadRoute(PARAM_TYPE, PARAM_URL, true)
    PARAM_TYPE = undefined
    PARAM_URL = undefined
  }
}

function refreshMountainBiking() {
  const lengthMin = readInt('filterMountainBikingLengthMin')
  const lengthMax = readInt('filterMountainBikingLengthMax')

  const heightMin = readInt('filterMountainBikingHeightMin')
  const heightMax = readInt('filterMountainBikingHeightMax')

  const nationalChecked = document.getElementById('checkboxMountainBikingNational').checked

  if (nationalChecked) {
    for (const id of MOUNTAINBIKING_NATIONAL_IDS) {
      loadRoute('mountainbiking', `mountainbiking/national/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
    }
  }

  const regionalChecked = document.getElementById('checkboxMountainBikingRegional').checked

  if (regionalChecked) {
    for (const id of MOUNTAINBIKING_REGIONAL_IDS) {
      loadRoute('mountainbiking', `mountainbiking/regional/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
    }
  }

  const localChecked = document.getElementById('checkboxMountainBikingLocal').checked

  if (localChecked) {
    for (const id of MOUNTAINBIKING_LOCAL_IDS) {
      loadRoute('mountainbiking', `mountainbiking/local/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
    }
  }
}

function refreshCycling() {
  const nationalChecked = document.getElementById('checkboxCyclingNational').checked

  if (nationalChecked) {
    for (const id of CYCLING_NATIONAL_IDS) {
      loadRoute('cycling', `cycling/national/${id}.json`, false)
    }
  }

  const regionalChecked = document.getElementById('checkboxCyclingRegional').checked

  if (regionalChecked) {
    for (const id of CYCLING_REGIONAL_IDS) {
      loadRoute('cycling', `cycling/regional/${id}.json`, false)
    }
  }

  const localChecked = document.getElementById('checkboxCyclingLocal').checked

  if (localChecked) {
    for (const id of CYCLING_LOCAL_IDS) {
      loadRoute('cycling', `cycling/local/${id}.json`, false)
    }
  }
}

function refreshHiking() {
  const nationalChecked = document.getElementById('checkboxHikingNational').checked

  if (nationalChecked) {
    for (const id of HIKING_NATIONAL_IDS) {
      loadRoute('hiking', `hiking/national/${id}.json`, false)
    }
  }

  const regionalChecked = document.getElementById('checkboxHikingRegional').checked

  if (regionalChecked) {
    for (const id of HIKING_REGIONAL_IDS) {
      loadRoute('hiking', `hiking/regional/${id}.json`, false)
    }
  }

  const localChecked = document.getElementById('checkboxHikingLocal').checked

  if (localChecked) {
    for (const id of HIKING_LOCAL_IDS) {
      loadRoute('hiking', `hiking/local/${id}.json`, false)
    }
  }
}

function refreshAccommodation() {
  const campingChecked = document.getElementById('checkboxAccommodationCamping').checked

  if (campingChecked) {
    for (const id of ACCOMMODATION_CAMPING_IDS) {
      loadPoint('Camping', 'https://schweizmobil.ch/en/accommodation-', `accommodation/camping/${id}.json`)
    }
  }

  const backpackerChecked = document.getElementById('checkboxAccommodationBackpacker').checked

  if (backpackerChecked) {
    for (const id of ACCOMMODATION_BACKPACKER_IDS) {
      loadPoint('Backpacking', 'https://schweizmobil.ch/en/accommodation-', `accommodation/backpacker/${id}.json`)
    }
  }

  const sleepingStrawChecked = document.getElementById('checkboxAccommodationSleepingStraw').checked

  if (sleepingStrawChecked) {
    for (const id of ACCOMMODATION_SLEEPINGSTRAW_IDS) {
      loadPoint('SleepingStraw', 'https://schweizmobil.ch/en/accommodation-', `accommodation/sleepingstraw/${id}.json`)
    }
  }

  const farmChecked = document.getElementById('checkboxAccommodationFarm').checked

  if (farmChecked) {
    for (const id of ACCOMMODATION_FARM_IDS) {
      loadPoint('Farm', 'https://schweizmobil.ch/en/accommodation-', `accommodation/farm/${id}.json`)
    }
  }

  const mountainHutChecked = document.getElementById('checkboxAccommodationMountainHut').checked

  if (mountainHutChecked) {
    for (const id of ACCOMMODATION_MOUNTAINHUT_IDS) {
      loadPoint('Mountain Hut', 'https://schweizmobil.ch/en/accommodation-', `accommodation/mountainhut/${id}.json`)
    }
  }
}

function refreshOther() {
  const serviceShopChecked = document.getElementById('checkboxOtherServiceShop').checked

  if (serviceShopChecked) {
    for (const id of OTHER_SERVICESHOP_IDS) {
      loadPoint('Service Shop', 'https://schweizmobil.ch/en/veloservice-', `other/serviceshop/${id}.json`)
    }
  }

  const sightseeingChecked = document.getElementById('checkboxOtherSightseeing').checked

  if (sightseeingChecked) {
    for (const id of OTHER_SIGHTSEEING_IDS) {
      loadPoint('Sightseeing', 'https://schweizmobil.ch/en/place-of-interest-', `other/sightseeing/${id}.json`)
    }
  }

  const mountainChecked = document.getElementById('checkboxOtherMountain').checked

  if (mountainChecked) {
    for (const id of OTHER_MOUNTAIN_IDS) {
      loadMountainHike(`other/mountain/${id}.json`)
    }
  }

  const checkboxOtherChargingStations = document.getElementById('checkboxOtherChargingStations').checked

  if (checkboxOtherChargingStations) {
    loadChargingStations(`other/chargingstations/chargingstations.json`)
  }
}

function loadRoute(type, url, focus, lengthMin, lengthMax, heightMin, heightMax) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const json = JSON.parse(xhttp.responseText)
      showRoute(type, url, json, focus, lengthMin, lengthMax, heightMin, heightMax)
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function loadPoint(label, baseLink, url) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const json = JSON.parse(xhttp.responseText)
      showPoint(label, baseLink, json)
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function loadMountainHike(url) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const json = JSON.parse(xhttp.responseText)
      showMountainHike(json)
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function loadChargingStations(url) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const json = JSON.parse(xhttp.responseText)

      for (const entry of json) {
        showChargingStations(entry)
      }
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function showRoute(type, url, json, focus, lengthMin, lengthMax, heightMin, heightMax) {
  const length = parseInt(json.properties.length)
  const height = parseInt(json.properties.height_difference)

  if (lengthMin && (length < lengthMin)) {
    return
  }

  if (lengthMax && (length > lengthMax)) {
    return
  }

  if (heightMin && (height < heightMin)) {
    return
  }

  if (heightMax && (height > heightMax)) {
    return
  }

  const stages = json.geometry.coordinates

  const galleryList = getGallery(json)

  let content = ''
  content += `<img width='25' src='${json.properties.logo}' style='margin-right:10px'/>`
  content += `<a href='https://www.schweizmobil.ch/en/${type}-in-switzerland/route-${json.properties.r_number}' target='_blank'>${json.properties.title}</a>`
  content += `<span style='position:absolute;left:100%;top:15px;transform:translateX(-120%);'><a href='?url=${encodeURIComponent(url)}&type=${type}' style='margin-right:20px' target='_blank'>SHARE</a><span style="cursor:pointer;font-weight:bold;color:rgba(var(--bs-link-color-rgb),var(--bs-link-opacity,1))" onclick='download()'>DOWNLOAD</span></span><br/><br/>`
  content += `<p><b>Length</b>: ${length} km (${parseInt(json.properties.length_asphalt * 100 / length)}% asphalted)<br/>`
  content += `<b>↗</b> ${json.properties.height_difference.toLocaleString()} m<br/>`
  content += `<b>↘</b> ${json.properties.height_difference_back.toLocaleString()} m</p>`
  content += `<p><b style="font-weight:bold">${json.properties.abstract}</b></p>`
  content += `<p>${json.properties.description}</p>`

  if (galleryList.length > 0) {
    content += `<center><a class='prev' onclick='plusSlides(-1, ${json.properties.r_number})'>&#10094;</a>`
    content += `<img id='gallery-${json.properties.r_number}' height='300' src='${galleryList[0]}'/>`
    content += `<a class='next' onclick='plusSlides(1, ${json.properties.r_number})'>&#10095;</a><br/><br/>`
    content += `<span><b id='index-${json.properties.r_number}'>1/${galleryList.length}</b></span><br/></center>`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  const firstStage = stages[0]
  const start = point(firstStage[0][0], firstStage[0][1])

  const lastStage = stages[stages.length - 1]
  const end = point(lastStage[lastStage.length - 1][0], lastStage[lastStage.length - 1][1])

  const markerText = json.properties.r_number
  const markerStart = showMarker(start.lat, start.lng, infowindow, markerText, json, galleryList)
  const color = nameToRGB(json.properties.title)

  let north = -90
  let south = 90
  let east = -180
  let west = 180

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    const path = []

    for (let j = 0; j < stage.length; j++) {
      const newPoint = point(stage[j][0], stage[j][1])
      path.push(newPoint)
    }

    showPath(path, markerStart, infowindow, color, galleryList, json)

    for (let coordinate of path) {
      if (coordinate.lat > north) {
        north = coordinate.lat
      }

      if (coordinate.lat < south) {
        south = coordinate.lat
      }

      if (coordinate.lng > east) {
        east = coordinate.lng
      }

      if (coordinate.lng < west) {
        west = coordinate.lng
      }
    }
  }

  if (focus) {
    const bounds = {
      north: north,
      south: south,
      east: east,
      west: west,
    }

    map.fitBounds(bounds)
  }
}

function showPoint(label, baseLink, json) {
  let content = ''
  content += `<a href='${baseLink}${json.id}' target='_blank'>${json.properties.title ? json.properties.title : json.properties.name}</a><br/><br/>`

  if (json.properties.abstract) {
    content += `<p>${json.properties.abstract}</p>`
  }

  if (json.properties.description) {
    content += `<p>${json.properties.description}</p>`
  }

  if (json.properties.street) {
    const address = `${json.properties.street}, ${json.properties.zip} ${json.properties.place}`
    content += `<a href='https://www.google.com/maps/search/${address}' target='_blank'>${address}</a><br/><br/>`
  }

  if (json.properties.tel) {
    content += `<p>${json.properties.tel}</p>`
  }

  if (json.properties.email) {
    content += `<p>${json.properties.email}</p>`
  }

  const urls = new Set()

  if (json.properties.url1_link) {
    urls.add(json.properties.url1_link)
  }

  if (json.properties.url2_link) {
    urls.add(json.properties.url2_link)
  }

  if (json.properties.url_sightseeing) {
    urls.add(json.properties.url_sightseeing)
  }

  urls.forEach((url) => {
    content += `<a href='${url}' target='_blank'>${url}</a><br/><br/>`
  })

  const galleryList = getGallery(json)

  if (galleryList.length > 0) {
    content += `<center><a class='prev' onclick='plusSlides(-1, ${json.properties.r_number})'>&#10094;</a>`
    content += `<img id='gallery-${json.properties.r_number}' height='300' src='${galleryList[0]}'/>`
    content += `<a class='next' onclick='plusSlides(1, ${json.properties.r_number})'>&#10095;</a><br/><br/>`
    content += `<span><b id='index-${json.properties.r_number}'>1/${galleryList.length}</b></span><br/></center>`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, label, json, galleryList)
}

function showMountainHike(json) {
  let content = ''
  content += `<b style="font-weight:bold">${json.properties.title} - ${json.properties.poi_title}</b><br/><br/>`

  if (json.properties.subtitle) {
    content += `<p>${json.properties.subtitle}</p>`
  }

  if (json.properties.abstract) {
    content += `<p>${json.properties.abstract}</p>`
  }

  if (json.properties.ascent_altitude) {
    content += `<p>Ascent: ${json.properties.ascent_altitude.toLocaleString()} m</p>`
  }

  if (json.properties.descent_altitude) {
    content += `<p>Descent: ${json.properties.descent_altitude.toLocaleString()} m</p>`
  }

  if (json.properties.mountain_hiking_difficulty) {
    content += `<p>Difficulty: ${json.properties.mountain_hiking_difficulty}</p>`
  }

  const galleryList = getGallery(json)

  if (galleryList.length > 0) {
    content += `<center><a class='prev' onclick='plusSlides(-1, ${json.properties.r_number})'>&#10094;</a>`
    content += `<img id='gallery-${json.properties.r_number}' height='300' src='${galleryList[0]}'/>`
    content += `<a class='next' onclick='plusSlides(1, ${json.properties.r_number})'>&#10095;</a><br/><br/>`
    content += `<span><b id='index-${json.properties.r_number}'>1/${galleryList.length}</b></span><br/></center>`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, 'Mountain Hike', json, galleryList)
}

function showChargingStations(json) {
  const coordinates = json.Point.coordinates.split(',')
  const latitude = parseFloat(coordinates[1])
  const longitude = parseFloat(coordinates[0])

  if ((latitude >= 46.128503) && (latitude <= 47.858446) && (longitude >= 5.923137) && (longitude <= 10.583217)) {
    const name = typeof json.name == 'string' ? json.name : json.name['__cdata']
    let content = `<b style="font-weight:bold">${name}</b><br/><br/>`

    if (json.description) {
      content += `<p>${json.description.__cdata}</p>`
    }

    content += `<a href='https://www.google.com/maps/place/${latitude},${longitude}' target='_blank'>Address</a><br/><br/>`

    const infowindow = new google.maps.InfoWindow({
      content: content
    })

    showMarker(latitude, longitude, infowindow, '+/-', json)
  }
}

function getGallery(json) {
  if (json.properties.photo_gallery?.length > 0) {
    return json.properties.photo_gallery
  } else if (json.properties.photo_gallery_big?.length > 0) {
    return json.properties.photo_gallery_big
  } else if (json.properties.photo_gallery_master?.length > 0) {
    return json.properties.photo_gallery_master
  } else if (json.properties.photo_gallery_small?.length > 0) {
    return json.properties.photo_gallery_small
  } else if (json.properties.sac_photos?.length > 0) {
    return json.properties.sac_photos.map((e) => e.photo_standard)
  } else if (json.properties.foto) {
    return [json.properties.foto]
  } else {
    return []
  }
}

function plusSlides(offset, id) {
  currentGalleryIndex += offset

  if (currentGalleryIndex < 0) {
    currentGalleryIndex = currentGallery.length - 1
  }

  if (currentGalleryIndex >= currentGallery.length) {
    currentGalleryIndex = 0
  }

  const img = document.getElementById(`gallery-${id}`)
  img.src = currentGallery[currentGalleryIndex]

  const index = document.getElementById(`index-${id}`)
  index.innerHTML = `${currentGalleryIndex + 1}/${currentGallery.length}`
}

function showMarker(lat, lon, infowindow, text, json, gallery) {
  const marker = new google.maps.Marker({
    position: {
      lat: lat,
      lng: lon,
    },
    label: {
      text: text,
      fontSize: '12px',
      fontWeight: 'bold'
    },
    map
  })

  marker.addListener('click', () => {
    if (openedInfoWindow) {
      openedInfoWindow.close()
    }

    infowindow.open(map, marker)
    openedInfoWindow = infowindow

    currentGallery = gallery
    currentGalleryIndex = 0
    currentJson = json
  })

  markersAdded.push(marker)

  return marker
}

function showPath(coordinates, markerStart, infowindow, color, gallery, json) {
  const path = new google.maps.Polyline({
    path: coordinates,
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 1,
    strokeWeight: 3
  })

  path.addListener('click', () => {
    if (openedInfoWindow) {
      openedInfoWindow.close()
    }

    infowindow.open(map, markerStart)
    openedInfoWindow = infowindow

    currentGallery = gallery
    currentGalleryIndex = 0
    currentJson = json
  })

  path.setMap(map)

  pathsAdded.push(path)

  return path
}

function point(lat, lng) {
  return {
    lat: lat,
    lng: lng,
  }
}

function nameToRGB(name) {
  let hash = 0

  for (let i = 0; i < name.length; i++) {
    hash = Math.abs(name.charCodeAt(i) + ((hash << 5) - hash))
  }

  return COLORS[hash % 10]
}

function download() {
  const data = gpxData(currentJson)
  const filename = `${currentJson.properties.r_number} - ${currentJson.properties.title}.gpx`
  const file = new Blob([data], { type: 'application/xml' })

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else {
    const a = document.createElement('a'),
      url = URL.createObjectURL(file)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
}

function gpxData(json) {
  const name = `${json.properties.r_number} - ${json.properties.title}`
  let xml = "<?xml version='1.0' encoding='UTF-8'?>\n"
  xml += "<gpx version='1.1' xmlns='http://www.topografix.com/GPX/1/1' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'>\n"
  xml += "\t<metadata>\n"
  xml += `\t\t<name>${name}</name>\n`
  xml += "\t</metadata>\n"
  xml += "\t<trk>\n"
  xml += `\t\t<name>${name}</name>\n`

  for (const stage of json.geometry.coordinates) {
    xml += "\t\t<trkseg>\n"

    for (const point of stage) {
      const lat = point[0]
      const lon = point[1]

      xml += `\t\t\t<trkpt lat='${lat}' lon='${lon}'></trkpt>\n`
    }

    xml += "\t\t</trkseg>\n"
  }

  xml += "\t</trk>\n"
  xml += "</gpx>"

  return xml
}

function readInt(field) {
  const value = document.getElementById(field).value

  return value ? parseInt(value) : undefined
}