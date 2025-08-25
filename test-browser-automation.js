const puppeteer = require('puppeteer');
const fs = require('fs');

async function testRegisterPage() {
  console.log('🌐 Starting browser automation test...\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`   Browser Console: ${msg.text()}`);
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log(`   Browser Error: ${error.message}`);
    });
    
    console.log('📱 Step 1: Navigating to register page...');
    await page.goto('http://localhost:3000/register', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Take screenshot
    await page.screenshot({ path: 'register-page-loaded.png' });
    console.log('   ✅ Register page loaded, screenshot saved\n');
    
    console.log('📝 Step 2: Filling registration form...');
    
    // Fill form fields
    await page.type('#username', 'testuser123');
    await page.type('#email', 'test@example.com');
    await page.type('#fullName', 'Test User');
    await page.type('#password', 'password123');
    await page.type('#confirmPassword', 'password123');
    
    console.log('   ✅ Form fields filled\n');
    
    // Take screenshot before submit
    await page.screenshot({ path: 'register-form-filled.png' });
    
    console.log('🚀 Step 3: Submitting registration form...');
    
    // Click register button
    await page.click('button[type="submit"]');
    
    // Wait for response (either success or error)
    await page.waitForTimeout(5000);
    
    // Take screenshot after submit
    await page.screenshot({ path: 'register-form-submitted.png' });
    
    // Check for success or error messages
    const pageContent = await page.content();
    
    if (pageContent.includes('Registrasi berhasil')) {
      console.log('   ✅ SUCCESS: Registration completed successfully!\n');
      
      // Check if redirected to login or home
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/') {
        console.log('   ✅ Redirect working correctly\n');
      }
      
    } else if (pageContent.includes('Terjadi kesalahan')) {
      console.log('   ❌ ERROR: Still getting "Terjadi kesalahan" message\n');
      
      // Check network tab for failed requests
      const failedRequests = [];
      page.on('requestfailed', request => {
        failedRequests.push({
          url: request.url(),
          failure: request.failure().errorText
        });
      });
      
      if (failedRequests.length > 0) {
        console.log('   Failed requests:');
        failedRequests.forEach(req => {
          console.log(`     - ${req.url}: ${req.failure}`);
        });
      }
      
    } else {
      console.log('   ⏳ Form submitted, checking response...\n');
      
      // Wait a bit more and check again
      await page.waitForTimeout(3000);
      const updatedContent = await page.content();
      
      if (updatedContent.includes('Registrasi berhasil')) {
        console.log('   ✅ SUCCESS: Registration completed (delayed response)!\n');
      } else {
        console.log('   ⚠️  Unknown response, check screenshots for details\n');
      }
    }
    
    console.log('📊 Step 4: Testing API endpoint directly...');
    
    // Test API endpoint directly
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'directtest123',
            email: 'directtest@example.com',
            password: 'password123',
            fullName: 'Direct Test User'
          }),
        });
        
        const data = await res.json();
        return {
          status: res.status,
          ok: res.ok,
          data: data
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('   API Response:', JSON.stringify(response, null, 2));
    
    if (response.ok) {
      console.log('   ✅ API endpoint working correctly!\n');
    } else {
      console.log('   ❌ API endpoint has issues\n');
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
    
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('\n🔧 Solution: Make sure frontend server is running:');
      console.log('   cd frontend && npm run dev');
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  testRegisterPage();
} catch (e) {
  console.log('📦 Puppeteer not installed. Installing...\n');
  
  const { spawn } = require('child_process');
  const install = spawn('npm', ['install', 'puppeteer'], {
    stdio: 'inherit',
    shell: true
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Puppeteer installed, running test...\n');
      testRegisterPage();
    } else {
      console.log('\n❌ Failed to install Puppeteer');
      console.log('Manual testing required:');
      console.log('1. Open browser: http://localhost:3000/register');
      console.log('2. Fill registration form');
      console.log('3. Click "Daftar Sekarang"');
      console.log('4. Check if error "Terjadi kesalahan" is resolved');
    }
  });
}
