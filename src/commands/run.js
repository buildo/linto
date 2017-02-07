// @flow

const { CLIEngine } = require('eslint');
const colors = require('colors/safe');
const { installPlugins } = require('../plugins');
const { renderProgressBars } = require('../progressBars');
const checkRepo = require('../checkRepo');
const { generateReport } = require('../report');
const { log } = require('../logging');
const emoji = require('node-emoji').emoji;
const clipboard = require('copy-paste');
const inquirer = require('inquirer');

function run(config: Object, fix: boolean, dryRun: boolean, githubToken: ?string): Promise<void> {
  console.log(colors.bold(`${emoji.mag}  Analyzing the repos:\n`))
  return installPlugins(config.eslintConfig.plugins || [])
  .then(installedPlugins => {
    const progressBars = renderProgressBars(config.repos);
    return Promise.all(config.repos.map(repo => checkRepo(repo, config.eslintConfig, installedPlugins, progressBars, fix, githubToken).catch(e => log(repo)(e))));
  })
  .then(results => {
    const icon = (errorCount, warningCount) => errorCount > 0 ? emoji.x : warningCount > 0 ? emoji.warning : emoji.white_check_mark;
    const report = generateReport(results);
    console.log();
    if (results.filter(r => r.report.errorCount > 0).length > 0) {
      console.log(colors.bold(`${emoji.point_down}  Here's all the errors I've found ${emoji.point_down}\n`));
    }
    const formatter = new CLIEngine(config).getFormatter('codeframe');
    results.forEach(({ repo, report, path }) => {
      // The 'codeframe' formatter prints paths relative to the cwd.
      // This then ensures we print paths relative to each repo root.
      process.chdir(path);
      if (report.errorCount > 0 || report.warningCount > 0) {
        log(repo)(`\n${formatter(report.results)}\n`);
      }
    });

    console.log(colors.bold(`${emoji.tada}  Here's your linto report!\n`));
    console.log(report);
    console.log();
    clipboard.copy(report, () => {
      console.log(`${emoji.clipboard}  Automatically copied to the clipboard!\n`);

      if (fix) {
        console.log(colors.bold(`${emoji.gear}  You ran linto with '--fix'. Applying the fixes locally...`));
        if (dryRun) {
          return Promise.all(results.map(({ fix }) => fix(dryRun))).then(fixes => {
            if (fixes.filter(diffs => !!diffs).length === 0) {
              console.log(colors.bold('No fixes can be applied.\n'));
            }
            console.log(colors.bold(`\nIf ran without '--dry-run' pull requests with these diffs would be opened:\n`));
            fixes.filter(diffs => !!diffs).forEach((diffs, index) => {
              const repo = results[index].repo;
              log(repo)(`\n\n${diffs.map(highlightDiff).join('\n\n')}\n\n`);
            });
            console.log();
            console.log(colors.bold('Re-run without -n to open the pull requests.'));
            console.log();

          });
        } else {
          return Promise.all(results.map(({ fix }) => fix(dryRun)))
            .then(prs => {
              if (prs.filter(pr => !!pr).length === 0) {
                console.log(colors.bold('No pull requests needed to be open'));
              } else {
                console.log(colors.bold(`Done! Here's a list of the pull requests that have been opened:\n`));
                console.log(prs.map(pr => `  - ${pr.htmlUrl}`).join('\n'));
              }
            });
        }

      }
    });

  });
}

// FIXME: move this to a separate file
function highlightDiff(diff: string): string {
  return diff.split('\n').map(line => {
    if (line.startsWith('+++')
      || line.startsWith('---')
      || line.startsWith('@@')) {
      return colors.yellow(line);
    }
    if (line.startsWith('+')) {
      return colors.green(line);
    }
    if (line.startsWith('-')) {
      return colors.red(line);
    }
    return line;
  }).join('\n');
}

module.exports = run;
