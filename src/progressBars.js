// @flow

import type { Repo } from './repo';

const ProgressBar = require('ascii-progress');
const { repoFullName } = require('./repo');
const { colored } = require('./logging');

export type ProgressBars = {[repoName: string]: ProgressBar};

function renderProgressBars(repos: Array<Repo>): {[repoName: string]: ProgressBar} {
  // const multi = new Multiprogress(process.stderr);

  return repos.reduce((bars, repo) => {
    const bar = new ProgressBar({
      schema: `:status  [:bar] ${colored(repo)(repoFullName(repo))} :phase`,
      width: 20,
      blank: ' ',
      total: 3
    });
    bars[repoFullName(repo)] = bar;
    return bars;
  }, {});

}

module.exports = { renderProgressBars };
