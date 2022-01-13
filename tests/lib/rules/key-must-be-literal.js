const { RuleTester } = require('eslint');
const rule = require('../../../lib/rules/key-must-be-literal');

const ruleTester = new RuleTester();

const tests = {

  valid: [
    { code: "t('name');" },
    { code: "i18n.t('a.b.c');" },
    { code: "i18n.t('d.e.f');" },
  ],

  invalid: [
    {
      code: "i18n.t(str);",
      errors: [
        {message: 'i18n key must be literal'},
      ],
    },
    {
      code: "i18n.t('ss' + obj);",
      errors: [
        {message: 'i18n key must be literal'},
      ],
    },
    {
      code: 'i18n.t(`s`);',
      errors: [
        {message: 'i18n key must be literal'},
      ],
      parserOptions: { ecmaVersion: 6 },
    },
  ],
};


const config = {
  options: [
    {
      functionNames: [
        'i18n.t',
        't'
      ],
    }
  ],
};

tests.valid.forEach(t => Object.assign(t, config));
tests.invalid.forEach(t => Object.assign(t, config));

ruleTester.run("key-must-be-literal", rule, tests);
