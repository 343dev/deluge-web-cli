const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

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

  async addTorrent(path, config = {}) {
    const form = new FormData({ maxDataSize: 307200 });

    form.append('file', fs.createReadStream(path));

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
    const result = await this.call('web.add_torrents', [[{
      path: torrent,
      options: {
        ...config,
      },
    }]]);

    return result;
  }
};
