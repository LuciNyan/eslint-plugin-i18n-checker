const fs = require('fs');
const dotty = require("dotty");
const { listen, reportErrors, getConfig } = require('./utils')

module.exports = {
  meta: {
    docs: {
      description: "Check i18n keys exists in json files",
      category: "i18n check",
      recommended: true,
    },
    fixable: null,  // or "code" or "whitespace"
    schema: [
      {
        type: 'object',
        properties: {
          functionNames: {
            "type": "array",
            "items": {
              "type": "string"
            },
          },
          localesPath: {
            "type": "string"
          }
        }
      }
    ],
  },

  create: function(context) {
    const config = getConfig(context)
    const { functionNames = [], localesPath = 'locales/', specifics } = config

    const callback = getCallback(context, localesPath, specifics)

    const result = {}

    listen(result, functionNames, callback)

    return result
  },
};

function getCallback(context, localesPath, specifics) {
  const checker = specifics
    ? new SpecificChecker({ localesPath, specifics })
    : new NormalChecker({ localesPath })

  function callback(node) {
    const firstArgumentNode = node.arguments[0]

    const errors = []

    if (firstArgumentNode.type === 'Literal') {
      const key = firstArgumentNode.value
      errors.push(...checker.checkKeyExists(key))
    }

    reportErrors(context, firstArgumentNode, errors)
  }

  return callback
}


class NormalChecker {

  constructor(props) {
    const { localesPath } = props
    this.localesPath = localesPath
  }

  checkKeyExists(key) {
    let errors = []

    const locales = NormalChecker.getLocales(this.localesPath)

    locales.forEach((localeFile) => {
      errors = [...errors, ...this.checkKeyExistsInJSON(localeFile, key)];
    });

    return errors;
  }

  checkKeyExistsInJSON(locale, key) {
    if(!locale.data.hasOwnProperty(key) && !dotty.exists(locale.data, key)) {
      const path = `${this.localesPath}/${locale.name}`
      const fullPath = `${process.cwd()}/${path}`
      deleteRequireCache(fullPath)
      return [{
        message: "Missing key: {{key}} in JSON: {{jsonPath}}",
        data: {
          key: key,
          jsonPath: path,
        },
      }];
    }

    return [];
  }

  static getLocales(localesPath) {
    const locales = [];
    const localesFullPath = `${process.cwd()}/${localesPath}`;
    const localesFiles = fs.readdirSync(localesFullPath).map(file => file);

    localesFiles.forEach((localeFile) => {
      locales.push({
        name: localeFile,
        data: require(`${localesFullPath}/${localeFile}`),
      });
    });

    return locales;
  }
}


class SpecificChecker {

  constructor(props) {
    const { localesPath, specifics } = props
    this.specifics = specifics
    this.localesPath = localesPath
  }

  checkKeyExists(key) {
    let errors = []

    const locales = SpecificChecker.getLocales(this.localesPath)

    locales.forEach((locale) => {
      errors = [...errors, ...this.checkKeyExistsInJSON(locale, key)];
    });

    return errors;
  }

  checkKeyExistsInJSON(locale, key) {
    const specific = this.specifics.find(specific => new RegExp(specific.matcher).test(key))
    if (!specific) {
      return []
    }

    const regex = key.match(new RegExp(specific.matcher))
    const jsonName = regex[1]

    if (!jsonName) {
      return []
    }

    const jsonObj = locale.data[specific.to]

    if (!jsonObj) {
      return []
    }

    if(!jsonObj.hasOwnProperty(jsonName) && !dotty.exists(jsonObj, jsonName)) {
      const path = `${this.localesPath}/${locale.name}/${specific.to}`
      const fullPath = `${process.cwd()}/${path}`
      deleteRequireCache(fullPath)
      return [{
        message: "Missing key: {{key}} in JSON: {{jsonPath}}",
        data: {
          key: key,
          jsonPath: path,
        },
      }];
    }

    return [];
  }

  static getLocales(localesPath) {
    const locales = [];
    const localesFullPath = `${process.cwd()}/${localesPath}`;
    const localesDirs = fs.readdirSync(localesFullPath).map(dir => dir);

    localesDirs.forEach((dir) => {
      const jsons = fs.readdirSync(`${localesFullPath}/${dir}`).map(json => json);
      const fileDic = {}
      jsons.forEach(json => {
        fileDic[json] = require(`${localesFullPath}/${dir}/${json}`)
      })
      locales.push({
        name: dir,
        data: fileDic
      })
    });

    return locales;
  }
}

/**
 * 1. ????????????????????? require cache ???
 * ?????????????????? yarn eslint ????????????????????????????????????????????? idea ????????????
 * ?????????????????? lint ?????????????????? locales ?????? *.json ??????
 * ????????????????????????????????????????????? json ????????????????????????????????????????????????
 *
 * 2. ??????????????????????????????????????? ???
 * ???????????????????????????????????? idea ?????????????????????????????????????????? lint ??????
 * ???????????????????????????????????????????????????????????? json ???????????????????????????????????????????????????
 * ?????? idea ???????????? 100ms ??????????????????????????????
 */
const memo = {}

function deleteRequireCache(path) {
  if (memo[path]) {
    clearTimeout(memo[path])
  }

  memo[path] = setTimeout(() => {
    delete require.cache[path]
  }, 100)
}

