#! /usr/bin/env node
// @flow

const program = require('commander');
const fs = require('fs');
const yaml = require('js-yaml');

const commands = require('./commands');

function parseConfig(path: string): Object {
  const configFile = fs.readFileSync(path, 'utf8');
  try {
    return JSON.parse(configFile);
  } catch (e) {
    return yaml.safeLoad(configFile);
  }
}

const version = require('../package.json').version;

program
  .command('run')
  .option('-c, --config <config>', 'configuration')
  .option('--fix', 'also run eslint --fix and open relative pull requests')
  .option('-n, --dry-run', 'when used in combination with --fix it performs a dry run of the actual fixes')
  .option('--github-token [github-token]', 'token used by --fix for opening the PRs. Mandatory when --fix is provided (and --dry-run is not)')
  .action(({ config, fix, dryRun, githubToken }) => {
    if (!config) {
      program.emit('run', null, ['--help']);
    }
    if (fix && !dryRun && !githubToken) {
      console.log('You need to provide a GitHub token');
      program.emit('run', null, ['--help']);
    }
    commands.run(parseConfig(config), fix, dryRun, githubToken);
  });

program
  .command('clean')
  .description("Delete any temp directories, useful in case linto didn't terminate properly and it couldn't perform its cleanup")
  .option('-n, --dry-run', "List, but don't delete, tmp directories")
  .action(({ dryRun }) => {
    commands.clean(dryRun);
  });

program
  .version(version)
  .parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
