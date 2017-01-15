// @flow

import type { Result } from './checkRepo';

const table = require('markdown-table');
const emoji = require('node-emoji').emoji;
const { repoFullName } = require('./repo');

function generateReport(results: Array<Result>): string {
  const icon = (errorCount, warningCount) => errorCount > 0 ? emoji.x : warningCount > 0 ? emoji.warning : emoji.white_check_mark;
  return table([
   ['', 'repo', 'errors', 'warnings'],
   ...results.map(({ repo, report: { errorCount, warningCount } }) => [icon(errorCount, warningCount), repoFullName(repo), errorCount, warningCount]),
  ], {
    align: ['c', 'l', 'c', 'c']
  });
}

module.exports = { generateReport };
