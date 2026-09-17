/**
 * Role Migration Script
 * 
 * Run this ONCE to:
 * 1. Ensure all 5 system roles exist with the correct IDs
 * 2. Remap existing users from old role IDs to new role IDs
 *    - Old role_id=2 (was Barber) → new role_id=3 (Barber)
 *    - Old role_id=3 (was Customer) → new role_id=5 (Customer)
 * 3. Verify counts
 * 
 * Usage: node backend/migrations/run_role_migration.js
 */

const con = require('../models/db');
const db = con.promise();

const NEW_ROLES = [
    { role_id: 1, role_name: 'Admin',        status: 1 },
    { role_id: 2, role_name: 'Manager',      status: 1 },
    { role_id: 3, role_name: 'Barber',       status: 1 },
    { role_id: 4, role_name: 'Receptionist', status: 1 },
    { role_id: 5, role_name: 'Customer',     status: 1 },
];

async function runMigration() {
    console.log('\n========================================');
    console.log('  AMS Role Migration Script');
    console.log('========================================\n');

    try {
        // Step 1: Show current state
        const [currentRoles] = await db.query('SELECT role_id, role_name FROM roles ORDER BY role_id');
        console.log('[Step 1] Current roles in DB:');
        currentRoles.forEach(r => console.log(`  - ID=${r.role_id}: ${r.role_name}`));

        const [currentUsers] = await db.query(
            'SELECT role_id, COUNT(*) as count FROM users GROUP BY role_id ORDER BY role_id'
        );
        console.log('\n[Step 1] Current user role distribution:');
        currentUsers.forEach(r => console.log(`  - role_id=${r.role_id}: ${r.count} users`));

        // Step 2: Handle ID conflicts before inserting
        // We need role_id=4 (Receptionist) and role_id=5 (Customer) which may not exist
        // But role_id=2 currently means "Barber" and role_id=3 means "Customer"
        // We need to:
        //   a) Move existing role_id=3 users → temp id first, then to 5
        //   b) Move existing role_id=2 users → 3
        //   c) Set role_id=2 to Manager, role_id=3 to Barber, insert 4 & 5

        console.log('\n[Step 2] Remapping user role IDs...');

        // Temporarily move role_id=3 customers to role_id=99 (temp)
        const [r3] = await db.query('SELECT COUNT(*) as c FROM users WHERE role_id = 3');
        if (r3[0].c > 0) {
            await db.query('UPDATE users SET role_id = 99 WHERE role_id = 3');
            console.log(`  - Moved ${r3[0].c} role_id=3 (old Customer) users → temp role_id=99`);
        }

        // Move role_id=2 barbers → role_id=3 (new Barber ID)
        const [r2] = await db.query('SELECT COUNT(*) as c FROM users WHERE role_id = 2');
        if (r2[0].c > 0) {
            await db.query('UPDATE users SET role_id = 3 WHERE role_id = 2');
            console.log(`  - Moved ${r2[0].c} role_id=2 (old Barber) users → role_id=3 (new Barber)`);
        }

        // Move temp=99 customers → role_id=5 (new Customer ID)
        const [r99] = await db.query('SELECT COUNT(*) as c FROM users WHERE role_id = 99');
        if (r99[0].c > 0) {
            await db.query('UPDATE users SET role_id = 5 WHERE role_id = 99');
            console.log(`  - Moved ${r99[0].c} role_id=99 (temp Customer) users → role_id=5 (new Customer)`);
        }

        console.log('  ✅ User role IDs remapped.');

        // Step 3: Upsert all 5 system roles
        console.log('\n[Step 3] Upserting system roles...');
        for (const role of NEW_ROLES) {
            await db.query(
                `INSERT INTO roles (role_id, role_name, status)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), status = VALUES(status)`,
                [role.role_id, role.role_name, role.status]
            );
            console.log(`  ✅ Role ID=${role.role_id} "${role.role_name}" upserted.`);
        }

        // Step 4: Verify final state
        const [finalRoles] = await db.query('SELECT role_id, role_name, status FROM roles ORDER BY role_id');
        console.log('\n[Step 4] Final roles in DB:');
        finalRoles.forEach(r => console.log(`  - ID=${r.role_id}: ${r.role_name} (status=${r.status})`));

        const [finalUsers] = await db.query(
            'SELECT role_id, COUNT(*) as count FROM users GROUP BY role_id ORDER BY role_id'
        );
        console.log('\n[Step 4] Final user role distribution:');
        finalUsers.forEach(r => console.log(`  - role_id=${r.role_id}: ${r.count} users`));

        console.log('\n========================================');
        console.log('  ✅ Migration completed successfully!');
        console.log('========================================\n');
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error(err);
    } finally {
        process.exit(0);
    }
}

runMigration();
