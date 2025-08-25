const http = require('http');

function testPort(port, callback) {
  const req = http.request({
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET',
    timeout: 2000
  }, (res) => {
    callback(null, `Port ${port}: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    callback(`Port ${port}: ${err.message}`);
  });

  req.on('timeout', () => {
    callback(`Port ${port}: Timeout`);
  });

  req.end();
}

console.log('Testing ports...');

testPort(3000, (err, result) => {
  console.log('Frontend:', err || result);
});

testPort(3001, (err, result) => {
  console.log('Backend:', err || result);
});

setTimeout(() => {
  console.log('Test completed');
}, 3000);
