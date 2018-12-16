const fs = require('fs');
const glob = require('glob');
const logSymbols = require('log-symbols');
const path = require('path');

const DelugeRPC = require('./lib/deluge-rpc');

function showMessage(obj) {
  console.log(logSymbols[obj.status], obj.message);
}

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

  const urls = args.filter(u => /^(magnet:\?.*xt=urn:btih:[a-f0-9]{40}|https?:\/\/).*/i.test(u));
  const dirs = args.filter(d => fs.existsSync(d) && fs.statSync(d).isDirectory());
  const files = args
    .filter(f => /.+\.torrent$/i.test(f) && fs.existsSync(f) && fs.statSync(f).isFile())
    .concat(...(dirs.map(d => glob.sync(isRecursive ? `${d}/**/*.torrent` : `${d}/*.torrent`))));

  const deluge = new DelugeRPC(host, password);
  const isConnected = await deluge.call('web.connected');

  if (!isConnected) {
    await deluge.connect();
  }

  if (urls.length) {
    urls.forEach(async (url) => {
      const result = await deluge.addUrl(url);

      if (result) {
        showMessage(result);
      }
    });
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
