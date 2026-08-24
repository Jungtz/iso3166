const fs = require('fs').promises
const path = require('path')

init()

async function init() {
  const countriesType = ['zh_TW', 'ja']
  let countries = {}

  const [iso3166_1_raw, zh_TW_po, ja_po] = await Promise.all([
    fs.readFile('./data/iso3166-1/iso_3166-1.json', 'utf8'),
    fs.readFile('./data/iso3166-1/zh_TW.po', 'utf8'),
    fs.readFile('./data/iso3166-1/ja.po', 'utf8'),
  ])

  // iso3166-1.json
  const iso3166_1 = JSON.parse(iso3166_1_raw)['3166-1']
  for (const c of iso3166_1) {
    // iso3166-2 用的 name 是 alpha3，
    // 所以先用 alpha3 當 key，再轉回 alpha2
    if (!countries[c.alpha_3]) {
      // 台灣是自主獨立的國家!
      if (c.alpha_3 === 'TWN') {
        c.name = c.official_name = c.name.replace(', Province of China', '').replace('中国領・', '')
      }
      countries[c.alpha_3] = {
        alpha_2: c.alpha_2,
        alpha_3: c.alpha_3,
        flag: c.flag,
        name: {
          msgid: c.name
        }
      }
    }
  }

  // .po 翻譯檔
  const poDataList = [zh_TW_po, ja_po]
  for (let i = 0; i < poDataList.length; i++) {
    setIso3166_1(countries, poDataList[i], countriesType[i])
  }

  // 前面先用 alpha3 當 key，這邊轉回 alpha2
  for (const v in countries) {
    const c = countries[v]
    countries[c.alpha_2] = {
      flag: c.flag,
      name: c.name
    }
    delete countries[v]
  }

  const citiesType = ['zh_TW', 'en', 'ja']
  let cities = {}

  const [zh_CN_po, en_po, ja_cities_po] = await Promise.all([
    fs.readFile('./data/iso3166-2/zh_CN.po', 'utf8'), // 用 word 直翻繁體
    fs.readFile('./data/iso3166-2/en.po', 'utf8'),
    fs.readFile('./data/iso3166-2/ja.po', 'utf8'),
  ])

  const citiesPoList = [zh_CN_po, en_po, ja_cities_po]
  citiesPoList.forEach((v, i) => {
    setIso3166_2(cities, v, citiesType[i])
  })

  for (const c in cities) {
    const city = cities[c]

    const name = {}
    citiesType.forEach(v => {
      if (city[v]) {
        name[v] = city[v]
      }
    })

    if (countries[city.code]) {
      if (!countries[city.code].cities) {
        countries[city.code].cities = {}
      }
      countries[city.code].cities[city.city_code] = {
        name,
        code: city.city_code,
        msgid: city.msgid
      }
    }
    else {
      console.log(`${city.code} null`)
    }
  }

  const filepath = path.join(__dirname, 'dist/iso3166+.json')
  const filepath_debug = path.join(__dirname, 'dist/iso3166+debug.json')
  await exportFile(filepath, JSON.stringify(countries))
  await exportFile(filepath_debug, JSON.stringify(countries, null, 2))

  console.log('done')
}

function setIso3166_1(countries = {}, data, type) {
  const list = data.split(/\n|\r\n/g)
  for (let i = 0; i < list.length; i++) {
    const v = list[i]
    if (v.indexOf('#. Name for ') === 0) {
      const code = v.split(' ').reverse()[0]
      let msgid = list[i + 1].split('msgid ').reverse()[0].replace(/"/g, '')
      let str = list[i + 2].split(' ').reverse()[0].replace(/"/g, '')

      if (countries[code]) {
        // 台灣是自主獨立的國家!
        if (code === 'TWN') {
          msgid = msgid.replace(', Province of China', '').replace('中国領・', '')
          str = str.replace(', Province of China', '').replace('中国領・', '')
        }

        if (type !== 'en' && !countries[code].name.en) {
          countries[code].name.en = msgid
        }
        countries[code].name[type] = str
      }

    }
  }
}

function getIndex(list, i) {
  if (list[i].indexOf('#') === 0) {
    i += 1
    return getIndex(list, i)
  }
  return i
}

function setIso3166_2(cities = {}, data, type) {
  const list = data.split(/\n|\r\n/g)
  for (let i = 0; i < list.length; i++) {
    const v = list[i]
    // zh_CN
    if (v.indexOf('#. Name for ') === 0) {
      const city_code = v.split(' ').reverse()[0]
      // 台灣是自主獨立的國家!
      if (city_code === 'CN-TW') {
        continue
      }
      const code = city_code.split('-')[0]

      const ii = getIndex(list, i + 1)

      const msgid = list[ii].split('msgid ').reverse()[0].replace(/"/g, '')
      const str = list[ii + 1].split('msgstr ').reverse()[0].replace(/"/g, '')

      if (!cities[city_code]) {
        cities[city_code] = {
          code,
          city_code,
          msgid
        }
      }
      cities[city_code][type] = str
    }
  }
}

async function exportFile(filepath, data) {
  const dir = path.dirname(filepath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filepath, data, 'utf8')
  console.log(`exportFile#${path.basename(filepath)}`)
}