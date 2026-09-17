const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: './.env'});

async function test() {
  try {
    const dummyImagePath = path.join(__dirname, 'test-cat.png');
    // create a real valid png file just to bypass file-type checks
    const pngHex = "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da636460600000000600023081d05f0000000049454e44ae426082";
    fs.writeFileSync(dummyImagePath, Buffer.from(pngHex, 'hex'));

    // Create a mock token for admin
    const token = jwt.sign(
      { user_id: 1, email: 'admin@example.com', role: 1 }, 
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', 
      { expiresIn: '1h' }
    );

    const form = new FormData();
    form.append('category_name', 'Test Category ' + Date.now());
    form.append('description', 'Testing upload');
    form.append('status', 'active');
    form.append('image', fs.createReadStream(dummyImagePath));

    const reqOptions = {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    };

    const res = await axios.post('http://localhost:5005/api/services/categories', form, reqOptions);
    console.log("Success:", res.data);

    fs.unlinkSync(dummyImagePath);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}

test();
