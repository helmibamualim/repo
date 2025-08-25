const axios = require('axios');

const API_URL = 'http://localhost:3001/game'; // Ganti dengan URL backend Anda

async function testEndpoints() {
  try {
    // Test: Get all active tables
    const tablesResponse = await axios.get(`${API_URL}/tables`);
    console.log('Active Tables:', tablesResponse.data);

    // Test: Create a new table
    const createTableResponse = await axios.post(`${API_URL}/table/create`, {
      name: 'Test Table',
      maxPlayers: 6,
      minBet: 1000,
      maxBet: 10000,
      isPrivate: false,
    });
    console.log('Table Created:', createTableResponse.data);

    // Test: Join a table
    const joinTableResponse = await axios.post(`${API_URL}/table/join`, {
      tableId: createTableResponse.data.id,
      userId: 'your_user_id', // Ganti dengan ID pengguna yang valid
      chipsToPlay: 5000,
    });
    console.log('Joined Table:', joinTableResponse.data);

    // Test: Start game
    const startGameResponse = await axios.post(`${API_URL}/start`, {
      tableId: createTableResponse.data.id,
    });
    console.log('Game Started:', startGameResponse.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testEndpoints();
