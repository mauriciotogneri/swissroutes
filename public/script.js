'use strict'

let map = undefined
let openedInfoWindow = undefined
let markersAdded = []
let pathsAdded = []
let currentGallery = []
let currentGalleryIndex = 0
let currentJson = undefined
let summary = undefined

const COLORS = ['#e81123', '#ff8c00', '#ec008c', '#68217a', '#00188f', '#00bcf2', '#00b294', '#009e49']

function mapLoaded() {
  summary = document.getElementById('summary')

  const mapOptions = {
    zoom: 9,
    center: {
      lat: 46.75,
      lng: 8.10,
    },
    mapId: "DEMO_MAP_ID",
  }

  map = new google.maps.Map(document.getElementById('map'), mapOptions)
  refresh()
}

function refresh() {
  summary.innerHTML = ''

  for (let marker of markersAdded) {
    marker.setMap(null)
  }

  for (let path of pathsAdded) {
    path.setMap(null)
  }

  refreshMountainBiking()
  refreshCycling()
  refreshHiking()
  refreshMountainHike()

  refreshAccommodation()
  refreshOther()

  if (PARAM_URL && PARAM_TYPE) {
    if (['mountainbiking', 'cycling', 'hiking'].includes(PARAM_TYPE)) {
      loadRoute(PARAM_TYPE, PARAM_URL, true)
    } else if (['camping', 'backpack', 'bed', 'agriculture', 'night_shelter', 'gite', 'house', 'hotel', 'build', 'visibility'].includes(PARAM_TYPE)) {
      loadPoint(PARAM_TYPE, PARAM_URL, true)
    } else if (['mountainhike'].includes(PARAM_TYPE)) {
      loadMountainHike(PARAM_URL, true)
    }
    PARAM_TYPE = undefined
    PARAM_URL = undefined
  }
}

