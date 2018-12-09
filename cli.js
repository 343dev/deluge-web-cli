#!/usr/bin/env node

const program = require('commander');
const delugeRpc = require('.');

program
  .version(require('./package').version, '-v, --version')
  .description(require('./package').description)
  .parse(process.argv);

if (!program.args.length) {
  program.help();
} else {
  delugeRpc();
}
