const path = require('path');
const dir = (file) => path.join(CONFIG_DIR, file);
const series = (...x) => `(${x.map((x) => x || 'shx echo').join(') && (')})`;
// prettier-ignore
const scripts = (x) => Object.entries(x)
  .reduce((m, [k, v]) => (m.scripts[k] = v || 'shx echo') && m, { scripts: {} });
const {
  TYPESCRIPT: TS,
  OUT_DIR,
  DOCS_DIR,
  CONFIG_DIR,
  RELEASE_BUILD,
  RELEASE_DOCS
} = require('./project.config');
const { COMMIT, COMMITIZEN } = process.env;

process.env.LOG_LEVEL = 'disable';
module.exports = scripts({
  bootstrap: series(
    'lerna bootstrap',
    'npm run @sh -- build',
    'npm run @core -- build'
  ),
  ':commit': 'exit 1',
  ':validate': {
    default: series(
      // prettier-ignore
      COMMIT && !COMMITIZEN && 'jake run:conditional[' +
          `"\nCommits should be done via 'npm run :commit'. Continue?",` +
          '"","exit 1",Yes,5]',
      'nps validate.md validate.all',
      'jake run:zero["npm outdated"]',
      COMMIT && `jake run:conditional["\nCommit?","","exit 1",Yes,5]`
    ),
    all: [
      'concurrently',
      '"npm run @sh -- validate"',
      '"npm run @core -- validate"',
      '"npm run @shast -- validate"',
      '-n @sh,@core,@shast -c gray.dim,gray,blue --kill-others-on-fail'
    ].join(' '),
    md: `markdownlint README.md --config ${dir('markdown.json')}`
  },
  docs: series(
    TS && `jake run:zero["shx rm -r ${DOCS_DIR}"]`,
    TS && `typedoc --out ${DOCS_DIR} ./src`
  ),
  changelog: 'conventional-changelog -p angular -i CHANGELOG.md -s -r 0',
  update: series('npm update --save/save-dev', 'npm outdated'),
  clean: series(
    `jake run:zero["shx rm -r ${OUT_DIR} ${DOCS_DIR} coverage CHANGELOG.md"]`,
    'shx rm -rf node_modules'
  ),
  // Private
  private: {
    preversion: series(
      'shx echo "Recommended version bump is:"',
      'conventional-recommended-bump --preset angular --verbose',
      `jake run:conditional["\nContinue?","","exit 1",Yes]`
    ),
    version: series(
      'nps changelog',
      RELEASE_DOCS && 'nps docs',
      RELEASE_BUILD && 'nps build',
      'git add .'
    )
  }
});
