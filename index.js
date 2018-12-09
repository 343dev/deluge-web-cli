const DelugeRPC = require('./lib/deluge-rpc');

async function delugeWebCli({ args = [], host, password = 'deluge' }) {
  if (!host) {
    throw new Error('Please provide deluge-web server URL.');
  }

  const deluge = new DelugeRPC(host, password);
  const isConnected = await deluge.call('web.connected');

  if (isConnected) {
    await deluge.connect();
  }

  if (args.length) {
    console.log(args);
  }
}

module.exports = delugeWebCli;
