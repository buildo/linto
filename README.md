# linto 💄
[![npm](https://img.shields.io/npm/v/linto.svg?style=flat-square)]()

A tool to test [ESLint](https://github.com/eslint/eslint) configurations against a set of GitHub repos.

## Installation

```bash
yarn global add linto
# or if you have time to spare
npm install -g linto
```

## Usage

```bash
linto --config=config.json
```

where `config.json` has the following structure:

```json
{
  "repos": [{
    "owner": "buildo",
    "name": "linto"
  }],
  "eslintConfig": {
    "rules": {
      "semi": "error"
    }
  }
}
```

By default, linto checks the `src` and the `src/web` directories of each repo. This default can be overridden on a repo base:

```json
{
  "repos": [{
    "owner": "buildo",
    "name": "someMonoRepo",
    "paths": ["thefrontend/src"]
  }]
}
```


The default ESLint configuration is

```json
{
  "extends": "buildo"
}
```

which you can override by passing a configuration like

```json
{
  "extends": null,
  "rules": {
    "semi": 2
  }
}
```

## Plugin support
You can include any ESLint plugin in the config, as long as it's available on npm.

If, for example, you provide the following config

```json
{
  "plugins": ["whatever"],
  "rules": {
    "whatever/rule": 2
  }
}
```

then linto will try to retrieve `eslint-plugin-whatever` from npm and make it available to ESLint.
