const { RuleTester } = require('eslint');
const rule = require('../../../lib/rules/no-literal-in-jsx');

const ruleTester = new RuleTester();

const expectedError = {
  message: 'String literal should be wrapped in i18n function before be used in JSX element',
};

const defaultParserOptions = {
  ecmaVersion: 2018,
  ecmaFeatures: {
    experimentalObjectRestSpread: true,
    jsx: true,
  },
};

const tests = {

  valid: [
    { code: '<div />;' },
    { code: '<span />' },
    { code: '<span>{ props.a }</span>' },
    { code: '<span>{ props.isOk ? a : b }</span>' },
    { code: '<span>{ run(props.params) }</span>' },
    { code: '<span>{ run("a") }</span>' },
    { code: '<span role="img" aria-label="Snowman">{ run("a") }</span>' },
    {
      code: `      
        <FakeComponent paddingLeft='6' paddingTop='6' paddingRight='6' direction='column'>
          <FakeComponent paddingBottom='6' alignX='space-between' direction='row' grow width='100%'>
            <FakeComponent gap='3' alignY='center'>
              <FakeComponent
                name='arrow_back_ios'
                size={props.size}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
              />
              <FakeComponent level='1'>{t('whatsapp.whatsapp')}</FakeComponent>
            </FakeComponent>
          </FakeComponent>
        </FakeComponent>`
    },
    { code: '<span>{ "-" }</span>', options: [{ allowList: ['-'] }] },

  ].map(parserOptionsMapper),

  invalid: [
    { code: '<span> Literal: lucinyan </span>', errors: [expectedError] },
    { code: '<span>{ "JSXText: lucinyan" }</span>', errors: [expectedError] },
    { code: '<span>{ "-" }</span>', errors: [expectedError] },
    { code: '<span> - </span>', errors: [expectedError] },

  ].map(parserOptionsMapper),
};

ruleTester.run("no-literal-in-jsx", rule, tests);

function parserOptionsMapper({
  code,
  errors,
  options = [],
  parserOptions = {},
}) {
  return {
    code,
    errors,
    options,
    parserOptions: {
      ...defaultParserOptions,
      ...parserOptions,
    },
  };
}
