// @flow

import type { Repo } from './repo';

const ProgressBar = require('progress');
const { repoFullName } = require('./repo');
const { colored } = require('./logging');

export type ProgressBars = {[repoName: string]: ProgressBar};

function renderProgressBars(repos: Array<Repo>): {[repoName: string]: ProgressBar} {
  return repos.reduce((bars, repo) => {
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
  }, {}
  );

}

module.exports = { renderProgressBars };
