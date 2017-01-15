// @flow

const tmp = require('tmp');
tmp.setGracefulCleanup();

function makeTmp(): Promise<string> {
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

module.exports = { makeTmp };
