# linto 💄
[![npm](https://img.shields.io/npm/v/linto.svg?style=flat-square)](https://www.npmjs.com/package/linto)

A tool to test [ESLint](https://github.com/eslint/eslint) configurations against a set of GitHub repos.

## Installation

```bash
yarn global add linto
# or if you have time to spare
npm install -g linto
```

## Usage

```bash
linto run -c config.json
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

You can also write the config file in YAML format:

```yaml
repos:
  - owner: buildo
    name: linto
eslintConfig:
  rules:
    semi: error
```

### Target paths
By default, linto checks the `src` and the `web/src` directories of each repo. This default can be overridden on a repo base:

```json
{
  "repos": [{
    "owner": "buildo",
    "name": "someMonoRepo",
    "paths": ["thefrontend/src"]
  }]
}
```

### Plugin support
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

### Cleanup
linto creates temporary directories during its execution (to clone repos, install plugins, etc) and it cleans up after itself. However, in case linto is stopped during its execution, some of the directories it created may not be deleted. In order to remove all linto's temporary directories, you can run

```sh
linto clean
```

You can also perform a dry run, using `-n` or `--dry-run`:

```sh
linto clean -n # don't delete anything, just print what would be deleted
```
