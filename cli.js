#!/usr/bin/env node

const program = require('commander');
const delugeWebCli = require('.');

program
  .version(require('./package').version, '-v, --version')
  .description(require('./package').description)
  .parse(process.argv);

delugeWebCli({
});
