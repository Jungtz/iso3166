# iso3166

Codes for the representation of names of countries and their subdivisions

* iso3166-1 Country codes, ex: TW 🇹🇼
* iso3166-2 City codes, ex: TW-TPE
* ~~iso3166-3~~

## Project setup

```
npm run build
```

> 本專案無任何 npm 依賴，直接執行即可。

### Ref

* https://zh.wikipedia.org/wiki/ISO_3166
* https://salsa.debian.org/iso-codes-team/iso-codes/-/tree/main/

### Source

* iso3166-1
  * iso_3166-1.json
  * ja.po
  * zh_TW.po

* iso3166-2
  * en.po
  * ja.po
  * zh_CN.po *翻譯較完整，簡轉繁*

### Export

* [iso3166+.json](https://jungtz.github.io/iso3166/iso3166+.json) - minify
* [iso3166+debug.json](https://jungtz.github.io/iso3166/iso3166+debug.json)

### Output Schema

```jsonc
{
  "TW": {
    "flag": "🇹🇼",
    "name": {
      "msgid": "Taiwan",
      "en": "Taiwan",
      "zh_TW": "中華民國",
      "ja": "台湾"
    },
    "cities": {
      "TW-TPE": {
        "name": { "zh_TW": "臺北市", "en": "Taipei", "ja": "台北" },
        "code": "TW-TPE",
        "msgid": "Taipei"
      }
      // ...
    }
  }
}
```

### History

* :arrow_up: 同步上游資料至 2026-08
* :sparkles: 輸出新增 flag emoji 欄位
* :recycle: 移除 deprecated `request` 套件，改用 `fs.promises`
* :green_heart: GitHub Actions 升級至 Node 22 + actions v4
* :zap: update Taiwan districts
* :bug: TW-CYI 嘉義市
* :bug: KE-30 is "Nairobi City"
* :sparkles: 中華民國台灣是擁有完整主權且獨立自治的國家!