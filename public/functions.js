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

  console.log(TYPE_PARAM)
  console.log(URL_PARAM)

  if (TYPE_PARAM && URL_PARAM) {
    loadRoute(TYPE_PARAM, URL_PARAM, true)
  }
}

function refreshMountainBiking() {
  const nationalChecked = document.getElementById('checkboxMountainBikingNational').checked
  const nationalIds = [1, 2, 3]

  if (nationalChecked) {
    for (const id of nationalIds) {
      loadRoute('mountainbiking', `mountainbiking/national/${id}.json`, false)
    }
  }

  const regionalChecked = document.getElementById('checkboxMountainBikingRegional').checked
  const regionalIds = [22, 32, 33, 41, 44, 48, 50, 55, 56, 65, 66, 68, 90]

  if (regionalChecked) {
    for (const id of regionalIds) {
      loadRoute('mountainbiking', `mountainbiking/regional/${id}.json`, false)
    }
  }

  const localChecked = document.getElementById('checkboxMountainBikingLocal').checked
  const localIds = [114, 115, 116, 117, 118, 124, 129, 145, 146, 150, 157, 158, 159, 165, 166, 167, 173, 179, 180, 183, 184, 193, 199, 205, 207, 208, 209, 210, 211, 222, 225, 231, 232, 233, 236, 242, 245, 246, 247, 248, 250, 251, 255, 256, 257, 258, 259, 260, 261, 262, 277, 278, 279, 281, 290, 291, 294, 295, 301, 302, 304, 306, 307, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 341, 342, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 383, 384, 387, 388, 389, 390, 391, 392, 393, 394, 397, 399, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 430, 431, 432, 433, 434, 436, 437, 440, 441, 442, 443, 444, 445, 446, 447, 449, 450, 451, 452, 460, 461, 469, 470, 471, 472, 473, 474, 476, 477, 478, 479, 480, 481, 482, 490, 501, 502, 503, 504, 505, 541, 542, 543, 544, 545, 546, 547, 548, 549, 560, 565, 572, 582, 590, 592, 593, 599, 601, 602, 603, 606, 613, 615, 616, 630, 631, 632, 633, 634, 635, 636, 638, 639, 641, 642, 645, 646, 647, 650, 655, 658, 660, 661, 663, 671, 672, 673, 679, 690, 709, 710, 712, 713, 720, 723, 743, 746, 748, 770, 771, 772, 801, 802, 803, 820, 825, 835, 836, 843, 844, 862, 868, 890, 891, 901, 902, 903, 916, 921, 922, 923, 924, 925, 926, 955, 961, 963, 964, 966, 967, 969, 970, 982, 987, 988, 991, 993, 995, 996]

  if (localChecked) {
    for (const id of localIds) {
      loadRoute('mountainbiking', `mountainbiking/local/${id}.json`, false)
    }
  }
}

