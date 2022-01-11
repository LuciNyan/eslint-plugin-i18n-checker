const { RuleTester } = require('eslint');
const rule = require('../../../lib/rules/json-key-exists');

const ruleTester = new RuleTester();

const tests = {

  valid: [
    { code: "t('name');" },
    { code: "I18n.t('a.b.c');" },
    { code: "I18n.t('d.e.f');" },
    { code: "I18n.t(str);" },
  ],

  invalid: [
    {
      code: "I18n.t('just_in_en');",
      errors: [
        {message: 'Missing key: just_in_en in JSON: zh.json'},
      ],
    },
    {
      code: "I18n.t('just_in_zh');",
      errors: [
        {message: 'Missing key: just_in_zh in JSON: en.json'},
      ],
    },
  ],
};


const config = {
  options: [
    {
      translationFunctionNames: [
        'I18n.t',
        't'
      ],
      localesPath: '/tests/locales/'
    }
  ],
};

tests.valid.forEach(t => Object.assign(t, config));
tests.invalid.forEach(t => Object.assign(t, config));

ruleTester.run("json-key-exists", rule, tests);
