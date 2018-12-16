#!/usr/bin/env node

const program = require('commander');
const delugeWebCli = require('.');

program
  .option('--host [url]', 'deluge-web server URL')
  .option('--password [pwd]', 'deluge-web server password')
  .option('-d, --delete', 'Delete torrent file after add')
  .option('-p, --paused', 'Add torrent in paused state')
  .option('-r, --recursive', 'Get files from provided directory and the entire subtree');

program
  .usage('[options] <file ...> <url>')
  .version(require('./package').version, '-v, --version')
  .description(require('./package').description)
  .parse(process.argv);

delugeWebCli({
  args: program.args,
  host: program.host,
  isDelete: program.delete,
  isPaused: program.paused,
  isRecursive: program.recursive,
  password: program.password,
});
