#! /usr/bin/env node
// @flow

const tmp = require('tmp');
const fs = require('fs');
const yargs = require('yargs');
const colors = require('colors/safe');
const { CLIEngine } = require('eslint');
const git = require('gift');
const npmi = require('npmi');

type ESLintConfig = {
  rules?: { [_: string]: 0 | 1 | 2 | Object },
  extends?: string,
  plugins?: Array<string>
};

type Repo = {
  owner: string,
  name: string,
  paths: ?Array<string>,
  host: ?string
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

function makeTmp(): Promise<string> {
  return new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true }, (err, path) => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}

function clone(url: string, path: string, depth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    git.clone(url, path, depth, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}

type InstalledPlugin = {
  name: string,
  path: string
};

function installPlugin(plugin: string, path: string): Promise<InstalledPlugin> {
  return new Promise((resolve, reject) => {
    npmi({ path, name: pluginFullName(plugin), npmLoad: { progress: false, loglevel: 'silent' } }, (err) => {
      if (err) {
        reject(err);
      } else {
        const pluginPath = `${path}/node_modules/${pluginFullName(plugin)}`;
        resolve({ name: pluginFullName(plugin), path: pluginPath });
      }
    });
  });
}

function installPlugins(plugins: Array<string>): Promise<Array<InstalledPlugin>> {
  return makeTmp().then(path => {
    return Promise.all(plugins.map(plugin => installPlugin(plugin, path)));
  });
}

function pluginFullName(plugin: string): string {
  const prefix = 'eslint-plugin-';
  return plugin.indexOf(prefix) === 0 ? plugin : `${prefix}${plugin}`;
}

function checkRepo(repo: Repo, eslintConfig: ESLintConfig = {}, installedPlugins: Array<InstalledPlugin>): Promise<Result> {
  return makeTmp()
    .then(path => {
      log(repo)(`created tmp directory ${path}`);
      log(repo)('cloning repo...');
      const host = repo.host || 'github.com';
      return clone(`git@${host}:${repo.owner}/${repo.name}`, path, 1);
    })
    .then(path => {
      process.chdir(path);
      log(repo)(`cloned repo into tmp directory`);
      const defaultBaseConfig = { extends: 'buildo' };
      const config = {
        useEslintrc: false,
        baseConfig: Object.assign({}, defaultBaseConfig, eslintConfig)
      };
      const cli = new CLIEngine(config);
      installedPlugins.forEach(({ name, path }) => cli.addPlugin(name, require(path)));
      const files = repo.paths || ['src', 'web/src'];
      const report = cli.executeOnFiles(files);
      const formatter = cli.getFormatter('stylish');
      if (report.errorCount > 0) {
        log(repo)(formatter(report.results));
      } else {
        log(repo)('No style errors!')
      }
      return { repo, errorCount: report.errorCount };
    });
}

const argv = yargs.argv;

if (!argv.config) {
  console.log('Usage: linto --config=config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));

installPlugins(config.eslintConfig.plugins || [])
.then(installedPlugins => {
  return Promise.all(config.repos.map(repo => checkRepo(repo, config.eslintConfig, installedPlugins).catch(e => log(repo)(e))));
})
.then(results => {
  const icon = errorCount => errorCount > 0 ? '⛔️' : '✅';
  const res = results.map(({ repo: { owner, name }, errorCount }) => `|${icon(errorCount)} | ${owner}/${name} | ${errorCount} |`);
  console.log('| |  repo   | errors |');
  console.log('|-|---------|--------|');
  console.log(res.join('\n'));
});

