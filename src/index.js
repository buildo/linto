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
  .action(({ config }) => {
    if (!config) {
      program.emit('run', null, ['--help']);
    }
    commands.run(parseConfig(config));
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
