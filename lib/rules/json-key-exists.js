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
          translationFunctionNames: {
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
    const { translationFunctionNames = [], localesPath = '/locales/' } = options[0]

    const funcNames = translationFunctionNames.filter(name => VALID_CALL_EXPRESSION_REGEX.test(name))
    const memberFuncNames = translationFunctionNames.filter(name => VALID_MEMBER_EXPRESSION_REGEX.test(name))

    const localeFiles = getLocalesFiles(localesPath)

    const result = {}

    funcNames.forEach(name => {
      result[getFuncSelector(name)] = getCallback(context, localeFiles)
    })
    memberFuncNames.forEach(name => {
      result[getMemberFuncSelector(name)] = getCallback(context, localeFiles)
    })

    return result
  },
};

function getCallback(context, localeFiles) {
  function reportErrors(node, errors) {
    errors.forEach((error) => {
      error.node = node;
      context.report(error);
    });
  }

  return function callback(node) {
    const firstArgumentNode = node.arguments[0]

    const errors = []

    if (firstArgumentNode.type === 'Literal') {
      const key = firstArgumentNode.value
      errors.push(...checkKeyExists(localeFiles, key))
    }

    reportErrors(node, errors)
  }
}

function getFuncSelector(funcName) {

  return `CallExpression[callee.name='${funcName}']`
}

function getMemberFuncSelector(memberFuncName) {
  const [memberName, funcName] = memberFuncName.split('.')
  return `CallExpression[callee.object.name='${memberName}']:matches([callee.property.name='${funcName}'])`
}

function getLocalesFiles(localesPath) {
  const translations = [];
  const localesFullPath = `${process.cwd()}/${localesPath}`;
  const localesFiles = fs.readdirSync(localesFullPath).map(file => file);

  localesFiles.forEach((localeFile) => {
    translations.push({
      name: localeFile,
      data: require(`${localesFullPath}${localeFile}`),
    });
  });

  return translations;
}

function checkKeyExists(localeFiles, key) {
  let errors = []

  localeFiles.forEach((localeFile) => {
    errors = [...errors, ...checkKeyExistsInJSON(localeFile, key)];
  });

  return errors;
}

function checkKeyExistsInJSON(localeFile, key) {
  if(!localeFile.data.hasOwnProperty(key) && !dotty.exists(localeFile.data, key)) {
    return [{
      message: "Missing key: {{key}} in JSON: {{jsonPath}}",
      data: {
        key: key,
        jsonPath: localeFile.name,
      },
    }];
  }

  return [];
}


