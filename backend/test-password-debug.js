const con = require('./models/db');
const bcrypt = require('bcryptjs');

console.log('Testing password verification...');

// Get user's password hash
con.query("SELECT user_id, user_name, password FROM users WHERE user_name = ?", ['nathan27'], async (err, res) => {
    if (err) {
        console.error('Error fetching user:', err);
        process.exit(1);
    }
    
    if (res.length === 0) {
        console.log('❌ User not found');
        process.exit(1);
    }
    
    const user = res[0];
    console.log('User found:', user.user_name);
    console.log('Password hash prefix:', user.password.substring(0, 20) + '...');
    
    // Test password verification
    const testPassword = 'Astertamrat@9';
    
    try {
        console.log('\nTesting password verification...');
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log('Password match result:', isMatch);
        
        if (isMatch) {
            console.log('✅ Password verification successful');
        } else {
            console.log('❌ Password verification failed');
            
            // Test with common variations
            const variations = [
                'Astertamrat@9',
                'astertamrat@9',
                'ASTERTAMRAT@9',
                'Astertamrat9',
                'astertamrat9'
            ];
            
            console.log('\nTesting password variations:');
            for (const variation of variations) {
                const match = await bcrypt.compare(variation, user.password);
                console.log(`"${variation}": ${match ? '✅' : '❌'}`);
            }
        }
        
        process.exit();
    } catch (error) {
        console.error('Bcrypt error:', error);
        process.exit(1);
    }
});
