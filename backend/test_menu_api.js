const axios = require('axios');
const BACKEND_URL = 'http://localhost:5005';

async function testMenuAPI() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/menus/my-nav`, {
      headers: {
        'Authorization': 'Bearer ITP_TEST_TOKEN'
      },
      withCredentials: true
    });
    console.log('Menu API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

testMenuAPI();
