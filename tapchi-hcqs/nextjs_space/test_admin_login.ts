async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...\n')
  
  const loginData = {
    email: 'admin.test@tapchi.vn',
    password: 'Admin@123456'
  }
  
  console.log('📤 Sending login request...')
  console.log('   Email:', loginData.email)
  
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  })
  
  console.log('\n📥 Response:', response.status, response.statusText)
  
  const data = await response.json()
  console.log('\n📋 Response data:')
  console.log(JSON.stringify(data, null, 2))
  
  if (response.ok) {
    console.log('\n✅ Admin login SUCCESSFUL!')
    console.log('🎉 Admin can login without approval as expected!')
  } else {
    console.log('\n❌ Login FAILED!')
    console.log('Error:', data.message)
  }
}

testAdminLogin()
  .catch(error => {
    console.error('\n❌ Test error:', error.message)
  })
