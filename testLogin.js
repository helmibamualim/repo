const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
  console.log('🔍 Testing Login Flow...\n');

  // Step 1: Test Login
  console.log('1. Testing Login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
      }),
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Login berhasil!');
      console.log('Token:', loginData.access_token.substring(0, 20) + '...');
      console.log('User:', loginData.user.email);

      // Step 2: Test Verify Token
      console.log('\n2. Testing Verify Token...');
      const verifyResponse = await fetch(`${BASE_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok) {
        console.log('✅ Token verification berhasil!');
        console.log('Verified User:', verifyData.user.email);
      } else {
        console.log('❌ Token verification gagal:', verifyData);
      }

      // Step 3: Test Profile
      console.log('\n3. Testing Profile...');
      const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const profileData = await profileResponse.json();

      if (profileResponse.ok) {
        console.log('✅ Profile berhasil diambil!');
        console.log('Profile:', profileData);
      } else {
        console.log('❌ Profile gagal:', profileData);
      }

    } else {
      console.log('❌ Login gagal:', loginData);
    }
  } catch (error) {
    console.error('❌ Error during login test:', error.message);
  }
}

async function testBackendConnection() {
  console.log('🔗 Testing Backend Connection...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'GET',
    });
    
    if (response.status === 401) {
      console.log('✅ Backend terhubung (401 Unauthorized expected tanpa token)');
    } else {
      console.log('⚠️ Backend response:', response.status);
    }
  } catch (error) {
    console.error('❌ Backend tidak terhubung:', error.message);
    console.log('💡 Pastikan backend berjalan di port 3001');
  }
}

async function runTests() {
  await testBackendConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  await testLogin();
}

runTests();