function refreshMountainBiking() {
  const filter = document.getElementById('filterMountainBiking')
  const nationalChecked = document.getElementById('checkboxMountainBikingNational').checked
  const regionalChecked = document.getElementById('checkboxMountainBikingRegional').checked
  const localChecked = document.getElementById('checkboxMountainBikingLocal').checked

  if (nationalChecked || regionalChecked || localChecked) {
    filter.style.display = 'block'

    const lengthMin = readInt('filterMountainBikingLengthMin')
    const lengthMax = readInt('filterMountainBikingLengthMax')

    const heightMin = readInt('filterMountainBikingHeightMin')
    const heightMax = readInt('filterMountainBikingHeightMax')

    showSummary('Mountain biking', nationalChecked, regionalChecked, localChecked, lengthMin, lengthMax, heightMin, heightMax)

    if (nationalChecked) {
      for (const id of MOUNTAINBIKING_NATIONAL_IDS) {
        loadRoute('mountainbiking', `mountainbiking/national/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }

    if (regionalChecked) {
      for (const id of MOUNTAINBIKING_REGIONAL_IDS) {
        loadRoute('mountainbiking', `mountainbiking/regional/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }

    if (localChecked) {
      for (const id of MOUNTAINBIKING_LOCAL_IDS) {
        loadRoute('mountainbiking', `mountainbiking/local/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }
  } else {
    filter.style.display = 'none'
  }
}

function refreshCycling() {
  const filter = document.getElementById('filterCycling')
  const nationalChecked = document.getElementById('checkboxCyclingNational').checked
  const regionalChecked = document.getElementById('checkboxCyclingRegional').checked
  const localChecked = document.getElementById('checkboxCyclingLocal').checked

  if (nationalChecked || regionalChecked || localChecked) {
    filter.style.display = 'block'

    const lengthMin = readInt('filterCyclingLengthMin')
    const lengthMax = readInt('filterCyclingLengthMax')

    const heightMin = readInt('filterCyclingHeightMin')
    const heightMax = readInt('filterCyclingHeightMax')

    showSummary('Cycling', nationalChecked, regionalChecked, localChecked, lengthMin, lengthMax, heightMin, heightMax)

    if (nationalChecked) {
      for (const id of CYCLING_NATIONAL_IDS) {
        loadRoute('cycling', `cycling/national/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }

    if (regionalChecked) {
      for (const id of CYCLING_REGIONAL_IDS) {
        loadRoute('cycling', `cycling/regional/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }

    if (localChecked) {
      for (const id of CYCLING_LOCAL_IDS) {
        loadRoute('cycling', `cycling/local/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }
  } else {
    filter.style.display = 'none'
  }
}

function refreshHiking() {
  const filter = document.getElementById('filterHiking')
  const nationalChecked = document.getElementById('checkboxHikingNational').checked
  const regionalChecked = document.getElementById('checkboxHikingRegional').checked
  const localChecked = document.getElementById('checkboxHikingLocal').checked

  if (nationalChecked || regionalChecked || localChecked) {
    filter.style.display = 'block'

    const lengthMin = readInt('filterHikingLengthMin')
    const lengthMax = readInt('filterHikingLengthMax')

    const heightMin = readInt('filterHikingHeightMin')
    const heightMax = readInt('filterHikingHeightMax')

    showSummary('Hiking', nationalChecked, regionalChecked, localChecked, lengthMin, lengthMax, heightMin, heightMax)

    if (nationalChecked) {
      for (const id of HIKING_NATIONAL_IDS) {
        loadRoute('hiking', `hiking/national/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }

    if (regionalChecked) {
      for (const id of HIKING_REGIONAL_IDS) {
        loadRoute('hiking', `hiking/regional/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }

    if (localChecked) {
      for (const id of HIKING_LOCAL_IDS) {
        loadRoute('hiking', `hiking/local/${id}.json`, false, lengthMin, lengthMax, heightMin, heightMax)
      }
    }
  } else {
    filter.style.display = 'none'
  }
}

function refreshMountainHike() {
  const filter = document.getElementById('filterMountainHike')
  const mountainHikeChecked = document.getElementById('checkboxMountainHike').checked

  if (mountainHikeChecked) {
    filter.style.display = 'block'

    const difficultyMin = readInt('filterMountainHikeDifficultyMin')
    const difficultyMax = readInt('filterMountainHikeDifficultyMax')

    const heightMin = readInt('filterMountainHikeHeightMin')
    const heightMax = readInt('filterMountainHikeHeightMax')

    summary.innerHTML += `<div style="padding-top:15px"><b>Mountain hike</b><ul>`

    if (difficultyMin || difficultyMax) {
      const lengths = []

      if (difficultyMin) {
        lengths.push(`Min: T${difficultyMin}`)
      }

      if (difficultyMax) {
        lengths.push(`Max: T${difficultyMax}`)
      }

      summary.innerHTML += `<li>Difficulty: ${lengths.join(' / ').trim()}</li>`
    }

    if (heightMin || heightMax) {
      const lengths = []

      if (heightMin) {
        lengths.push(`Min: ${heightMin.toLocaleString()} m`)
      }

      if (heightMax) {
        lengths.push(`Max: ${heightMax.toLocaleString()} m`)
      }

      summary.innerHTML += `<li>Height: ${lengths.join(' / ').trim()}</li>`
    }

    summary.innerHTML += '</ul>'

    if (mountainHikeChecked) {
      for (const id of MOUNTAINHIKE_IDS) {
        loadMountainHike(`other/mountainhike/${id}.json`, false, heightMin, heightMax, difficultyMin, difficultyMax)
      }
    }
  } else {
    filter.style.display = 'none'
  }
}

function refreshAccommodation() {
  const campingChecked = document.getElementById('checkboxAccommodationCamping').checked

  if (campingChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Camping:</b> ${ACCOMMODATION_CAMPING_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_CAMPING_IDS) {
      loadPoint('camping', `accommodation/camping/${id}.json`, false)
    }
  }

  const backpackerChecked = document.getElementById('checkboxAccommodationBackpacker').checked

  if (backpackerChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Backpacking:</b> ${ACCOMMODATION_BACKPACKER_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_BACKPACKER_IDS) {
      loadPoint('backpack', `accommodation/backpacker/${id}.json`, false)
    }
  }

  const sleepingStrawChecked = document.getElementById('checkboxAccommodationSleepingStraw').checked

  if (sleepingStrawChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Sleeping straw:</b> ${ACCOMMODATION_SLEEPINGSTRAW_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_SLEEPINGSTRAW_IDS) {
      loadPoint('bed', `accommodation/sleepingstraw/${id}.json`, false)
    }
  }

  const farmChecked = document.getElementById('checkboxAccommodationFarm').checked

  if (farmChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Farm:</b> ${ACCOMMODATION_FARM_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_FARM_IDS) {
      loadPoint('agriculture', `accommodation/farm/${id}.json`, false)
    }
  }

  const mountainHutChecked = document.getElementById('checkboxAccommodationMountainHut').checked

  if (mountainHutChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Mountain hut:</b> ${ACCOMMODATION_MOUNTAINHUT_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_MOUNTAINHUT_IDS) {
      loadPoint('night_shelter', `accommodation/mountainhut/${id}.json`, false)
    }
  }

  const hostelChecked = document.getElementById('checkboxAccommodationHostel').checked

  if (hostelChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Hostels:</b> ${ACCOMMODATION_HOSTEL_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_HOSTEL_IDS) {
      loadPoint('gite', `accommodation/hostels/${id}.json`, false)
    }
  }

  const bnbChecked = document.getElementById('checkboxAccommodationBnb').checked

  if (bnbChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Bnb:</b> ${ACCOMMODATION_BNB_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_BNB_IDS) {
      loadPoint('hotel', `accommodation/bnb/${id}.json`, false)
    }
  }

  const groupHouseChecked = document.getElementById('checkboxAccommodationGroupHouse').checked

  if (groupHouseChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Group house:</b> ${ACCOMMODATION_GROUPHOUSE_IDS.length} locations<br/>`

    for (const id of ACCOMMODATION_GROUPHOUSE_IDS) {
      loadPoint('house', `accommodation/grouphouse/${id}.json`, false)
    }
  }
}

function refreshOther() {
  const serviceShopChecked = document.getElementById('checkboxOtherServiceShop').checked

  if (serviceShopChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Service shop</b><br/>`

    for (const id of OTHER_SERVICESHOP_IDS) {
      loadPoint('build', `other/serviceshop/${id}.json`, false)
    }
  }

  const sightseeingChecked = document.getElementById('checkboxOtherSightseeing').checked

  if (sightseeingChecked) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Sightseeing</b><br/>`

    for (const id of OTHER_SIGHTSEEING_IDS) {
      loadPoint('visibility', `other/sightseeing/${id}.json`, false)
    }
  }

  const checkboxOtherChargingStations = document.getElementById('checkboxOtherChargingStations').checked

  if (checkboxOtherChargingStations) {
    summary.innerHTML += `<div style="padding-top:15px"><b>Charging stations</b><br/>`

    loadChargingStations(`other/chargingstations/chargingstations.json`)
  }
}

function loadRoute(type, url, focus, lengthMin, lengthMax, heightMin, heightMax) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const json = JSON.parse(xhttp.responseText)
      showRoute(type, url, json, focus, lengthMin, lengthMax, heightMin, heightMax)
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function loadPoint(icon, url, focus) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const json = JSON.parse(xhttp.responseText)
      showPoint(url, icon, json, focus)
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function loadMountainHike(url, focus, heightMin, heightMax, difficultyMin, difficultyMax) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const json = JSON.parse(xhttp.responseText)
      showMountainHike(url, json, focus, heightMin, heightMax, difficultyMin, difficultyMax)
    }
  }
  xhttp.open('GET', `data/${url}`, true)
  xhttp.send()
}

function loadChargingStations(url) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
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

  let content = '<div class="grid-container">'
  content += `<div><img width='25' src='${json.properties.logo}' style='margin-right:10px'/><a href='https://www.schweizmobil.ch/en/${type}-in-switzerland/route-${json.properties.r_number}' target='_blank'>${json.properties.title}</a></div>`
  content += `<div style="text-align:right"><a href='?url=${encodeURIComponent(url)}&type=${type}' target='_blank'><span style="color:#555555;font-size:20px" class="material-symbols-outlined">share</span></a></div>`
  content += `<div style="text-align:right"><span style="cursor:pointer;color:#555555;font-size:20px;margin-right:10px" onclick='download()' class="material-symbols-outlined">download</span></div>`
  content += '</div><br/>'

  content += `<p><b style="font-weight:bold">${json.properties.abstract}</b></p>`
  content += `<p>${json.properties.description}</p>`

  content += `<p><span class="material-symbols-outlined property-icon">conversion_path</span>${length} km (${parseInt(json.properties.length_asphalt * 100 / length)}% asphalted)<br/><br/>`
  content += `<span class="material-symbols-outlined property-icon">north_east</span>${json.properties.height_difference.toLocaleString()} m<br/><br/>`
  content += `<span class="material-symbols-outlined property-icon">south_east</span>${json.properties.height_difference_back.toLocaleString()} m</p>`

  if (galleryList.length > 0) {
    content += gallerySection(galleryList, json)
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  const firstStage = stages[0]
  const start = point(firstStage[0][0], firstStage[0][1])

  const markerStart = showMarker(start.lat, start.lng, infowindow, json.properties.r_number, undefined, json, galleryList)
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

function showPoint(url, icon, json, focus) {
  const name = json.properties.title ? json.properties.title : json.properties.name
  const isBasic = json.properties.city !== undefined

  let baseLink = ''

  if (icon === 'build') {
    baseLink = 'https://schweizmobil.ch/en/cycle-service-'
  } else if (icon === 'visibility') {
    baseLink = 'https://schweizmobil.ch/en/place-of-interest-'
  } else if (!isBasic) {
    baseLink = 'https://schweizmobil.ch/en/accommodation-'
  }

  let content = '<div class="grid-container">'

  if (baseLink) {
    content += `<a href="${baseLink}${json.id}" target="_blank">${name}</a>`
  } else {
    content += `<a href="https://www.google.com/maps/search/${name} ${json.properties.city}" target="_blank">${name}</a>`
  }

  content += '<div></div>'
  content += `<div style="text-align:right"><a href='?url=${encodeURIComponent(url)}&type=${icon}' target='_blank'><span style="color:#555555;font-size:20px" class="material-symbols-outlined">share</span></a></div>`

  if (isBasic) {
    content += `<a href="https://www.google.com/maps/place/${json.geometry.coordinates[0]},${json.geometry.coordinates[1]}" target="_blank">Address</a>`
  }

  content += '</div><br/>'

  if (json.properties.abstract) {
    content += `<p style="font-weight:bold">${json.properties.abstract}</p>`
  }

  if (json.properties.description) {
    content += `<p>${json.properties.description}</p>`
  }

  if (json.properties.tel) {
    content += `<p><span class="material-symbols-outlined property-icon">call</span>${json.properties.tel}</p>`
  }

  if (json.properties.email) {
    content += `<p><span class="material-symbols-outlined property-icon">mail</span>${json.properties.email}</p>`
  }

  if (json.properties.street) {
    const address = `${json.properties.street}, ${json.properties.zip} ${json.properties.place}`
    content += `<span class="material-symbols-outlined property-icon">location_on</span><a href='https://www.google.com/maps/search/${address}' target='_blank'>${address}</a><br/><br/>`
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
    content += `<span class="material-symbols-outlined property-icon">link</span><a href='${url}' target='_blank'>${url}</a><br/><br/>`
  })

  const galleryList = getGallery(json)

  if (galleryList.length > 0) {
    content += gallerySection(galleryList, json)
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, undefined, icon, json, galleryList)

  if (focus) {
    const gap = 0.1
    const bounds = {
      north: json.geometry.coordinates[0] + gap,
      south: json.geometry.coordinates[0] - gap,
      east: json.geometry.coordinates[1] + gap,
      west: json.geometry.coordinates[1] - gap,
    }

    map.fitBounds(bounds)
  }
}

function showMountainHike(url, json, focus, heightMin, heightMax, difficultyMin, difficultyMax) {
  const height = parseInt(json.properties.ascent_altitude)
  const difficulty = parseInt(json.properties.mountain_hiking_difficulty.replace('T', '').replace('+', '').replace('-', ''))

  if (heightMin && (height < heightMin)) {
    return
  }

  if (heightMax && (height > heightMax)) {
    return
  }

  if (difficultyMin && (difficulty < difficultyMin)) {
    return
  }

  if (difficultyMax && (difficulty > difficultyMax)) {
    return
  }

  let content = '<div class="grid-container">'
  content += `<a href='https://www.sac-cas.ch/en/huts-and-tours/sac-route-portal/${json.properties.sac_poi_id}/mountain_hiking' target='_blank'>${json.properties.title} - ${json.properties.poi_title}</a>`
  content += '<div></div>'
  content += `<div style="text-align:right"><a href='?url=${encodeURIComponent(url)}&type=mountainhike' target='_blank'><span style="color:#555555;font-size:20px" class="material-symbols-outlined">share</span></a></div>`
  content += '</div><br/>'

  if (json.properties.abstract) {
    content += `<p>${json.properties.abstract}</p>`
  }

  if (json.properties.mountain_hiking_difficulty) {
    let label = ''

    if (difficulty === 1) {
      label = 'Hiking'
    } else if (difficulty === 2) {
      label = 'Mountain Hiking'
    } else if (difficulty === 3) {
      label = 'Difficult Mountain Hiking'
    } else if (difficulty === 4) {
      label = 'Alpine Hiking'
    } else if (difficulty === 5) {
      label = 'Difficult Alpine Hiking'
    } else if (difficulty === 6) {
      label = 'Very Difficult Alpine Hiking'
    }

    content += `<span class="material-symbols-outlined property-icon">landscape</span>${json.properties.mountain_hiking_difficulty} (<a href='https://www.sac-cas.ch/fileadmin/Ausbildung_und_Wissen/Sicher_unterwegs/Sicher_unterwegs_Wandern/2020_Berg_Alpinwanderskala_EN.pdf' target='_blank'>${label}</a>)<br/><br/>`
  }

  if (json.properties.ascent_altitude) {
    content += `<span class="material-symbols-outlined property-icon">north_east</span>${json.properties.ascent_altitude.toLocaleString()} m<br/><br/>`
  }

  if (json.properties.descent_altitude) {
    content += `<span class="material-symbols-outlined property-icon">south_east</span>${json.properties.descent_altitude.toLocaleString()} m<br/><br/>`
  }

  const galleryList = getGallery(json)

  if (galleryList.length > 0) {
    content += `<br/>${gallerySection(galleryList, json)}`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  const marker = showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, undefined, 'landscape', json, galleryList)
  const color = nameToRGB(json.properties.title)

  for (const segment of json.segments) {
    const pathCoordinates = []
    const segmentCoordinates = segment.geom?.coordinates

    if (segmentCoordinates) {
      for (let i = 0; i < segmentCoordinates.length; i++) {
        const newPoint = point(segmentCoordinates[i][0], segmentCoordinates[i][1])
        pathCoordinates.push(newPoint)
      }

      const path = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 3
      })

      path.addListener('click', () => {
        if (openedInfoWindow) {
          openedInfoWindow.close()
        }

        infowindow.open(map, marker)
        openedInfoWindow = infowindow

        currentGallery = galleryList
        currentGalleryIndex = 0
        currentJson = json
      })

      path.setMap(map)
      pathsAdded.push(path)
    }
  }

  if (focus) {
    const gap = 0.03
    const bounds = {
      north: json.geometry.coordinates[0] + gap,
      south: json.geometry.coordinates[0] - gap,
      east: json.geometry.coordinates[1] + gap,
      west: json.geometry.coordinates[1] - gap,
    }

    map.fitBounds(bounds)
  }
}

function showChargingStations(json) {
  const coordinates = json.Point.coordinates.split(',')
  const latitude = parseFloat(coordinates[1])
  const longitude = parseFloat(coordinates[0])

  if ((latitude >= 46.128503) && (latitude <= 47.858446) && (longitude >= 5.923137) && (longitude <= 10.583217)) {
    const name = typeof json.name === 'string' ? json.name : json.name['__cdata']
    let content = `<b style="font-weight:bold">${name}</b><br/><br/>`

    if (json.description) {
      content += `<p>${json.description.__cdata}</p>`
    }

    content += `<a href='https://www.google.com/maps/place/${latitude},${longitude}' target='_blank'>Address</a><br/><br/>`

    const infowindow = new google.maps.InfoWindow({
      content: content
    })

    showMarker(latitude, longitude, infowindow, undefined, 'bolt', json)
  }
}

function getGallery(json) {
  const photoGalleryBig = filterEmptyImages(json.properties.photo_gallery_big)
  const photoGalleryMaster = filterEmptyImages(json.properties.photo_gallery_master)
  const photoGallery = filterEmptyImages(json.properties.photo_gallery)
  const photoGallerySmall = filterEmptyImages(json.properties.photo_gallery_small)
  const sacPhotos = json.properties.sac_photos?.map((e) => e.photo_big ?? e.photo_master ?? e.photo_sac_original ?? e.photo_standard ?? e.photo_small) ?? []
  const foto = json.properties.foto ? [json.properties.foto] : []

  const candidates = [
    photoGalleryBig,
    photoGalleryMaster,
    photoGallery,
    photoGallerySmall,
    sacPhotos,
    foto,
  ]

  const lengths = [
    photoGalleryBig.length,
    photoGalleryMaster.length,
    photoGallery.length,
    photoGallerySmall.length,
    sacPhotos.length,
    foto.length,
  ]

  const maxLength = Math.max(...lengths)

  if (maxLength > 0) {
    return candidates.filter((e) => e.length === maxLength)[0]
  } else {
    return []
  }
}

function filterEmptyImages(list) {
  const result = []

  if (list) {
    for (const element of list) {
      if (element && (element.trim().length > 0)) {
        result.push(element.trim())
      }
    }
  }

  return result
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

function showMarker(lat, lon, infowindow, text, icon, json, gallery) {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    map: map,
    position: {
      lat: lat,
      lng: lon,
    },
    content: text ? getMarkerText(text) : getMarkerIcon(icon),
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

function getMarkerText(text) {
  const content = document.createElement('div')
  content.className = 'marker-tag'
  content.style.fontWeight = 'bold'
  content.textContent = text

  return content
}

function getMarkerIcon(icon) {
  const content = document.createElement('span')
  content.className = 'material-symbols-outlined marker-tag'
  content.style.paddingLeft = '7px'
  content.style.fontSize = '18px'
  content.textContent = icon

  return content
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

  return COLORS[hash % COLORS.length]
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

function gallerySection(galleryList, json) {
  let content = '<center>'

  if (galleryList.length > 1) {
    content += `<a class='prev' onclick='plusSlides(-1, ${json.properties.r_number})'>&#10094;</a>`
  }

  content += `<img id='gallery-${json.properties.r_number}' height='300' src='${galleryList[0]}'/>`

  if (galleryList.length > 1) {
    content += `<a class='next' onclick='plusSlides(1, ${json.properties.r_number})'>&#10095;</a>`
  }

  content += `<br/><br/><span><b id='index-${json.properties.r_number}'>1/${galleryList.length}</b></span><br/></center>`

  return content
}

function showSummary(type, nationalChecked, regionalChecked, localChecked, lengthMin, lengthMax, heightMin, heightMax) {
  summary.innerHTML += `<div style="padding-top:15px"></div><b>${type}</b><ul>`
  const types = []

  if (nationalChecked) {
    types.push('National')
  }

  if (regionalChecked) {
    types.push('Regional')
  }

  if (localChecked) {
    types.push('Local')
  }

  summary.innerHTML += `<li>Type: ${types.join(' / ').trim()}</li>`

  if (lengthMin || lengthMax) {
    const lengths = []

    if (lengthMin) {
      lengths.push(`Min: ${lengthMin.toLocaleString()} km`)
    }

    if (lengthMax) {
      lengths.push(`Max: ${lengthMax.toLocaleString()} km`)
    }

    summary.innerHTML += `<li>Length: ${lengths.join(' / ').trim()}</li>`
  }

  if (heightMin || heightMax) {
    const lengths = []

    if (heightMin) {
      lengths.push(`Min: ${heightMin.toLocaleString()} m`)
    }

    if (heightMax) {
      lengths.push(`Max: ${heightMax.toLocaleString()} m`)
    }

    summary.innerHTML += `<li>Height: ${lengths.join(' / ').trim()}</li>`
  }

  summary.innerHTML += '</ul>'
}