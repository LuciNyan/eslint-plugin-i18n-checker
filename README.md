# eslint-plugin-i18n-checker

Check i18n 

## Installation

You"ll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-i18n-checker`:

```sh
npm install eslint-plugin-i18n-checker --save-dev
```

## Usage

Add `i18n-checker` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "i18n-checker"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
      "i18n-checker/json-key-exists": [
        2,
        {
          "functionNames": [
            "i18n.t",
            "t"
          ],
          "localesPath": "public/locales",
          "specifics": [
            {
              "matcher": "^global:(.*)$",
              "to": "global.json"
            },
            {
              "matcher": "^(.*)$",
              "to": "app.json"
            }
          ]
        }
      ]
    }
}
```

## Supported Rules

* Fill in provided rules here


# eslint-plugin-i18n-checker
