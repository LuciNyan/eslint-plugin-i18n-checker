const { reportErrors, getConfig } = require('./utils')

const message = 'String literal should be wrapped in i18n function before be used in JSX element'

const defaultAllowList = [
  '\n',
  ' '
]

module.exports = {
  meta: {
    docs: {
      description: "i18n key must be literal",
      category: "i18n check",
      recommended: false,
    },
    fixable: null,  // or "code" or "whitespace"
    schema: [
      {
        type: 'object',
        properties: {
          allowList: {
            "type": "array",
            "items": {
              "type": "string"
            },
          },
        }
      }
    ],
  },

  create: (context) => {
    const config = getConfig(context)
    const { allowList: propsAllowList = [] } = config
    const allowList = [...defaultAllowList, ...propsAllowList]

    return {
      JSXOpeningElement: (node) => {
        const target = findLiteralFromJSXOpeningElement(node, allowList)

        if (target) {
          const errors = [{
            message
          }]

          reportErrors(context, target, errors)
        }
      },
    }
  },
};

function isLiteral(node) {
  return node.type === 'Literal'
}

function isJSXLiteral(node) {
  return node.type === 'JSXText'
}

function isLiteralUsedDirectlyInJSXExpressionContainer(node) {
  return node.type === 'JSXExpressionContainer' && node.expression.type === 'Literal'
}

function findLiteral(node) {
  if (isLiteral(node) || isJSXLiteral(node)) {
    return node
  }
  if (isLiteralUsedDirectlyInJSXExpressionContainer(node)) {
    return node.expression
  }

  return null
}

function findLiteralFromJSXOpeningElement(node, allowList) {
  for (const child of node.parent.children) {
    const target = findLiteral(child)
    if (target) {
      let value = filterValue(target.value, allowList)
      if (value) {
        return target
      }
    }
  }

  return null
}

function replaceAll(source, str, newStr) {
  return source.replace(new RegExp(str, 'g'), newStr);
}

function filterValue(value, allowList) {
  allowList.forEach(allowStr => {
    value = replaceAll(value, allowStr, '')
  })

  return value
}

