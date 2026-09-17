const axios = require('axios');
const BACKEND_URL = 'http://localhost:5006';

async function testServicesAPI() {
  try {
    // Use dev bypass token
    const response = await axios.get(`${BACKEND_URL}/api/services`, {
      headers: {
        'Authorization': 'Bearer ITP_TEST_TOKEN'
      },
      withCredentials: true
    });
    console.log('API Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

testServicesAPI();
