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
};
