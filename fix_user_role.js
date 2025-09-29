const axios = require('axios');

async function fixUserRole() {
  try {
    console.log('🔧 [FIX USER ROLE] Starting user role fix...');
    
    // Make API call to fix the user role
    const response = await axios.post('https://salesbuddy-production.up.railway.app/api/companies/fix-user-role', {
      email: 'reiovendelin3@gmail.com',
      newRole: 'company_admin'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a valid token
      }
    });
    
    console.log('✅ [FIX USER ROLE] Success!', response.data);
  } catch (error) {
    console.error('❌ [FIX USER ROLE] Error:', error.response?.data || error.message);
  }
}

fixUserRole();
