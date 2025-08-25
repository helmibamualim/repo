const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api'; // Ganti dengan URL backend Anda

async function registerUser() {
  const userData = {
    username: 'newUser',
    email: 'newuser@example.com',
    password: 'password123',
    fullName: 'New User',
  };

  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Registrasi berhasil:', data);
    } else {
      console.error('Registrasi gagal:', data);
    }
  } catch (error) {
    console.error('Error saat registrasi:', error);
  }
}

registerUser();
