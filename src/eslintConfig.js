// @flow

export type ESLintConfig = {
  rules?: { [_: string]: 0 | 1 | 2 | Object },
  extends?: string,
  plugins?: Array<string>,
  ignorePattern?: Array<string>
};