function refreshCycling() {
  const nationalChecked = document.getElementById('checkboxCyclingNational').checked
  const nationalIds = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  if (nationalChecked) {
    for (const id of nationalIds) {
      loadRoute('cycling', `cycling/national/${id}.json`, false)
    }
  }

  const regionalChecked = document.getElementById('checkboxCyclingRegional').checked
  const regionalIds = [21, 22, 23, 24, 26, 27, 29, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 44, 45, 46, 47, 50, 51, 53, 54, 55, 56, 59, 60, 61, 62, 63, 64, 65, 66, 67, 71, 72, 73, 74, 75, 76, 77, 82, 83, 84, 85, 86, 87, 94, 95, 96, 97, 99]

  if (regionalChecked) {
    for (const id of regionalIds) {
      loadRoute('cycling', `cycling/regional/${id}.json`, false)
    }
  }

  const localChecked = document.getElementById('checkboxCyclingLocal').checked
  const localIds = [104, 111, 112, 113, 120, 140, 150, 171, 172, 205, 210, 222, 250, 252, 299, 311, 348, 360, 361, 362, 380, 381, 399, 412, 472, 473, 475, 476, 478, 480, 481, 487, 488, 499, 501, 505, 555, 599, 624, 647, 699, 701, 702, 703, 751, 752, 753, 777, 801, 802, 888, 890, 899, 908, 921, 922, 923, 979, 998]

  if (localChecked) {
    for (const id of localIds) {
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
  const regionalIds = [22, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 34, 35, 36, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 91, 95, 98, 99]

  if (regionalChecked) {
    for (const id of regionalIds) {
      loadRoute('hiking', `hiking/regional/${id}.json`, false)
    }
  }

  const localChecked = document.getElementById('checkboxHikingLocal').checked
  const localIds = [101, 102, 103, 104, 105, 107, 109, 113, 114, 116, 117, 120, 121, 123, 124, 125, 127, 128, 129, 130, 131, 132, 133, 135, 137, 138, 144, 159, 160, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 223, 224, 225, 261, 262, 263, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 286, 287, 288, 306, 307, 313, 315, 316, 319, 320, 321, 322, 323, 324, 326, 342, 345, 351, 352, 353, 360, 361, 375, 379, 380, 381, 382, 421, 422, 423, 424, 425, 426, 427, 451, 453, 454, 456, 457, 458, 459, 469, 470, 471, 478, 484, 485, 501, 502, 528, 530, 564, 565, 566, 568, 569, 570, 571, 573, 574, 575, 576, 587, 588, 590, 593, 595, 599, 608, 611, 613, 625, 626, 627, 628, 629, 631, 632, 633, 634, 635, 636, 637, 638, 659, 661, 662, 667, 675, 676, 677, 678, 680, 690, 693, 699, 701, 702, 712, 721, 724, 726, 735, 737, 738, 739, 748, 753, 754, 757, 759, 763, 764, 766, 767, 768, 787, 788, 789, 791, 792, 796, 801, 802, 804, 806, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 826, 827, 828, 829, 830, 831, 832, 835, 836, 859, 860, 864, 866, 868, 869, 870, 872, 898, 899, 901, 902, 906, 907, 908, 910, 912, 922, 929, 931, 932, 933, 934, 937, 948, 950, 951, 952, 960, 970, 977, 979, 980, 981, 988, 990, 994, 995, 996, 997, 998, 999]

  if (localChecked) {
    for (const id of localIds) {
      loadRoute('hiking', `hiking/local/${id}.json`, false)
    }
  }
}

function refreshAccommodation() {
  const campingChecked = document.getElementById('checkboxAccommodationCamping').checked
  const campingIds = [18078, 18125, 18154, 18155, 18159, 18164, 18165, 18166, 18200, 18202, 18206, 18207, 18210, 18234, 18298, 18584, 18642, 18668, 18669, 18674, 18710, 20878, 20885, 20961, 20962, 20963, 20964, 20965, 20966, 20967, 20968, 20969, 20970, 20971, 20972, 20975, 20976, 20977, 20978, 20979, 20980, 20981, 20982, 20984, 20985, 20987, 20988, 21850, 21933, 22473, 25503, 26884, 27534, 28231, 28309, 28341, 29684, 29686, 29720, 29873, 31480, 31586, 31674, 32527, 32776, 33046, 33308, 33513, 33923, 33985]

  if (campingChecked) {
    for (const id of campingIds) {
      loadPoint('Camping', 'https://schweizmobil.ch/en/accommodation-', `accommodation/camping/${id}.json`)
    }
  }

  const backpackerChecked = document.getElementById('checkboxAccommodationBackpacker').checked
  const backpackerIds = [18128, 18129, 18140, 18255, 18563, 18607, 18826, 20080, 20958, 20959, 21915, 25953, 26887, 27093, 28776, 29966, 30197, 30320, 30384, 30959, 31181, 31419, 31432, 31646, 31809, 31934, 32140, 32205, 32206, 32286, 32538, 32540, 32541, 32863, 33197, 33224, 33269, 33316, 33932, 33951]

  if (backpackerChecked) {
    for (const id of backpackerIds) {
      loadPoint('Backpacking', 'https://schweizmobil.ch/en/accommodation-', `accommodation/backpacker/${id}.json`)
    }
  }

  const sleepingStrawChecked = document.getElementById('checkboxAccommodationSleepingStraw').checked
  const sleepingStrawIds = [18134, 18587, 18655, 18660, 18670, 18676, 18680, 18695, 19911, 20419, 20425, 20429, 25956, 26161, 29697, 29700, 29736, 29737, 29738, 29751, 29752, 29924, 30014, 30265, 30266, 30755, 31409, 31478, 32530, 32840, 33275, 33500]

  if (sleepingStrawChecked) {
    for (const id of sleepingStrawIds) {
      loadPoint('SleepingStraw', 'https://schweizmobil.ch/en/accommodation-', `accommodation/sleepingstraw/${id}.json`)
    }
  }

  const farmChecked = document.getElementById('checkboxAccommodationFarm').checked
  const farmIds = [18097, 18132, 18235, 18237, 18243, 18610, 18651, 20779, 20905, 26879, 26894, 27113, 27343, 29758, 29867, 29894, 29908, 29954, 29989, 29991, 30211, 30307, 30887, 30907, 31281, 31415, 32111, 32257, 32561, 33079, 33260, 33261, 33262, 33263, 33264, 33506, 33512, 33530]

  if (farmChecked) {
    for (const id of farmIds) {
      loadPoint('Farm', 'https://schweizmobil.ch/en/accommodation-', `accommodation/farm/${id}.json`)
    }
  }

  const mountainHutChecked = document.getElementById('checkboxAccommodationMountainHut').checked
  const mountainHutIds = [21759, 21914, 21942, 21943, 21944, 21945, 21946, 21947, 21948, 21949, 21950, 21951, 22120, 25467, 26336, 26342, 26878, 26882, 26883, 27259, 27699, 27707, 27708, 27712, 27713, 27714, 27715, 27716, 27717, 27718, 27719, 27722, 27723, 27724, 27725, 27726, 27727, 27728, 27729, 27730, 27731, 27732, 27733, 27734, 27735, 27736, 27738, 27739, 27740, 27742, 27743, 27745, 27746, 27747, 27749, 27750, 27752, 27754, 27756, 27757, 27758, 27759, 27760, 27761, 27763, 27764, 27765, 27767, 27768, 27770, 27771, 27773, 27774, 27775, 27776, 27777, 27778, 27779, 27780, 27781, 27782, 27783, 27784, 27785, 27786, 27787, 27788, 27789, 27790, 27791, 27792, 27793, 27794, 27795, 27796, 27797, 27798, 27800, 27801, 27802, 27803, 27804, 27805, 27806, 27807, 27808, 27809, 27811, 27812, 27814, 27815, 27816, 27817, 27818, 27819, 27820, 27822, 30134, 30202, 30477, 30579, 30960, 30961, 30962, 30963, 30964, 30965, 30966, 30967, 30968, 30969, 30970, 30971, 30972, 30973, 30974, 30975, 30976, 30977, 30978, 30979, 30980, 30981, 30982, 30983, 30984, 30985, 30986, 30987, 30988, 30989, 30990, 30991, 30992, 30993, 30994, 30995, 30996, 30997, 30999, 31032, 31159, 31267, 31334, 31404, 31705, 32598, 32599, 32600, 32601, 32602, 32604, 32605, 32606, 32607, 32608, 32609, 32610, 32611, 32612, 32613, 32614, 32615, 32616, 32617, 32618, 32619, 32620, 32621, 32622, 32623, 32624, 32625, 32626, 32627, 32628, 32629, 32630, 32631, 32633, 32634, 32635, 32636, 32638, 32639, 32640, 32641, 32642, 32643, 32644, 32645, 32646, 32647, 32648, 32649, 32650, 32651, 32652, 32653, 32654, 32655, 32656, 32696, 32889, 32891, 32893, 32895, 32896, 32897, 32983, 33118, 33425, 33582, 33600, 33602, 33603, 33604, 33605, 33606, 33607, 33608, 33673]

  if (mountainHutChecked) {
    for (const id of mountainHutIds) {
      loadPoint('Mountain Hut', 'https://schweizmobil.ch/en/accommodation-', `accommodation/mountainhut/${id}.json`)
    }
  }
}

function refreshOther() {
  const serviceShopChecked = document.getElementById('checkboxOtherServiceShop').checked
  const serviceShopIds = [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 117, 118, 120, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 135, 136, 137, 138, 139, 140, 141, 142, 143, 145, 146, 147, 148, 149, 150, 151, 153, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 172, 173, 174, 175, 176, 178, 179, 180, 181, 183, 185, 187, 188, 189, 190, 191, 193, 194, 195, 197, 198, 199, 200, 201, 202, 203, 204, 205, 207, 208, 209, 210, 211, 212, 214, 215, 216, 217, 218, 219, 221, 223, 224, 226, 228, 229, 230, 231, 232, 233, 234, 235, 237, 239, 240, 241, 242, 243, 244, 246, 247, 248, 249, 250, 251, 252, 253, 255, 256, 257, 258, 259, 260, 262, 263, 264, 265, 266, 267, 269, 270, 271, 272, 274, 275, 276, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 289, 290, 291, 292, 294, 295, 297, 298, 300, 301, 302, 303, 304, 305, 306, 307, 308, 312, 313, 314, 315, 316, 317, 319, 320, 321, 322, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 337, 338, 339, 340, 344, 346, 347, 348, 351, 352, 353, 354, 355, 356, 358, 359, 360, 362, 363, 364, 365, 368, 370, 371, 372, 373, 374, 377, 378, 379, 381, 382, 383, 384, 385, 387, 388, 390, 391, 392, 393, 394, 395, 396, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 416, 417, 419, 420, 421, 422, 425, 428, 429, 430, 431, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 458, 459, 460, 461, 462, 463, 464, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 478, 479, 480, 484, 486, 487, 488, 491, 492, 493, 494, 495, 496, 498, 499, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 512, 514, 515, 516, 517, 518, 521, 522, 523, 526, 527, 528, 529, 530, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618]

  if (serviceShopChecked) {
    for (const id of serviceShopIds) {
      loadPoint('Service Shop', 'https://schweizmobil.ch/en/veloservice-', `other/serviceshop/${id}.json`)
    }
  }

  const sightseeingChecked = document.getElementById('checkboxOtherSightseeing').checked
  const sightseeingIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 81, 83, 85, 86, 87, 88, 89, 90, 91, 92, 93, 95, 96, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 133, 134, 135, 136, 137, 138, 140, 141, 142, 144, 145, 147, 148, 149, 151, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 171, 172, 173, 174, 175, 176, 178, 179, 180, 181, 182, 183, 184, 185, 186, 188, 189, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 252, 253, 254, 255, 257, 258, 260, 261, 262, 263, 264, 265, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 315, 316, 320, 321, 322, 323, 324, 325, 328, 329, 332, 333, 335, 336, 337, 339, 341, 342, 343, 344, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 365, 367, 369, 370, 371, 372, 373, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 392, 393, 394, 395, 396, 397, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 420, 421, 422, 423, 427, 440, 442, 443, 444, 445, 446, 447, 448, 449, 451, 452, 454, 455, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 474, 475, 476, 478, 479, 481, 482, 484, 485, 486, 487, 488, 489, 490, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 624, 625, 626, 627, 628, 629, 630, 631, 632, 634, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 663, 664, 666, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 687, 688, 689, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 706, 707, 709, 710, 711, 712, 713, 714, 715, 719, 720, 721, 722, 723, 725, 726, 727, 729, 730, 731, 733, 734, 735, 758, 760, 761, 762, 763, 764, 765, 766, 768, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 783, 784, 786, 787, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 854, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 3258, 3259, 3260, 3261, 3262, 3263, 3264, 3265, 3266, 3267, 3269, 3270, 3271, 3273, 3274, 3275, 3276, 3277, 3278, 3279, 3280, 3282, 3283, 3284, 3285, 3286, 3287, 3288, 3364, 3365, 3367, 3368, 3369, 3370, 3371, 3372, 3373, 3374, 3375, 3376, 3377, 3378, 3379, 3380, 3381, 3382, 3383, 3384, 3385, 3386, 3387, 3388, 3389, 3390, 3391, 3392, 3393, 3394, 3395, 3396, 3397, 3398, 3399, 3400]

  if (sightseeingChecked) {
    for (const id of sightseeingIds) {
      loadPoint('Sightseeing', 'https://schweizmobil.ch/en/place-of-interest-', `other/sightseeing/${id}.json`)
    }
  }

  const mountainChecked = document.getElementById('checkboxOtherMountain').checked
  const mountainIds = [1, 21, 35, 36, 37, 51, 67, 71, 79, 80, 81, 82, 83, 84, 103, 104, 105, 112, 115, 119, 120, 122, 123, 124, 125, 126, 147, 148, 149, 150, 155, 157, 158, 160, 161, 162, 164, 165, 166, 167, 168, 169, 170, 171, 172, 174, 175, 176, 177, 178, 180, 181, 182, 184, 185, 186, 187, 188, 189, 190, 191, 192, 199, 200, 201, 202, 203, 204, 205, 208, 225, 226, 232, 286, 287, 320, 321, 322, 323, 324, 326, 327, 328, 329, 330, 334, 335, 336, 337, 348, 370, 432, 449, 450, 451, 453, 454, 455, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 475, 476, 477, 478, 479, 480, 709, 712, 730, 731, 760, 761, 763, 764, 765, 766, 767, 778, 779, 807, 808, 809, 810, 811, 812, 814, 815, 817, 818, 820, 828, 831, 2324, 2325]

  if (mountainChecked) {
    for (const id of mountainIds) {
      loadMountainHike(`other/mountain/${id}.json`)
    }
  }

  // https://bike-energy.com/en/where-can-I-load-my-e-bike
  // https://www.google.com/maps/d/u/0/viewer?mid=1wdyB_yGO8FqEWUbD-HJTvpQ-KRY&ll=47.42434950245896%2C9.743405674684965&z=12
  const checkboxOtherChargingStations = document.getElementById('checkboxOtherChargingStations').checked

  if (checkboxOtherChargingStations) {
    loadChargingStations(`other/charging_stations/charging_stations.json`)
  }
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
  xhttp.open('GET', url, true)
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
  xhttp.open('GET', url, true)
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
  xhttp.open('GET', url, true)
  xhttp.send()
}

function showRoute(type, url, json, focus) {
  const stages = json.geometry.coordinates

  let galleryList = getGallery(json)

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
  content += `<a href='${baseLink}${json.id}' target='_blank'>${json.properties.name}</a><br/><br/>`

  if (json.properties.street) {
    content += `<p>${json.properties.street}, ${json.properties.zip} ${json.properties.place}</p>`
  }

  if (json.properties.tel) {
    content += `<p>${json.properties.tel}</p>`
  }

  if (json.properties.email) {
    content += `<p>${json.properties.email}</p>`
  }

  if (json.properties.url1_link) {
    content += `<a href='${json.properties.url1_link}' target='_blank'>${json.properties.url1_link}</a><br/><br/>`
  }

  if (json.properties.url2_link) {
    content += `<a href='${json.properties.url2_link}' target='_blank'>${json.properties.url2_link}</a><br/><br/>`
  }

  if (json.properties.foto) {
    content += `<img src='${json.properties.foto}' width=500/><br/>`
  }

  const infowindow = new google.maps.InfoWindow({
    content: content
  })

  showMarker(json.geometry.coordinates[0], json.geometry.coordinates[1], infowindow, label)
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