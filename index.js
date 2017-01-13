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

type Result = {
  repo: Repo,
  errorCount: number
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

function checkRepo(repo: Repo, eslintConfig: ESLintConfig = {}): Promise<void> {
  return new Promise((resolve, reject) => {
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
          resolve({ repo, errorCount: report.errorCount });
        } catch (e) {
          log(repo)(e);
          reject(e);
        } finally {
          cleanupCallback();
          log(repo)('Temp directory cleaned up');
        }
      }, e => log(repo)(e));
    });
  });

}

const argv = yargs.argv;

if (!argv.config) {
  console.log('Usage: linto --config=config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));

Promise.all(config.repos.map(repo => checkRepo(repo, config.eslintConfig))).then(results => {
  const icon = errorCount => errorCount > 0 ? '⛔️' : '✅';
  const res = results.map(({ repo: { owner, name }, errorCount }) => `|${icon(errorCount)} | ${owner}/${name} | ${errorCount} |`);
  console.log('| |  repo   | errors |');
  console.log('|-|---------|--------|');
  console.log(res.join('\n'));
});
