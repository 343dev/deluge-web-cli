const fs = require('fs');
const glob = require('glob');
const path = require('path');

const DelugeRPC = require('./lib/deluge-rpc');

async function delugeWebCli({
  args = [],
  host,
  isDelete,
  isPaused,
  isRecursive,
  password = 'deluge',
}) {
  if (!host) {
    throw new Error('Please provide deluge-web server URL.');
  }

  const dirs = args.filter(d => fs.existsSync(d) && fs.statSync(d).isDirectory());
  const files = args
    .filter(f => /.+\.torrent$/i.test(f) && fs.existsSync(f) && fs.statSync(f).isFile())
    .concat(...(dirs.map(d => glob.sync(isRecursive ? `${d}/**/*.torrent` : `${d}/*.torrent`))));

  const deluge = new DelugeRPC(host, password);
  const isConnected = await deluge.call('web.connected');

  if (!isConnected) {
    await deluge.connect();
  }

  if (files.length) {
    files.forEach(async (filePath) => {
      const result = await deluge.addTorrent(filePath, { add_paused: isPaused });

      if (result) {
        console.log(`Added: ${path.basename(filePath)}`);

        if (isDelete) {
          fs.unlinkSync(filePath);
        }
      }
    });
  }
}

module.exports = delugeWebCli;
