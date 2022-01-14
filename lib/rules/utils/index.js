const VALID_CALL_EXPRESSION_REGEX = /^[_a-zA-Z][_a-zA-Z0-9]*$/
const VALID_MEMBER_EXPRESSION_REGEX = /^[_a-zA-Z][_a-zA-Z0-9]*\.[_a-zA-Z][_a-zA-Z0-9]*$/

function getFuncSelector(funcName) {

  return `CallExpression[callee.name='${funcName}']`
}

function getMemberFuncSelector(memberFuncName) {
  const [memberName, funcName] = memberFuncName.split('.')

  return `CallExpression[callee.object.name='${memberName}' ]:matches([callee.property.name='${funcName}'])`
}

function listen(target, functionNames, callback) {
  const funcNames = functionNames.filter(name => VALID_CALL_EXPRESSION_REGEX.test(name))
  const memberFuncNames = functionNames.filter(name => VALID_MEMBER_EXPRESSION_REGEX.test(name))

  funcNames.forEach(name => {
    target[getFuncSelector(name)] = callback
  })
  memberFuncNames.forEach(name => {
    target[getMemberFuncSelector(name)] = callback
  })

  return target
}

function reportErrors(context, node, errors) {
  errors.forEach((error) => {
    error.node = node;
    context.report(error);
  });
}

function getConfig(context) {
  const { options } = context
  return (options && options[0]) || {}
}

module.exports = {
  listen,
  reportErrors,
  getConfig
}
