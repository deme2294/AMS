const axios = require('axios');
const BACKEND_URL = 'http://localhost:5005';

async function testAdminMenu() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/menus/my-nav`, {
      headers: {
        'Authorization': 'Bearer ITP_TEST_TOKEN'
      },
      withCredentials: true
    });
    
    console.log('All menus returned:');
    response.data.data.forEach((m: any) => {
      console.log(`- ${m.title} | path: ${m.path} | section: ${m.is_section} | dropdown: ${m.is_dropdown} | active: ${m.is_active}`);
    });
    
    const servicesPaths = response.data.data.filter((m: any) => 
      m.path && m.path.includes('service')
    );
    console.log('\nService-related paths:');
    servicesPaths.forEach(m => console.log(`  ${m.path}`));
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

testAdminMenu();
