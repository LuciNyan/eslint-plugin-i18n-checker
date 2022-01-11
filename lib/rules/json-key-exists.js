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

    reportErrors(context, node, errors)
  }

  return callback
}


class NormalChecker {

  constructor(props) {
    const { localesPath } = props
    this.localesPath = localesPath
    this.locales = NormalChecker.getLocales(localesPath)
  }

  checkKeyExists(key) {
    let errors = []

    this.locales.forEach((localeFile) => {
      errors = [...errors, ...this.checkKeyExistsInJSON(localeFile, key)];
    });

    return errors;
  }

  checkKeyExistsInJSON(locale, key) {
    if(!locale.data.hasOwnProperty(key) && !dotty.exists(locale.data, key)) {
      return [{
        message: "Missing key: {{key}} in JSON: {{jsonPath}}",
        data: {
          key: key,
          jsonPath: `${this.localesPath}/${locale.name}`,
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
    this.locales = SpecificChecker.getLocales(localesPath)
  }

  checkKeyExists(key) {
    let errors = []

    this.locales.forEach((locale) => {
      errors = [...errors, ...this.checkKeyExistsInJSON(locale, key)];
    });

    return errors;
  }

  checkKeyExistsInJSON(locale, key) {
    const specific = this.specifics.find(specific => specific.matcher.test(key))
    if (!specific) {
      return []
    }

    const regex = key.match(specific.matcher)
    const jsonName = regex[1]

    if (!jsonName) {
      return []
    }

    const jsonObj = locale.data[specific.to]

    if (!jsonObj) {
      return []
    }

    if(!jsonObj.hasOwnProperty(jsonName) && !dotty.exists(jsonObj, jsonName)) {
      return [{
        message: "Missing key: {{key}} in JSON: {{jsonPath}}",
        data: {
          key: key,
          jsonPath: `${this.localesPath}/${locale.name}/${specific.to}`,
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


