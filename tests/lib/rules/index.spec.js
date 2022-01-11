const { RuleTester } = require('eslint');
const rule = require('../../../lib/rules/json-key-exists');

const ruleTester = new RuleTester();

const tests = {

  valid: [
    { code: "t('name');" },
    { code: "i18n.t('a.b.c');" },
    { code: "i18n.t('d.e.f');" },
    { code: "i18n.t(str);" },
  ],

  invalid: [
    {
      code: "i18n.t('just_in_en');",
      errors: [
        {message: 'Missing key: just_in_en in JSON: /tests/locales/zh.json'},
      ],
    },
    {
      code: "i18n.t('just_in_zh');",
      errors: [
        {message: 'Missing key: just_in_zh in JSON: /tests/locales/en.json'},
      ],
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
      localesPath: '/tests/locales',
    }
  ],
};

tests.valid.forEach(t => Object.assign(t, config));
tests.invalid.forEach(t => Object.assign(t, config));

ruleTester.run("json-key-exists", rule, tests);

const multiJsonConfig = {
  options: [
    {
      functionNames: [
        'i18n.t',
        't'
      ],
      localesPath: '/tests/multi-json-locales',
      specifics: [
        {
          matcher: /^global:(.*)$/,
          to: 'global.json'
        },
        {
          matcher: /^(.*)$/,
          to: 'app.json'
        }
      ]
    }
  ],
};

const multiJsonTest = {

  valid: [
    { code: "t('name');" },
    { code: "i18n.t('a.b.c');" },
    { code: "i18n.t('d.e.f');" },
    { code: "i18n.t(str);" },
    { code: "t('global:name');" },
    { code: "i18n.t('global:a.b.c');" },
    { code: "i18n.t('global:d.e.f');" },
    { code: "i18n.t(str);" },
  ],

  invalid: [
    {
      code: "t('age');",
      errors: [
        {message: 'Missing key: age in JSON: /tests/multi-json-locales/en/app.json'},
        {message: 'Missing key: age in JSON: /tests/multi-json-locales/zh/app.json'},
      ]
    },
    {
      code: "t('global:age');",
      errors: [
        {message: 'Missing key: global:age in JSON: /tests/multi-json-locales/en/global.json'},
        {message: 'Missing key: global:age in JSON: /tests/multi-json-locales/zh/global.json'},
      ]
    },
    {
      code: "i18n.t('global:just_in_en');",
      errors: [
        {message: 'Missing key: global:just_in_en in JSON: /tests/multi-json-locales/zh/global.json'},
      ],
    },
    {
      code: "i18n.t('global:just_in_zh');",
      errors: [
        {message: 'Missing key: global:just_in_zh in JSON: /tests/multi-json-locales/en/global.json'},
      ],
    },
  ],
};

multiJsonTest.valid.forEach(t => Object.assign(t, multiJsonConfig));
multiJsonTest.invalid.forEach(t => Object.assign(t, multiJsonConfig));

ruleTester.run("json-key-exists", rule, multiJsonTest);
