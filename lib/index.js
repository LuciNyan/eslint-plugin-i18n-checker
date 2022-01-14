/**
 * @fileoverview Check i18n
 * @author Anpu
 */
"use strict";

module.exports.rules = {
  'json-key-exists': require('./rules/json-key-exists'),
  'key-must-be-literal': require('./rules/key-must-be-literal'),
  'no-literal-in-jsx': require('./rules/no-literal-in-jsx'),
}
