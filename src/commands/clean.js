// @flow

const osTmpDir = require('os-tmpdir')();
const fs = require('fs');
const emoji = require('node-emoji').emoji;
const colors = require('colors/safe');
const rimraf = require('rimraf');

function clean(dryRun: boolean): Promise<void> {
  return new Promise(resolve => {
    const lintoTmpDirs =
      fs
      .readdirSync(osTmpDir)
      .filter(f => fs.statSync(`${osTmpDir}/${f}`).isDirectory() && f.startsWith('linto_'))
      .map(d => `${osTmpDir}/${d}`);

    const dirsList = lintoTmpDirs.map(d => `  ${d}`).join('\n');

    if (dryRun) {
      console.log(colors.bold(`${emoji.wastebasket}  The following directories would be removed:\n`));
      console.log(dirsList);
      console.log();
    } else {
      lintoTmpDirs.forEach(dir => rimraf.sync(dir));
      console.log(colors.bold(`${emoji.wastebasket}  The following directories have removed:\n`));
      console.log(dirsList);
      console.log();
    }

    resolve();
  });
}

module.exports = clean;
