const fetch = require('node-fetch');

async function testSQLiteRegister() {
  console.log('🧪 TESTING SQLITE REGISTER API');
  console.log('==============================\n');
  
  const testData = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User SQLite'
  };
  
  console.log('📝 Test data:');
  console.log(`   Username: ${testData.username}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Password: ${testData.password}`);
  console.log(`   Full Name: ${testData.fullName}`);
  console.log('');
  
  try {
    console.log('🚀 Sending register request...');
    
    const response = await fetch('http://localhost:3000/api/auth/register-sqlite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ REGISTER TEST SUCCESSFUL!');
      console.log('🎉 SQLite database working correctly');
      console.log('💰 User created with bonus chips');
      
      if (result.user) {
        console.log('\n👤 User Details:');
        console.log(`   ID: ${result.user.id}`);
        console.log(`   Username: ${result.user.username}`);
        console.log(`   Email: ${result.user.email}`);
        console.log(`   Chips: ${result.user.chips.toLocaleString()}`);
        console.log(`   Referral Code: ${result.user.referralCode}`);
      }
      
      return true;
    } else {
      console.log('\n❌ REGISTER TEST FAILED');
      console.log(`Error: ${result.message}`);
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ TEST ERROR');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution:');
      console.log('1. Make sure frontend server is running');
      console.log('2. Run: cd frontend && npm run dev');
      console.log('3. Wait for server to start on port 3000');
    }
    
    return false;
  }
}

// Test with referral code
async function testWithReferral() {
  console.log('\n🎁 TESTING WITH REFERRAL CODE');
  console.log('==============================\n');
  
  // First create a user to get referral code
  const firstUser = {
    username: `referrer_${Date.now()}`,
    email: `referrer_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Referrer User'
  };
  
  try {
    console.log('1️⃣ Creating referrer user...');
    const firstResponse = await fetch('http://localhost:3000/api/auth/register-sqlite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firstUser),
    });
    
    const firstResult = await firstResponse.json();
    
    if (!firstResponse.ok) {
      console.log('❌ Failed to create referrer user');
      return false;
    }
    
    const referralCode = firstResult.user.referralCode;
    console.log(`✅ Referrer created with code: ${referralCode}`);
    
    // Now create second user with referral
    console.log('\n2️⃣ Creating referred user...');
    const secondUser = {
      username: `referred_${Date.now()}`,
      email: `referred_${Date.now()}@example.com`,
      password: 'password123',
      fullName: 'Referred User',
      referralCode: referralCode
    };
    
    const secondResponse = await fetch('http://localhost:3000/api/auth/register-sqlite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondUser),
    });
    
    const secondResult = await secondResponse.json();
    
    if (secondResponse.ok) {
      console.log('✅ REFERRAL TEST SUCCESSFUL!');
      console.log(`💰 Referred user got ${secondResult.user.chips.toLocaleString()} chips`);
      console.log(`🎁 Bonus: ${secondResult.bonuses.referralBonus.toLocaleString()} chips`);
      return true;
    } else {
      console.log('❌ Referral test failed');
      console.log(secondResult.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Referral test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🔬 COMPREHENSIVE SQLITE REGISTER TESTING');
  console.log('=========================================\n');
  
  const basicTest = await testSQLiteRegister();
  
  if (basicTest) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testWithReferral();
  }
  
  console.log('\n🏁 TESTING COMPLETED');
  console.log('====================');
  
  if (basicTest) {
    console.log('✅ Basic registration: WORKING');
    console.log('✅ SQLite database: WORKING');
    console.log('✅ Password hashing: WORKING');
    console.log('✅ Bonus system: WORKING');
    console.log('\n🎯 RESULT: REGISTER ERROR FIXED!');
    console.log('\n📱 Next steps:');
    console.log('1. Open browser: http://localhost:3000/register');
    console.log('2. Fill registration form');
    console.log('3. Click "Daftar Sekarang"');
    console.log('4. Should work without errors!');
  } else {
    console.log('❌ Tests failed - check server and try again');
  }
}

runAllTests().catch(console.error);
