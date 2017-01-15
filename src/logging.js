// @flow

import type { Repo } from './repo';

const colors = require('colors/safe');
const { repoFullName } = require('./repo');

const repoColors = { };

function colored(repo: Repo): (message: string) => string {
  return message => {
    const repoName = repoFullName(repo);
    if (!repoColors[repoName]) {
      const available = ['yellow', 'red', 'green', 'blue', 'cyan', 'magenta'];
      const randomColor = available[Math.floor(Math.random() * available.length)];
      repoColors[repoName] = randomColor;
    }
    return colors[repoColors[repoName]](message);
  };
}

function log(repo: Repo): (message: string) => void {
  return message => {
    console.log(colored(repo)(`[${repoFullName(repo)}]`), ` ${message}`);
  };
}

module.exports = { colored, log };

