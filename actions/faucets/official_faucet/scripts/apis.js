const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

async function claimFaucet(address, proxy = null) {
  let agent;
  if (proxy) {
    agent = new SocksProxyAgent(proxy);
  }
  const config = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  };
  if (agent) {
    config.httpAgent = agent;
    config.httpsAgent = agent;
  }
  try {
    const response = await axios.post(
      'https://testnet.somnia.network/api/faucet',
      { address },
      config
    );
    if (response.status === 200) {
      return response.data;
    } else {
      const err = new Error("Non-200 response");
      err.code = response.status;
      err.data = response.data;
      throw err;
    }
  } catch (error) {
    if (error.response) {
      const err = new Error("API error");
      err.code = error.response.status;
      err.data = error.response.data;
      throw err;
    } else {
      throw error;
    }
  }
}

async function getProxyIP(proxy = null) {
  let agent;
  if (proxy) {
    agent = new SocksProxyAgent(proxy);
  }
  const config = {};
  if (agent) {
    config.httpAgent = agent;
    config.httpsAgent = agent;
  }
  try {
    const response = await axios.get('https://api.ipify.org?format=json', config);
    if (response.status === 200) {
      return response.data;
    } else {
      const err = new Error("Non-200 response");
      err.code = response.status;
      err.data = response.data;
      throw err;
    }
  } catch (error) {
    if (error.response) {
      const err = new Error("API error");
      err.code = error.response.status;
      err.data = error.response.data;
      throw err;
    } else {
      throw error;
    }
  }
}

module.exports = { claimFaucet, getProxyIP };
