// @flow

const npmi = require('npmi');
const emoji = require('node-emoji').emoji;
const colors = require('colors/safe');
const { makeTmp } = require('./tempDir');

export type InstalledPlugin = {
  name: string,
  path: string
};

function installPlugin(plugin: string, path: string): Promise<InstalledPlugin> {
  return new Promise((resolve, reject) => {
    const originalConsoleLog = console.log;
    // $FlowFixMe
    console.log = () => {};
    npmi({ path, name: pluginFullName(plugin), npmLoad: { progress: false, loglevel: 'silent' } }, (err) => {
      // $FlowFixMe
      console.log = originalConsoleLog;
      if (err) {
        reject(err);
      } else {
        const pluginPath = `${path}/node_modules/${pluginFullName(plugin)}`;
        console.log(`  ${emoji.wrench}  ${pluginFullName(plugin)}`)
        resolve({ name: pluginFullName(plugin), path: pluginPath });
      }
    });
  });
}

function pluginFullName(plugin: string): string {
  const prefix = 'eslint-plugin-';
  return plugin.indexOf(prefix) === 0 ? plugin : `${prefix}${plugin}`;
}


function installPlugins(plugins: Array<string>): Promise<Array<InstalledPlugin>> {
  if (plugins.length === 0) {
    return Promise.resolve([]);
  }
  console.log(colors.bold('Installing plugins...\n'))
  return makeTmp()
    .then(path => {
      return Promise.all(plugins.map(plugin => installPlugin(plugin, path)))
    })
    .then(installedPlugins => {
      console.log();
      return installedPlugins;
    });
}

module.exports = { pluginFullName, installPlugins };
