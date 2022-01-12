"use strict";

const fs = require('fs');
const dotty = require("dotty");

const VALID_CALL_EXPRESSION_REGEX = /^[_a-zA-Z][_a-zA-Z0-9]*$/
const VALID_MEMBER_EXPRESSION_REGEX = /^[_a-zA-Z][_a-zA-Z0-9]*\.[_a-zA-Z][_a-zA-Z0-9]*$/


module.exports = {
  meta: {
    docs: {
      description: "Check i18n keys exists in json files",
      // category: "Fill me in",
      recommended: false,
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
    const { options } = context
    const { functionNames = [], localesPath = 'locales/', specifics } = options[0]

    return getResult(context, functionNames, localesPath, specifics)
  },
};

function getResult(context, functionNames, localesPath, specifics) {
  const funcNames = functionNames.filter(name => VALID_CALL_EXPRESSION_REGEX.test(name))
  const memberFuncNames = functionNames.filter(name => VALID_MEMBER_EXPRESSION_REGEX.test(name))

  const callback = getCallback(context, localesPath, specifics)

  const result = {}

  funcNames.forEach(name => {
    result[getFuncSelector(name)] = callback
  })
  memberFuncNames.forEach(name => {
    result[getMemberFuncSelector(name)] = callback
  })

  return result
}

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
      requireCache(fullPath)
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
      requireCache(fullPath)
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


function getFuncSelector(funcName) {

  return `CallExpression[callee.name='${funcName}']`
}

function getMemberFuncSelector(memberFuncName) {
  const [memberName, funcName] = memberFuncName.split('.')

  return `CallExpression[callee.object.name='${memberName}' ]:matches([callee.property.name='${funcName}'])`
}

function reportErrors(context, node, errors) {
  errors.forEach((error) => {
    error.node = node;
    context.report(error);
  });
}


/**
 * 1. 为什么需要清除 require cache ？
 * 在终端中通过 yarn eslint 使用时确实不需要清除，但是当在 idea 中使用时
 * 我们有可能在 lint 报错后去修改 locales 下的 *.json 文件
 * 所以我们必须在报错后清除对应的 json 文件的缓存，当下次校验时重新加载
 *
 * 2. 为什么清除的过程需要做防抖 ？
 * 如果不做防抖的话，当在非 idea 环境下使用时，如果遇到大量的 lint 报错
 * 此时会不停的删除缓存然后再重载，因为此时 json 不可能被修改，所以这些重载毫无意义
 * 而在 idea 中使用时 100ms 的防抖并没有太大影响
 */
const memo = {}

function requireCache(path) {
  if (memo[path]) {
    clearTimeout(memo[path])
  }

  memo[path] = setTimeout(() => {
    delete require.cache[path]
  }, 100)
}

