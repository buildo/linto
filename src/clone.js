// @flow

const git = require('gift');

function clone(url: string, path: string, depth: number): Promise<string> {
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

module.exports = clone;
