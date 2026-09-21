const con = require('./models/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
    console.log('🌱 Starting comprehensive system database seeding...');

    // 1. Roles Check
    const [roles] = await con.promise().query('SELECT * FROM roles');
    console.log(`✅ Roles present: ${roles.length}`);

    // 2. Hash default password
    const defaultPassword = 'Astertamrat@9';
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    console.log('✅ Generated bcrypt password hash for Astertamrat@9');

    // 3. Seed Employees
    const employees = [
        { id: 9001, name: 'Nathan Tamrat', fname: 'Nathan', lname: 'Tamrat', email: 'nathan@ams.com', phone: '0911000001', role_id: 1, sex: 'M' },
        { id: 9002, name: 'System Admin', fname: 'System', lname: 'Admin', email: 'admin@ams.com', phone: '0911000002', role_id: 1, sex: 'M' },
        { id: 9003, name: 'Abebe Barber', fname: 'Abebe', lname: 'Kebede', email: 'barber@ams.com', phone: '0911000003', role_id: 2, sex: 'M' },
        { id: 9004, name: 'Sara Customer', fname: 'Sara', lname: 'Hailu', email: 'customer@ams.com', phone: '0911000004', role_id: 3, sex: 'F' },
        { id: 9005, name: 'Dawit Manager', fname: 'Dawit', lname: 'Bekele', email: 'manager@ams.com', phone: '0911000005', role_id: 4, sex: 'M' },
        { id: 9006, name: 'Tigist Receptionist', fname: 'Tigist', lname: 'Alemu', email: 'reception@ams.com', phone: '0911000006', role_id: 5, sex: 'F' }
    ];

    for (const emp of employees) {
        await con.promise().query(
            `INSERT INTO employees (employee_id, name, fname, lname, email, phone, role_id, sex)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name=VALUES(name), fname=VALUES(fname), lname=VALUES(lname), email=VALUES(email)`,
            [emp.id, emp.name, emp.fname, emp.lname, emp.email, emp.phone, emp.role_id, emp.sex]
        );
    }
    console.log(`✅ Seeded ${employees.length} employees`);

    // 4. Seed Users
    const users = [
        { id: 9001, employee_id: 9001, user_name: 'nathan27', role_id: 1 },
        { id: 9002, employee_id: 9002, user_name: 'admin', role_id: 1 },
        { id: 9003, employee_id: 9003, user_name: 'barber1', role_id: 2 },
        { id: 9004, employee_id: 9004, user_name: 'customer1', role_id: 3 },
        { id: 9005, employee_id: 9005, user_name: 'manager1', role_id: 4 },
        { id: 9006, employee_id: 9006, user_name: 'receptionist1', role_id: 5 }
    ];

    for (const u of users) {
        await con.promise().query(
            `INSERT INTO users (user_id, employee_id, user_name, password, status, online_flag, role_id, failed_login_attempts)
             VALUES (?, ?, ?, ?, '1', 0, ?, 0)
             ON DUPLICATE KEY UPDATE password=VALUES(password), status='1', role_id=VALUES(role_id), failed_login_attempts=0, account_locked_until=NULL`,
            [u.id, u.employee_id, u.user_name, passwordHash, u.role_id]
        );
    }
    console.log(`✅ Seeded ${users.length} users with password "Astertamrat@9"`);

    // 5. Seed Services
    const sampleServices = [
        [1, 1, 'Classic Haircut', 'classic-haircut', 'Traditional professional haircut', 'Traditional haircut with scissor and clipper work.', 250.00, null, 30, 30, 1, 'active', 1, '/uploads/service-categories/haircut.jpg', '/uploads/service-categories/haircut.jpg', 'haircut'],
        [2, 1, 'Premium Fade', 'premium-fade', 'Modern fade haircut with precision', 'Skin fade, low fade, high fade, or mid fade with razor line-up.', 350.00, 300.00, 45, 45, 1, 'active', 1, '/uploads/service-categories/haircut.jpg', '/uploads/service-categories/haircut.jpg', 'haircut'],
        [3, 1, 'Buzz Cut', 'buzz-cut', 'Quick and clean all-over cut', 'Fast all-over clipper cut.', 150.00, null, 15, 15, 1, 'active', 0, '/uploads/service-categories/haircut.jpg', '/uploads/service-categories/haircut.jpg', 'haircut'],
        [4, 2, 'Beard Trim & Shape', 'beard-trim-shape', 'Professional beard trimming and shaping', 'Precision beard trimming and shaping with razor edge line-up.', 150.00, null, 20, 20, 1, 'active', 0, '/uploads/service-categories/beard.jpg', '/uploads/service-categories/beard.jpg', 'beard_trim'],
        [5, 2, 'Hot Towel Shave', 'hot-towel-shave', 'Luxury straight razor shave', 'Traditional hot towel straight razor shave with pre-shave oil.', 300.00, null, 30, 30, 1, 'active', 1, '/uploads/service-categories/beard.jpg', '/uploads/service-categories/beard.jpg', 'beard_trim'],
        [6, 3, 'Executive Package', 'executive-package', 'Complete grooming package', 'Haircut + Beard trim + Hot towel treatment + Face mask.', 600.00, 550.00, 90, 90, 1, 'active', 1, '/uploads/service-categories/premium.jpg', '/uploads/service-categories/premium.jpg', 'combo'],
        [7, 3, 'VIP Royal Treatment', 'vip-royal-treatment', 'Ultimate luxury grooming experience', 'Full VIP service: Premium haircut, hot towel shave, facial.', 1200.00, 1000.00, 120, 120, 1, 'active', 1, '/uploads/service-categories/premium.jpg', '/uploads/service-categories/premium.jpg', 'vip'],
        [8, 4, 'Hair Coloring', 'hair-coloring', 'Professional hair coloring service', 'Full head hair coloring with premium products.', 500.00, null, 60, 60, 1, 'active', 0, '/uploads/service-categories/treatments.jpg', '/uploads/service-categories/treatments.jpg', 'hair_coloring'],
        [9, 4, 'Hair Wash & Conditioning', 'hair-wash-conditioning', 'Deep cleansing and conditioning', 'Professional hair wash with scalp massage.', 100.00, null, 20, 20, 1, 'active', 0, '/uploads/service-categories/treatments.jpg', '/uploads/service-categories/treatments.jpg', 'hair_wash'],
        [10, 5, 'Kids Haircut', 'kids-haircut', 'Haircut for children (under 12)', 'Patient and fun haircut service specially designed for children.', 200.00, null, 25, 25, 1, 'active', 0, '/uploads/service-categories/kids.jpg', '/uploads/service-categories/kids.jpg', 'kids']
    ];

    for (const s of sampleServices) {
        await con.promise().query(
            `INSERT INTO services (id, category_id, service_name, service_slug, short_description, description, price, discount_price, duration, duration_minutes, is_available, status, is_featured, image_url, service_image, service_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE service_name=VALUES(service_name), price=VALUES(price), status=VALUES(status)`,
            s
        );
    }
    console.log(`✅ Seeded ${sampleServices.length} services`);

    // 6. Check counts
    const [cats] = await con.promise().query('SELECT id, category_name FROM service_categories');
    console.log(`✅ Service categories in DB: ${cats.length}`);
    const [svcs] = await con.promise().query('SELECT id, service_name, price FROM services');
    console.log(`✅ Services in DB: ${svcs.length}`);
    const [allUsers] = await con.promise().query('SELECT user_id, user_name, role_id, status FROM users');
    console.log(`✅ Users in DB: ${allUsers.length}`);

    // 7. Ensure upload images exist in uploads/services too
    const uploadBase = path.join(__dirname, 'uploads');
    const serviceUploadDir = path.join(uploadBase, 'services');
    if (!fs.existsSync(serviceUploadDir)) fs.mkdirSync(serviceUploadDir, { recursive: true });

    const catUploadDir = path.join(uploadBase, 'service-categories');
    const catFiles = fs.readdirSync(catUploadDir);
    for (const f of catFiles) {
        const src = path.join(catUploadDir, f);
        const dest = path.join(serviceUploadDir, f);
        if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
        }
    }
    console.log(`✅ Synced category images to services uploads directory`);

    // 8. Generate availability slots for upcoming 7 days
    const times = [
        ['09:00:00', '09:30:00'],
        ['10:00:00', '10:30:00'],
        ['11:00:00', '11:30:00'],
        ['14:00:00', '14:30:00'],
        ['15:00:00', '15:30:00'],
        ['16:00:00', '16:30:00']
    ];
    const today = new Date();
    for (let day = 0; day < 7; day++) {
        const d = new Date(today);
        d.setDate(today.getDate() + day);
        const dateStr = d.toISOString().split('T')[0];
        for (const s of sampleServices) {
            for (const [st, et] of times) {
                await con.promise().query(
                    `INSERT IGNORE INTO availability_slots (service_id, barber_id, available_date, start_time, end_time, max_bookings, slot_status)
                     VALUES (?, 9003, ?, ?, ?, 1, 'available')`,
                    [s[0], dateStr, st, et]
                );
            }
        }
    }
    console.log(`✅ Generated availability slots for next 7 days`);

    console.log('\n🎉 Comprehensive database seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
