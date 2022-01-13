const { listen, reportErrors } = require("./utils");
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
          functionNames: {
            "type": "array",
            "items": {
              "type": "string"
            },
          },
        }
      }
    ],
  },

  create: function(context) {
    const { options } = context
    const { functionNames = [] } = options[0]

    const callback = getCallback(context)

    const result = {}

    listen(result, functionNames, callback)

    return result
  },
};

function getCallback(context) {

  function callback(node) {
    const firstArgumentNode = node.arguments[0]

    const errors = []

    if (firstArgumentNode.type !== 'Literal') {

      errors.push({
        message: 'i18n key must be literal'
      })
    }

    reportErrors(context, node, errors)
  }

  return callback
}
