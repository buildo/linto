#! /usr/bin/env node
//      

const tmp = require('tmp');
const fs = require('fs');
const yargs = require('yargs');
const colors = require('colors/safe');
const { CLIEngine } = require('eslint');
const git = require('gift');
const npmi = require('npmi');
const clipboard = require('copy-paste');
const ProgressBar = require('progress');

                     
                                              
                   
                         
  

             
                
               
                        
               
  

               
             
           
                      
    
              
  

const repoColors = { };

const colored = (repo      ) => (message        )         => {
  const repoName = repoFullName(repo);
  if (!repoColors[repoName]) {
    const available = ['yellow', 'red', 'green', 'blue', 'cyan', 'magenta'];
    const randomColor = available[Math.floor(Math.random() * available.length)];
    repoColors[repoName] = randomColor;
  }
  return colors[repoColors[repoName]](message);
}

const log = (repo      ) => (message        ) => {
  console.log(colored(repo)(`[${repoFullName(repo)}]`), ` ${message}`);
}

tmp.setGracefulCleanup();

function makeTmp()                  {
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

function clone(url        , path        , depth        )                  {
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

                        
               
              
  

function installPlugin(plugin        , path        )                           {
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

function installPlugins(plugins               )                                  {
  console.log(colors.bold('🔧  Installing plugins...'))
  return makeTmp()
    .then(path => {
      return Promise.all(plugins.map(plugin => installPlugin(plugin, path)))
    })
    .then(installedPlugins => {
      console.log(colors.bold('🔧  Done!\n'));
      return installedPlugins;
    });
}

function pluginFullName(plugin        )         {
  const prefix = 'eslint-plugin-';
  return plugin.indexOf(prefix) === 0 ? plugin : `${prefix}${plugin}`;
}

function repoFullName(repo      )         {
  return `${repo.owner}/${repo.name}`;
}

function checkRepo(repo      , eslintConfig               = {}, installedPlugins                        )                  {
  return makeTmp()
    .then(path => {
      progressBars[repoFullName(repo)].tick({ phase: 'Cloning repository from GitHub...' });
      const host = repo.host || 'github.com';
      return clone(`git@${host}:${repo.owner}/${repo.name}`, path, 1);
    })
    .then(path => {
      process.chdir(path);
      progressBars[repoFullName(repo)].tick({ phase: 'Checking ESLint config...' });
      const defaultBaseConfig = { extends: 'buildo' };
      const config = {
        useEslintrc: false,
        baseConfig: Object.assign({}, defaultBaseConfig, eslintConfig)
      };
      const cli = new CLIEngine(config);
      installedPlugins.forEach(({ name, path }) => cli.addPlugin(name, require(path)));
      const files = repo.paths || ['src', 'web/src'];
      const report = cli.executeOnFiles(files);
      if (report.errorCount > 0) {
        progressBars[repoFullName(repo)].tick({ phase: `⛔️  Done! ${report.errorCount} errors` });
      } else {
        progressBars[repoFullName(repo)].tick({ phase: '✅  Done! No errors!' });
      }
      return { repo, report, path };
    });
}

const argv = yargs.argv;

if (!argv.config) {
  console.log('Usage: linto --config=config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));

let progressBars                               = {};

const renderProgressBars = () => {
  progressBars = config.repos.reduce((bars, repo) => {
    const bar = new ProgressBar(`${colored(repo)(repoFullName(repo))} [:bar] :phase`, {
      complete: '▫️',
      incomplete: ' ',
      width: 20,
      total: 4
    });
    bar.renderThrottle = 100;
    bar.tick();
    bars[repoFullName(repo)] = bar;
    return bars;
  }, {});
}

installPlugins(config.eslintConfig.plugins || [])
.then(installedPlugins => {
  renderProgressBars();
  return Promise.all(config.repos.map(repo => checkRepo(repo, config.eslintConfig, installedPlugins).catch(e => log(repo)(e))));
})
.then(results => {
  const icon = errorCount => errorCount > 0 ? '⛔️' : '✅';
  const entries = results.map(({ repo: { owner, name }, report: { errorCount } }) => `|${icon(errorCount)} | ${owner}/${name} | ${errorCount} |`).join('\n');
  const table = [
    '| |  repo   | errors |',
    '|-|---------|--------|',
    `${entries}`
  ].join('\n');
  console.log();
  if (results.filter(r => r.report.errorCount > 0).length > 0) {
    console.log(colors.bold('👇  Here\'s all the errors I\'ve found 👇\n'));
  }
  const formatter = new CLIEngine(config).getFormatter('codeframe');
  results.forEach(({ repo, report, path }) => {
    // The 'codeframe' formatter prints paths relative to the cwd.
    // This then ensures we print paths relative to each repo root.
    process.chdir(path);
    if (report.errorCount > 0) {
      log(repo)(formatter(report.results));
    }
  });

  console.log(colors.bold('🎉  Here\'s your linto report!\n'));
  console.log(table);
  console.log();
  clipboard.copy(table, () => console.log('📋  Automatically copied to the clipboard!\n'));

});

