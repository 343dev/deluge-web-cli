#!/usr/bin/env node

const program = require('commander');
const delugeWebCli = require('.');

program
  .option('--host [url]', 'deluge-web server URL')
  .option('--password [pwd]', 'deluge-web server password');

program
  .usage('[options] <file ...>')
  .version(require('./package').version, '-v, --version')
  .description(require('./package').description)
  .parse(process.argv);

delugeWebCli({
  args: program.args,
  host: program.host,
  password: program.password,
});
