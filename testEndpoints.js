const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api'; // Ganti dengan URL backend Anda

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();

    if (response.ok) {
      console.log(`Endpoint ${endpoint} berhasil:`, data);
    } else {
      console.error(`Endpoint ${endpoint} gagal:`, data);
    }
  } catch (error) {
    console.error(`Error mengakses ${endpoint}:`, error);
  }
}

async function runTests() {
  console.log('Memulai pengujian endpoint...');

  // Daftar endpoint yang ingin diuji
  const endpoints = [
    '/auth/verify-token',
    '/auth/logout',
    // Tambahkan endpoint lain yang ingin diuji
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

runTests();
