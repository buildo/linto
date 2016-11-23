# linto

A tool to test [ESLint](https://github.com/eslint/eslint) configurations against a set of git repos.

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

The default configuration is

```json
{
  "extends": "buildo"
}
```

which you can override by passing a configuration like

```json
{
  "extends": undefined,
  "rules": {
    "semi": 2
  }
}
```

## Known limitations
This currently works with standard eslint rules and `eslint-config-buildo`.
This means you cannot test rules coming from an arbitrary plugin.

An easy workaround is to clone this repo, then

```
# install dependencies
yarn
# install custom plugin
yarn add eslint-plugin-whatever
```

and use it like:

```
yarn start -- --config=config.json
```

where `config.json` looks like:

```json
{
  "plugins": ["whatever"],
  "rules": {
    "whatever/rule": 2
  }
}
```
