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

type Report = string;

function run(config: Object): Promise<Report> {
  return installPlugins(config.eslintConfig.plugins || [])
  .then(installedPlugins => {
    const progressBars = renderProgressBars(config.repos);
    return Promise.all(config.repos.map(repo => checkRepo(repo, config.eslintConfig, installedPlugins, progressBars).catch(e => log(repo)(e))));
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
    clipboard.copy(report, () => console.log(`${emoji.clipboard}  Automatically copied to the clipboard!\n`));

    return report;
  });
}

module.exports = run;
