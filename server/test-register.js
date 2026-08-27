const { connectDB, disconnectDB } = require('./src/config/db');
const authService = require('./src/services/authService');
const User = require('./src/models/User');

async function testRegister() {
  await connectDB();
  
  const testEmail = `test_${Date.now()}@example.com`;
  console.log(`Attempting to register user with email: ${testEmail}`);
  
  try {
    const res = await authService.register({
      name: 'Test Student',
      email: testEmail,
      password: 'Password@123',
      role: 'student',
    });
    console.log('✅ Registration SUCCESS:', res.user);
  } catch (err) {
    console.error('❌ Registration FAILED:', err);
  }
  
  await disconnectDB();
  process.exit(0);
}

testRegister();
