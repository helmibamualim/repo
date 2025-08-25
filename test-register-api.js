const http = require('http');

// Test data
const testUser = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  fullName: 'Test User',
  referralCode: ''
};

function testRegisterAPI() {
  console.log('🧪 Testing Register API...');
  
  const postData = JSON.stringify({
    username: testUser.username,
    email: testUser.email,
    password: testUser.password,
    fullName: testUser.fullName,
    referralCode: testUser.referralCode
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📄 Response:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 201) {
          console.log('✅ Register API test PASSED!');
        } else if (res.statusCode === 500) {
          console.log('❌ Server Error - likely database connection issue');
          console.log('💡 Make sure MySQL server is running (Laragon/XAMPP)');
        } else if (res.statusCode === 409) {
          console.log('⚠️  User already exists - this is expected if testing multiple times');
        } else {
          console.log('❌ Register API test FAILED!');
        }
      } catch (error) {
        console.log('❌ Failed to parse response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 Make sure frontend server is running on port 3000');
      console.log('   Run: cd frontend && npm run dev');
    }
  });

  req.on('timeout', () => {
    console.log('⏰ Request timeout');
    req.destroy();
  });

  req.write(postData);
  req.end();
}

// Test if server is running first
function checkServer() {
  console.log('🔍 Checking if frontend server is running...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log('✅ Frontend server is running!');
    console.log('🚀 Starting API test...\n');
    testRegisterAPI();
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log('❌ Frontend server is not running on port 3000');
      console.log('💡 Please start the frontend server first:');
      console.log('   cd frontend && npm run dev');
    } else {
      console.log('❌ Error checking server:', err.message);
    }
  });

  req.on('timeout', () => {
    console.log('⏰ Server check timeout');
    req.destroy();
  });

  req.end();
}

checkServer();
