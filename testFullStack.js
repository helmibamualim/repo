const http = require('http');

// Test Backend
function testBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testing Backend (http://localhost:3001)...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`✅ Backend responding! Status: ${res.statusCode}`);
        if (res.statusCode === 500) {
          console.log('⚠️  Backend has internal server error - likely database connection issue');
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log('❌ Backend not responding:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('❌ Backend timeout');
      req.destroy();
      reject(new Error('Backend timeout'));
    });

    // Send test registration data
    req.write(JSON.stringify({
      username: 'testuser123',
      email: 'test@example.com',
      password: 'password123'
    }));
    req.end();
  });
}

// Test Frontend
function testFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testing Frontend (http://localhost:3000)...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ Frontend responding! Status: ${res.statusCode}`);
      resolve({ status: res.statusCode });
    });

    req.on('error', (err) => {
      console.log('❌ Frontend not responding:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('❌ Frontend timeout');
      req.destroy();
      reject(new Error('Frontend timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Full Stack Test...\n');
  
  try {
    // Test Frontend
    await testFrontend();
    console.log('');
    
    // Test Backend
    await testBackend();
    console.log('');
    
    console.log('📋 Test Summary:');
    console.log('✅ Frontend: Running on http://localhost:3000');
    console.log('✅ Backend: Running on http://localhost:3001');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Check database connection in backend logs');
    console.log('2. Verify schema-mysql.sql was imported correctly');
    console.log('3. Test registration via browser');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- Make sure both frontend and backend servers are running');
    console.log('- Check if ports 3000 and 3001 are available');
    console.log('- Verify MySQL server is running');
  }
}

runTests();
