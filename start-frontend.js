const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting frontend development server...');

// Start the Next.js development server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: './frontend',
  stdio: 'pipe',
  shell: true
});

frontend.stdout.on('data', (data) => {
  console.log(`Frontend: ${data}`);
});

frontend.stderr.on('data', (data) => {
  console.error(`Frontend Error: ${data}`);
});

// Function to check if server is ready
function checkServer(port, callback) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET',
    timeout: 1000
  };

  const req = http.request(options, (res) => {
    callback(null, res.statusCode);
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(new Error('Timeout'));
  });

  req.end();
}

// Wait for server to be ready
let attempts = 0;
const maxAttempts = 30;

function waitForServer() {
  attempts++;
  console.log(`⏳ Checking server readiness... (attempt ${attempts}/${maxAttempts})`);
  
  checkServer(3000, (err, statusCode) => {
    if (!err && statusCode) {
      console.log('✅ Frontend server is ready!');
      console.log('🌐 You can now access: http://localhost:3000/register');
      console.log('📝 Press Ctrl+C to stop the server');
    } else if (attempts < maxAttempts) {
      setTimeout(waitForServer, 2000);
    } else {
      console.log('❌ Server failed to start after maximum attempts');
      process.exit(1);
    }
  });
}

// Start checking after 5 seconds
setTimeout(waitForServer, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping frontend server...');
  frontend.kill();
  process.exit(0);
});
