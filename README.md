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
