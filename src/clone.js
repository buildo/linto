// @flow

const git = require('gift');

type Callback<A> = (err: Error) => A;

export type GitRepo = {
  path: string,
  checkout: (name: string, Callback<*>) => void,
  commit: (message: string, options: { all: boolean }, Callback<*>) => void,
  create_branch: (name: string, Callback<*>) => void,
  remote_push: (name: string, Callback<*>) => void,
  diff: (commit1: string, commit2: string, cb: (err: Error, Object) => *) => void
}

function clone(url: string, path: string, depth: number): Promise<GitRepo> {
  return new Promise((resolve, reject) => {
    git.clone(url, path, depth, (err, repo) => {
      if (err) {
        reject(err);
      } else {
        resolve(repo);
      }
    });
  });
}

module.exports = clone;
