// @flow

import type { ESLintConfig } from './eslintConfig';

export type Repo = {
  owner: string,
  name: string,
  paths?: Array<string>,
  host?: string,
  eslintConfig?: ESLintConfig
};

function repoFullName(repo: Repo): string {
  return `${repo.owner}/${repo.name}`;
}

module.exports = { repoFullName };

