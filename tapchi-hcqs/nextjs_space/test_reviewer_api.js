const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing permissions seed endpoint...');
    const seedResponse = await fetch('http://localhost:3000/api/permissions/seed', {
      method: 'POST'
    });
    const seedData = await seedResponse.json();
    console.log('Seed result:', seedData);
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
