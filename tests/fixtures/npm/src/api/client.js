// API client — imports the compromised axios version
// Guardian Scan Layer 4 reachability test: should detect this import at line 2
const axios = require('axios');

async function fetchData(url) {
  const response = await axios.get(url);
  return response.data;
}

async function postData(url, data) {
  const response = await axios.post(url, data);
  return response.data;
}

module.exports = { fetchData, postData };
