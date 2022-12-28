const fs = require('fs')
const path = require('path')
const request = require("request")

init()
async function init() {
  // https://salsa.debian.org/iso-codes-team/iso-codes/-/blob/main/iso_3166-2/zh_CN.po
  // zh_CN 的翻譯有63.2% 先用殘體轉正體
  // https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-2/zh_CN.po

  // getUrlData(url).then(data => {
  // 台灣是自主獨立的國家!

  const countriesType = ['zh_TW', 'ja']
  // https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/data/iso_3166-1.json
  // 
  // https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-1/zh_TW.po
  // https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-1/ja.po
  let countries = {}
  const promises_countries = [
    getFileContent('./data/iso3166-1/iso_3166-1.json'),
    //
    getFileContent('./data/iso3166-1/zh_TW.po'),
    getFileContent('./data/iso3166-1/ja.po'),
  ]
  await Promise.all(promises_countries).then(data => {
    // iso3166-1.json

    const iso3166_1 = JSON.parse(data[0].result)['3166-1']
    for (const v in iso3166_1) {
      const c = iso3166_1[v]
      // iso3166-2 用的name 是 alpha3，
      // 所以先用 alpha3 當 key，再轉回 alpha2
      if (!countries[c.alpha_3]) {
        // bug fix~台灣是自主獨立的國家!
        if (c.alpha_3 === 'TWN') {
          c.name = c.official_name = c.name.replace(', Province of China', '').replace('中国領・', '')
        }
        countries[c.alpha_3] = {
          // numeric: c.numeric,
          // official_name: c.official_name,
          alpha_2: c.alpha_2,
          alpha_3: c.alpha_3,
          name: {
            msgid: c.name
          }
        }
      }
    }

    for (let i = 1; i < data.length; i++) {
      setIso3166_1(countries, data[i], countriesType[i - 1])
    }
  })

  // 前面所以先用 alpha3 當 key，這邊轉回 alpha2
  for (const v in countries) {
    const c = countries[v]
    countries[c.alpha_2] = {
      name: c.name
    }
    delete countries[v]
  }

  const citiesType = ['zh_TW', 'en', 'ja']
  // const url = 'https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-2/zh_CN.po'
  // const url = 'https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-2/en.po'
  // const url = 'https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-2/ja.po'
  let cities = {}
  const promises_cities = [
    getFileContent('./data/iso3166-2/zh_CN.po'),//用word直翻繁體
    getFileContent('./data/iso3166-2/en.po'),
    getFileContent('./data/iso3166-2/ja.po'),
  ]
  await Promise.all(promises_cities).then(data => {
    data.forEach((v, i) => {
      setIso3166_2(cities, v, citiesType[i])
    })
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

  const filepath = path.join(__dirname, `dist/iso3166+.json`)
  const filepath_debug = path.join(__dirname, `dist/iso3166+debug.json`)
  exportFile(filepath, JSON.stringify(countries))
  exportFile(filepath_debug, JSON.stringify(countries, null, 2))

  console.log('done')
  // })
}

function setIso3166_1(countries = {}, data, type) {
  const list = data.result.split(/\n|\r\n/g)
  for (let i = 0; i < list.length; i++) {
    const v = list[i]
    if (v.indexOf('#. Name for ') === 0) {
      const code = v.split(' ').reverse()[0]
      let msgid = list[i + 1].split('msgid ').reverse()[0].replace(/"/g, '')
      let str = list[i + 2].split(' ').reverse()[0].replace(/"/g, '')

      if (countries[code]) {
        // bug fix~台灣是自主獨立的國家!
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
  const list = data.result.split(/\n|\r\n/g)
  for (let i = 0; i < list.length; i++) {
    const v = list[i]
    // zh_CN  
    if (v.indexOf('#. Name for ') === 0) {
      const city_code = v.split(' ').reverse()[0]
      // bug fix~台灣是自主獨立的國家!
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

//
function getFileContent(filepath) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, function (err) {
      if (err) {
        console.log('access error:', err)
        resolve({
          status: false,
          error: {
            title: 'access error',
            msg: err.message
          }
        })
      }
      else {
        fs.readFile(filepath, 'utf8', function (err, data) {
          if (err) {
            console.log('readFile error:', err)
            resolve({
              status: false,
              error: {
                title: 'readFile error',
                msg: err.message
              }
            })
          }
          else {
            const render = data.toString()
            resolve({
              status: true,
              result: render
            })
            // res.writeHead(200, {
            //     'Set-Cookie': 'lang=zh-TW',
            //     'Content-Type': 'text/html'
            // })
            // res.write(render)
            // //const $ = cheerio.load(render)
            // //res.write($.html())
          }
        })
      }
    })
  })
}
function exportFile(path_, data) {
  if (!fs.existsSync(path.dirname(path_))) {
    fs.mkdirSync(path.dirname(path_), 0777)
  }

  fs.writeFile(path_, data, 'utf8', function (err) {
    if (err) {
      console.log(`error#${err}`)
    }
    console.log(`exportFile#${path.basename(path_)}`)
  })
}

function getUrlData(url_) {
  return new Promise((resolve, reject) => {
    request({
      url: url_,
      method: 'GET'
    }, function (err, r, data) {
      if (err) {
        console.log(err);
        reject();
      } else {
        resolve(data);
      }
    })
  })
}