const axios = require('axios');

module.exports = class DelugeRPC {
  constructor(url, password) {
    this.baseUrl = url;
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
      url: this.baseUrl,
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
};
