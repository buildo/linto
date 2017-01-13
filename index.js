#! /usr/bin/env node
// @flow

const tmp = require('tmp');
const fs = require('fs');
const yargs = require('yargs');
const colors = require('colors/safe');
const { CLIEngine } = require('eslint');
const git = require('gift');

type ESLintConfig = {
  rules?: { [_: string]: 0 | 1 | 2 | Object },
  extends?: string
};

type Repo = {
  owner: string,
  name: string
};

const repoColors = { };

const log = ({ owner, name }: Repo) => (message: string) => {
  const repoName = `${owner}/${name}`;
  if (!repoColors[repoName]) {
    const available = ['yellow', 'red', 'green', 'blue', 'cyan', 'magenta'];
    const randomColor = available[Math.floor(Math.random() * available.length)];
    repoColors[repoName] = randomColor;
  }
  console.log(colors[repoColors[repoName]](`[${repoName}]`), ` ${message}`);
}

tmp.setGracefulCleanup();

function checkRepo(repo: Repo, eslintConfig: ESLintConfig = {}) {
  tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
    log(repo)(`created tmp directory ${path}`);
    log(repo)('cloning repo...');
    git.clone(`git@github.com:${repo.owner}/${repo.name}`, path, 1, (err, r) => {
      if (err) {
        log(repo)(err);
        return;
      }
      process.chdir(path);
      log(repo)(`cloned repo into tmp directory`);
      try {
        const defaultBaseConfig = { extends: 'buildo' };
        const config = {
          useEslintrc: false,
          baseConfig: Object.assign({}, defaultBaseConfig, eslintConfig)
        };
        const cli = new CLIEngine(config);
        const report = cli.executeOnFiles(['src']);
        const formatter = cli.getFormatter('stylish');
        if (report.errorCount > 0) {
          log(repo)(formatter(report.results));
        } else {
          log(repo)('No style errors!')
        }
      } catch (e) {
        log(repo)(e);
      } finally {
        cleanupCallback();
        log(repo)('Temp directory cleaned up');
      }
    }, e => log(repo)(e));
  });

}

const argv = yargs.argv;

if (!argv.config) {
  console.log('Usage: linto --config=config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));

config.repos.forEach(repo => {
  checkRepo(repo, config.eslintConfig)
});
