// @flow

import type { Repo } from './repo';
import type { ESLintConfig } from './eslintConfig.js';
import type { InstalledPlugin } from './plugins';
import type { ProgressBar } from 'progress';
import type { ProgressBars } from './progressBars';
import type { GitRepo } from './clone';

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
  path: string,
  fix?: (dryRun: boolean) => Promise<void>
};

function checkRepo(repo: Repo, eslintConfig: ESLintConfig = {}, installedPlugins: Array<InstalledPlugin>, progressBars: ProgressBars, fix: boolean = false, githubToken: ?string): Promise<Result> {
  return makeTmp()
    .then(path => {
      progressBars[repoFullName(repo)].tick(1, { status: emoji.arrow_down, phase: 'Cloning repository from GitHub...' });
      const host = repo.host || 'github.com';
      return clone(`git@${host}:${repo.owner}/${repo.name}`, path, 1);
    })
    .then(gitRepo => {
      const { path } = gitRepo;
      process.chdir(path);
      progressBars[repoFullName(repo)].tick(1, { status: emoji.sleuth_or_spy, phase: 'Checking ESLint config...' });
      const repoConfig = repo.eslintConfig || {};
      const mergedConfig = deepMerge(eslintConfig, repoConfig);
      const config = {
        useEslintrc: false,
        ignorePattern: mergedConfig.ignorePattern,
        baseConfig: mergedConfig,
        fix
      };
      const cli = new CLIEngine(config);
      installedPlugins.forEach(({ name, path }) => cli.addPlugin(name, require(path)));
      const files = repo.paths || ['src', 'web/src'];
      const report = cli.executeOnFiles(files);
      if (report.errorCount > 0) {
        progressBars[repoFullName(repo)].tick(1, { status: emoji.x, phase: `Done! ${report.errorCount} errors and ${report.warningCount} warnings` });
      } else if (report.warningCount > 0) {
        progressBars[repoFullName(repo)].tick(1, { status: emoji.warning, phase: `Done! ${report.warningCount} warnings` });
      } else {
        progressBars[repoFullName(repo)].tick(1, { status: emoji.white_check_mark, phase: 'Done! No errors!' });
      }
      const result = { repo, report, path };
      if (fix) {
        return Object.assign({}, result, { fix: applyFixes(gitRepo, report, repo, githubToken) });
      } else {
        return result;
      };
    });
}

// FIXME: refactor this shit and move it to a separate file
function applyFixes(gitRepo: GitRepo, report, repo: Repo, token: ?string): (dryRun: boolean) => Promise<?(string | { htmlUrl: string })> {
  return (dryRun) => {
    return new Promise((resolve, reject) => {
      if (!report.results || report.results.filter(r => !!r.output).length === 0) {
        return resolve();
      }
      process.chdir(gitRepo.path);
      CLIEngine.outputFixes(report);
      const branchName = `linto-fix-${Date.now()}`;
      gitRepo.create_branch(branchName, err => {
        if (err) reject(err);
        gitRepo.checkout(branchName, err => {
          if (err) reject(err);
          gitRepo.commit('linto automatic fix', { all: true }, err => {
            if (err) reject(err);
            if (dryRun) {
              gitRepo.diff('HEAD~1', 'HEAD', (err, diffs) => {
                if (err) reject(err);
                resolve(diffs.map(diff => diff.diff));
              });
            } else {
              gitRepo.remote_push(`origin ${branchName}`, err => {
                if (err) reject(err);
                const pr = {
                  title: `${emoji.lipstick}  linto fix`,
                  head: branchName,
                  base: 'master',
                  body: [
                    'Hey there,',
                    'this PR was opened using [linto](https://github.com/buildo/linto).',
                    '',
                    'Usually this means the shared ESLint config has been updated and these are the changes needed to comply with the new config.',
                    '',
                    'The diff for this PR has been generated running `eslint --fix` using the updated ESLint config. Depending on the specific change, you may need to apply some manual fixes too.',
                    '',
                    'Hope this helped!',
                    '',
                    'Your friend,',
                    `linto ${emoji.lipstick}`
                  ].join('\n')
                };
                const Octokat = require('octokat');
                const github = new Octokat({ token });
                github.repos(repo.owner, repo.name).pulls.create(pr).then(resolve);
              });
            }
          });
        });
      });
    });
  };
}

module.exports = checkRepo;
