const fetch = require('node-fetch');

async function testPorts() {
  console.log('🔍 Testing Port Connections...\n');

  // Test Frontend
  console.log('Testing Frontend (port 3000)...');
  try {
    const frontendResponse = await fetch('http://localhost:3000', {
      timeout: 5000
    });
    console.log('✅ Frontend accessible:', frontendResponse.status);
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
  }

  // Test Backend
  console.log('\nTesting Backend (port 3001)...');
  try {
    const backendResponse = await fetch('http://localhost:3001', {
      timeout: 5000
    });
    console.log('✅ Backend accessible:', backendResponse.status);
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
  }

  // Test Backend API
  console.log('\nTesting Backend API (port 3001/api)...');
  try {
    const apiResponse = await fetch('http://localhost:3001/api', {
      timeout: 5000
    });
    console.log('✅ Backend API accessible:', apiResponse.status);
  } catch (error) {
    console.log('❌ Backend API not accessible:', error.message);
  }

  // Test specific auth endpoint
  console.log('\nTesting Auth endpoint...');
  try {
    const authResponse = await fetch('http://localhost:3001/api/auth/profile', {
      timeout: 5000
    });
    console.log('✅ Auth endpoint accessible:', authResponse.status, '(401 expected without token)');
  } catch (error) {
    console.log('❌ Auth endpoint not accessible:', error.message);
  }
}

testPorts();
