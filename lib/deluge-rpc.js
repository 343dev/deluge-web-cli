module.exports = class DelugeRPC {
  constructor(url, password) {
    this.baseUrl = url;
    this.cookie = '';
    this.password = password;
  }
};
