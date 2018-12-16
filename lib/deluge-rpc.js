const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const iconv = require('iconv-lite');
const path = require('path');

module.exports = class DelugeRPC {
  constructor(url, password) {
    this.baseUrl = url[url.length - 1] === '/' ? url : `${url}/`;
    this.cookie = '';
    this.password = password;
  }

  async makeRequest(method, params = []) {
    return axios.request({
      data: {
        method,
        params,
        id: 0,
      },
      headers: {
        'Content-Type': 'application/json',
        Cookie: this.cookie,
      },
      method: 'POST',
      timeout: 5000,
      url: `${this.baseUrl}json`,
      withCredentials: true,
    });
  }

  async makeAuth() {
    const { data: { result: status } } = await this.makeRequest('auth.check_session');

    if (!status) {
      const { data, headers } = await this.makeRequest('auth.login', [this.password]);

      if (!data.result) {
        throw new Error('Wrong password?');
      }

      const [cookie] = headers['set-cookie'][0].split(';');

      this.cookie = cookie;
    }

    return true;
  }

  async call(method, params = []) {
    if (!this.cookie) {
      await this.makeAuth();
    }

    const { data: { result } } = await this.makeRequest(method, params);

    return result;
  }

  async connect(hostId) {
    let id = hostId;

    if (!id) {
      const [[host]] = await this.call('web.get_hosts');

      id = host;
    }

    const response = await this.call('web.connect', [id]);

    return response === null;
  }

  async getTorrents() {
    const { torrents } = await this.call('web.update_ui', [
      [
        'eta',
        'is_auto_managed',
        'name',
        'num_peers',
        'num_seeds',
        'progress',
        'queue',
        'ratio',
        'save_path',
        'state',
        'time_added',
        'total_done',
        'total_wanted',
        'tracker_host',
      ],
      {},
    ]);

    return torrents;
  }

  async getStatus() {
    const { stats } = await this.call('web.update_ui', [[], {}]);

    return stats;
  }

  async isExists(hash) {
    const torrents = await this.getTorrents();

    return torrents[hash] !== undefined;
  }

  async addTorrent(filePath, config = {}) {
    const form = new FormData({ maxDataSize: 307200 });
    let torrentHash;

    form.append('file', fs.createReadStream(filePath));

    if (!this.cookie) {
      await this.makeAuth();
    }

    const { data } = await axios.request({
      data: form,
      headers: {
        Cookie: this.cookie,
        ...form.getHeaders(),
      },
      method: 'POST',
      url: `${this.baseUrl}upload`,
      withCredentials: true,
    });
    const torrent = data.files[0];
    const torrentInfo = await this.call('web.get_torrent_info', [torrent]);

    if (torrentInfo) {
      torrentHash = torrentInfo.info_hash.toLowerCase();

      if (await this.isExists(torrentHash)) {
        process.exitCode = 1;

        return {
          status: 'error',
          message: `already added: ${path.basename(filePath)}`,
        };
      }

      await this.call('web.add_torrents', [[{
        path: torrent,
        options: {
          ...config,
        },
      }]]);
    }

    return {
      status: 'success',
      message: `successfully added: ${path.basename(filePath)}`,
    };
  }

  async addUrl(url) {
    const config = await this.call('core.get_config');
    const downloadPath = config.download_location;

    let torrentHash;

    if (/^magnet/i.test(url)) {
      const magnetInfo = await this.call('web.get_magnet_info', [url]);

      if (magnetInfo) {
        const torrentName = Buffer.from(magnetInfo.name, 'latin1');

        torrentHash = magnetInfo.info_hash.toLowerCase();

        if (await this.isExists(torrentHash)) {
          process.exitCode = 1;

          return {
            status: 'error',
            message: `already added: ${iconv.decode(torrentName, 'utf8')}`,
          };
        }

        await this.call('core.add_torrent_magnet', [url, {
          download_location: downloadPath,
        }]);
      }
    } else {
      const torrent = await this.call('web.download_torrent_from_url', [url]);
      const torrentInfo = await this.call('web.get_torrent_info', [torrent]);

      if (torrentInfo) {
        torrentHash = torrentInfo.info_hash.toLowerCase();

        if (await this.isExists(torrentHash)) {
          process.exitCode = 1;

          return {
            status: 'error',
            message: `already added: ${torrentInfo.name}`,
          };
        }

        await this.call('web.add_torrents', [[{
          path: torrent,
          options: {
            download_location: downloadPath,
          },
        }]]);

        await new Promise(done => setTimeout(done, 1000));
      }
    }

    const torrents = await this.getTorrents();

    return {
      status: 'success',
      message: `successfully added: ${torrents[torrentHash].name}`,
    };
  }
};
