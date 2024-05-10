"use strict"

let map = null
let openedInfoWindow = null
let markersAdded = []
let pathsAdded = []
let currentGallery = []
let currentGalleryIndex = 0

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

  // TODO
  /*if (TYPE_PARAM && URL_PARAM) {
    loadRoute(TYPE_PARAM, URL_PARAM, true)
  }*/
}

function refreshMountainBiking() {
  const nationalChecked = document.getElementById('checkboxMountainBikingNational').checked

  if (nationalChecked) {
    for (const id of MOUNTAINBIKING_NATIONAL_IDS) {
      loadRoute('mountainbiking', `mountainbiking/national/${id}.json`, false)
    }
  }

  const regionalChecked = document.getElementById('checkboxMountainBikingRegional').checked

  if (regionalChecked) {
    for (const id of MOUNTAINBIKING_REGIONAL_IDS) {
      loadRoute('mountainbiking', `mountainbiking/regional/${id}.json`, false)
    }
  }

  const localChecked = document.getElementById('checkboxMountainBikingLocal').checked

  if (localChecked) {
    for (const id of MOUNTAINBIKING_LOCAL_IDS) {
      loadRoute('mountainbiking', `mountainbiking/local/${id}.json`, false)
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

  // https://bike-energy.com/en/where-can-I-load-my-e-bike
  // https://www.google.com/maps/d/u/0/viewer?mid=1wdyB_yGO8FqEWUbD-HJTvpQ-KRY&ll=47.42434950245896%2C9.743405674684965&z=12
  /*const checkboxOtherChargingStations = document.getElementById('checkboxOtherChargingStations').checked

  if (checkboxOtherChargingStations) {
    loadChargingStations(`other/charging_stations/charging_stations.json`)
  }*/
}

function loadRoute(type, url, focus) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const json = JSON.parse(xhttp.responseText)
      showRoute(type, url, json, focus)
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
        const coordinates = entry.Point.coordinates.split(',')
        const lat = coordinates[1]
        const lon = coordinates[0]

        showChargingStations(entry)
      }
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function showRoute(type, url, json, focus) {
  const stages = json.geometry.coordinates

  const galleryList = getGallery(json)

  let content = ''
  content += `<img width='25' src='${json.properties.logo}' style='margin-right:10px'/>`
  content += `<a href='https://www.schweizmobil.ch/en/${type}-in-switzerland/routes/route-0${json.properties.r_number}.html' target='_blank'>${json.properties.title}</a>`
  content += `<span style='position:absolute;left:100%;top:15px;transform:translateX(-150%);'><a href='?url=${encodeURIComponent(url)}&type=${type}' style='margin-right:20px' target='_blank'>SHARE</a><a href='gpx.php?file=${url}' target='_blank'>DOWNLOAD</a></span><br/><br/>`
  content += `<p><b>Length</b>: ${json.properties.length} km (${parseInt(json.properties.length_asphalt * 100 / json.properties.length)}% asphalted)<br/>`
  content += `<b>Height</b>: ${json.properties.height_difference.toLocaleString()} m</p>`
  content += `<p><b>${json.properties.abstract}</b></p>`
  content += `<p>${json.properties.description}</p>`
  content += `<center><a class='prev' onclick='plusSlides(-1, ${json.properties.r_number})'>&#10094;</a>`
  content += `<img id='gallery-${json.properties.r_number}' height='300' src='${galleryList[0]}'/>`
  content += `<a class='next' onclick='plusSlides(1, ${json.properties.r_number})'>&#10095;</a><br/><br/>`
  content += `<span><b id='index-${json.properties.r_number}'>1/${galleryList.length}</b></span><br/></center>`

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  const firstStage = stages[0]
  const start = point(firstStage[0][0], firstStage[0][1])

  const lastStage = stages[stages.length - 1]
  const end = point(lastStage[lastStage.length - 1][0], lastStage[lastStage.length - 1][1])

  const markerText = json.properties.r_number
  const markerStart = showMarker(start.lat, start.lng, infowindow, markerText, galleryList)
  const markerEnd = showMarker(end.lat, end.lng, infowindow, markerText, galleryList)
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

    showPath(path, markerStart, infowindow, color, galleryList, focus)

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
  });

  const galleryList = getGallery(json)

  content += `<center><a class='prev' onclick='plusSlides(-1, ${json.properties.r_number})'>&#10094;</a>`
  content += `<img id='gallery-${json.properties.r_number}' height='300' src='${galleryList[0]}'/>`
  content += `<a class='next' onclick='plusSlides(1, ${json.properties.r_number})'>&#10095;</a><br/><br/>`
  content += `<span><b id='index-${json.properties.r_number}'>1/${galleryList.length}</b></span><br/></center>`

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, label, galleryList)
}

function showMountainHike(json) {
  let content = ''
  content += `<b>${json.properties.title} - ${json.properties.poi_title}</b><br/><br/>`

  if (json.properties.abstract) {
    content += `<p>${json.properties.abstract}</p>`
  }

  if (json.properties.subtitle) {
    content += `<p>${json.properties.subtitle}</p>`
  }

  if (json.properties.ascent_altitude) {
    content += `<p>Altitude: ${json.properties.ascent_altitude.toLocaleString()} m</p>`
  }

  if (json.properties.mountain_hiking_difficulty) {
    content += `<p>Difficulty: ${json.properties.mountain_hiking_difficulty}</p>`
  }

  if (json.properties.sac_photos) {
    content += `<img src='${json.properties.sac_photos[0].photo_big}' width=600/><br/>`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, 'Mountain Hike')
}

function showChargingStations(json) {
  let content = ''
  content += `<b>${json.name}</b><br/><br/>`

  if (json.description) {
    content += `<p>${json.description.__cdata}</p>`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  const coordinates = json.Point.coordinates.split(',')

  showMarker(parseFloat(coordinates[1]), parseFloat(coordinates[0]), infowindow, '+/-')
}

function getGallery(json) {
  let galleryList = []

  if (json.properties.photo_gallery.length > 0) {
    galleryList = json.properties.photo_gallery
  }
  else if (json.properties.photo_gallery_big.length > 0) {
    galleryList = json.properties.photo_gallery_big
  }
  else if (json.properties.photo_gallery_master.length > 0) {
    galleryList = json.properties.photo_gallery_master
  }
  else if (json.properties.photo_gallery_small.length > 0) {
    galleryList = json.properties.photo_gallery_small
  }

  return galleryList
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

function showMarker(lat, lon, infowindow, text, gallery) {
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
    if (openedInfoWindow != null) {
      openedInfoWindow.close()
    }

    infowindow.open(map, marker)
    openedInfoWindow = infowindow

    currentGallery = gallery
    currentGalleryIndex = 0
  })

  markersAdded.push(marker)

  return marker
}

function showPath(coordinates, markerStart, infowindow, color, gallery, focus) {
  const path = new google.maps.Polyline({
    path: coordinates,
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 1,
    strokeWeight: 3
  })

  path.addListener('click', () => {
    if (openedInfoWindow != null) {
      openedInfoWindow.close()
    }

    infowindow.open(map, markerStart)
    openedInfoWindow = infowindow

    currentGallery = gallery
    currentGalleryIndex = 0
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