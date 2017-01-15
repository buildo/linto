// @flow

import type { Repo } from './repo';
import type { ESLintConfig } from './eslintConfig.js';
import type { InstalledPlugin } from './plugins';
import type { ProgressBar } from 'progress';
import type { ProgressBars } from './progressBars';

const { CLIEngine } = require('eslint');
const deepMerge = require('deepmerge');
const emoji = require('node-emoji').emoji;
const { makeTmp } = require('./tempDir');
const clone = require('./clone');
const { repoFullName } = require('./repo');

export type Result = {
  repo: Repo,
  report: {
    errorCount: number,
    warningCount: number
  },
  path: string
};

function checkRepo(repo: Repo, eslintConfig: ESLintConfig = {}, installedPlugins: Array<InstalledPlugin>, progressBars: ProgressBars): Promise<Result> {
  return makeTmp()
    .then(path => {
      progressBars[repoFullName(repo)].tick({ phase: 'Cloning repository from GitHub...' });
      const host = repo.host || 'github.com';
      return clone(`git@${host}:${repo.owner}/${repo.name}`, path, 1);
    })
    .then(path => {
      process.chdir(path);
      progressBars[repoFullName(repo)].tick({ phase: 'Checking ESLint config...' });
      const repoConfig = repo.eslintConfig || {};
      const mergedConfig = deepMerge(eslintConfig, repoConfig);
      const config = {
        useEslintrc: false,
        ignorePattern: mergedConfig.ignorePattern,
        baseConfig: mergedConfig
      };
      const cli = new CLIEngine(config);
      installedPlugins.forEach(({ name, path }) => cli.addPlugin(name, require(path)));
      const files = repo.paths || ['src', 'web/src'];
      const report = cli.executeOnFiles(files);
      if (report.errorCount > 0) {
        progressBars[repoFullName(repo)].tick({ phase: `${emoji.x}  Done! ${report.errorCount} errors` });
      } else {

        progressBars[repoFullName(repo)].tick({ phase: `${emoji.white_check_mark}  Done! No errors!` });
      }
      return { repo, report, path };
    });
}

module.exports = checkRepo;
