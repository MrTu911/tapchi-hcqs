async function testNormalUserRegistration() {
  console.log('🧪 Testing Normal User Registration (Should Need Approval)...\n')
  
  const registerData = {
    email: 'author.test@tapchi.vn',
    password: 'Author@123456',
    fullName: 'Author Test Account',
    org: 'Đại học ABC',
    phone: '0987654321',
    role: 'AUTHOR'
  }
  
  console.log('📤 Sending registration request...')
  console.log('   Email:', registerData.email)
  console.log('   Role:', registerData.role)
  
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(registerData)
  })
  
  console.log('\n📥 Response:', response.status, response.statusText)
  
  const data = await response.json()
  console.log('\n📋 Registration response:')
  console.log(JSON.stringify(data, null, 2))
  
  if (response.ok) {
    console.log('\n✅ User registered successfully')
    console.log('   Status:', data.data.status)
    console.log('   IsActive:', data.data.isActive)
    console.log('   EmailVerified:', data.data.emailVerified)
    
    // Now try to login
    console.log('\n🔐 Attempting to login...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: registerData.email,
        password: registerData.password
      })
    })
    
    const loginData = await loginResponse.json()
    console.log('\n📥 Login response:', loginResponse.status)
    console.log(JSON.stringify(loginData, null, 2))
    
    if (loginResponse.status === 403) {
      console.log('\n✅ CORRECT! User cannot login - waiting for approval')
      console.log('🎉 Normal user flow works as expected!')
    } else if (loginResponse.ok) {
      console.log('\n❌ ERROR! User should NOT be able to login before approval')
    }
  }
}

testNormalUserRegistration()
  .catch(error => {
    console.error('\n❌ Test error:', error.message)
  })
