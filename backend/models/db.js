const mysql = require("mysql2");
const path = require('path');
const fs = require('fs');

// Robust environment detection
const isProd = process.env.NODE_ENV === "production";
const envFile = isProd ? ".env.production" : ".env";

// Try multiple path resolutions for Plesk/Production reliability
const possiblePaths = [
  path.resolve(__dirname, '..', envFile),      // backend/.env.production
  path.resolve(process.cwd(), envFile),        // current working directory
  path.resolve(process.cwd(), 'backend', envFile) // root/backend/.env.production
];

let envPath = possiblePaths[0];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

require('dotenv').config({ path: envPath });
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📡 Loading DB config from: ${envPath}`);

const dbConfig = {
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_barber',
  port: parseInt(process.env.DB_PORT || "3306", 10),
};

const pool = mysql.createPool({
  connectionLimit: 10,
  connectTimeout: 30000,
  charset: 'utf8mb4',
  ...dbConfig
});

const connectWithRetry = (retries = 3, delay = 1000) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error(`❌ Database connection failed (attempt ${4 - retries}/${3}):`, err.message);
      console.error('Config:', dbConfig);
      if (retries > 0) {
        setTimeout(() => connectWithRetry(retries - 1, delay * 2), delay);
      }
    } else {
      console.log('✅ Database connected successfully');
      connection.release();
      initializeDatabase();
    }
  });
};

connectWithRetry();

const initializeDatabase = async () => {
  const tableDefinitions = [
    {
      name: 'employees',
      create: `CREATE TABLE IF NOT EXISTS \`employees\` (
        \`employee_id\` int(11) NOT NULL PRIMARY KEY,
        \`name\` varchar(100) NOT NULL,
        \`role_id\` int(11) DEFAULT NULL,
        \`department_id\` int(11) DEFAULT NULL,
        \`supervisor_id\` int(11) DEFAULT NULL,
        \`fname\` varchar(255) DEFAULT NULL,
        \`lname\` varchar(255) DEFAULT NULL,
        \`email\` varchar(255) DEFAULT NULL,
        \`phone\` varchar(20) DEFAULT NULL,
        \`sex\` enum('M','F') DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'employee_id', definition: 'int(11) NOT NULL PRIMARY KEY' },
        { name: 'name', definition: 'varchar(100) NOT NULL' },
        { name: 'role_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'department_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'supervisor_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'fname', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'lname', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'email', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'phone', definition: 'varchar(20) DEFAULT NULL' },
        { name: 'sex', definition: "enum('M','F') DEFAULT NULL" }
      ]
    },
    {
      name: 'service_categories',
      create: `CREATE TABLE IF NOT EXISTS \`service_categories\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`category_name\` varchar(100) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`icon\` varchar(50) DEFAULT NULL,
        \`category_icon\` varchar(50) DEFAULT NULL,
        \`image_url\` varchar(255) DEFAULT NULL,
        \`category_image\` varchar(255) DEFAULT NULL,
        \`status\` enum('active','inactive') DEFAULT 'active',
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'category_name', definition: 'varchar(100) NOT NULL' },
        { name: 'description', definition: 'text DEFAULT NULL' },
        { name: 'icon', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'category_icon', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'image_url', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'category_image', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'status', definition: "enum('active','inactive') DEFAULT 'active'" },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'services',
      create: `CREATE TABLE IF NOT EXISTS \`services\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`service_name\` varchar(150) NOT NULL,
        \`service_slug\` varchar(150) DEFAULT NULL,
        \`short_description\` text DEFAULT NULL,
        \`description\` text DEFAULT NULL,
        \`price\` decimal(10,2) NOT NULL,
        \`discount_price\` decimal(10,2) DEFAULT NULL,
        \`duration\` int(11) NOT NULL DEFAULT 30,
        \`duration_minutes\` int(11) NOT NULL DEFAULT 30,
        \`category_id\` int(11) DEFAULT NULL,
        \`barber_id\` int(11) DEFAULT NULL,
        \`is_available\` tinyint(1) DEFAULT 1,
        \`status\` enum('active','inactive') DEFAULT 'active',
        \`is_featured\` tinyint(1) DEFAULT 0,
        \`image_url\` varchar(255) DEFAULT NULL,
        \`service_image\` varchar(255) DEFAULT NULL,
        \`service_icon\` varchar(50) DEFAULT NULL,
        \`max_customers_per_slot\` int(11) DEFAULT 1,
        \`preparation_time\` int(11) DEFAULT 0,
        \`cleanup_time\` int(11) DEFAULT 0,
        \`booking_buffer_time\` int(11) DEFAULT 0,
        \`service_type\` varchar(50) DEFAULT 'standard',
        \`created_by\` int(11) DEFAULT NULL,
        \`updated_by\` int(11) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'service_name', definition: 'varchar(150) NOT NULL' },
        { name: 'service_slug', definition: 'varchar(150) DEFAULT NULL' },
        { name: 'short_description', definition: 'text DEFAULT NULL' },
        { name: 'description', definition: 'text DEFAULT NULL' },
        { name: 'price', definition: 'decimal(10,2) NOT NULL' },
        { name: 'discount_price', definition: 'decimal(10,2) DEFAULT NULL' },
        { name: 'duration', definition: 'int(11) NOT NULL DEFAULT 30' },
        { name: 'duration_minutes', definition: 'int(11) NOT NULL DEFAULT 30' },
        { name: 'category_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'barber_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'is_available', definition: 'tinyint(1) DEFAULT 1' },
        { name: 'status', definition: "enum('active','inactive') DEFAULT 'active'" },
        { name: 'is_featured', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'image_url', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'service_image', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'service_icon', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'max_customers_per_slot', definition: 'int(11) DEFAULT 1' },
        { name: 'preparation_time', definition: 'int(11) DEFAULT 0' },
        { name: 'cleanup_time', definition: 'int(11) DEFAULT 0' },
        { name: 'booking_buffer_time', definition: 'int(11) DEFAULT 0' },
        { name: 'service_type', definition: "varchar(50) DEFAULT 'standard'" },
        { name: 'created_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'updated_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'service_bookings',
      create: `CREATE TABLE IF NOT EXISTS \`service_bookings\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`service_id\` int(11) NOT NULL,
        \`customer_id\` int(11) DEFAULT NULL,
        \`barber_id\` int(11) DEFAULT NULL,
        \`availability_slot_id\` int(11) DEFAULT NULL,
        \`customer_name\` varchar(100) NOT NULL,
        \`customer_email\` varchar(100) NOT NULL,
        \`customer_phone\` varchar(20) DEFAULT NULL,
        \`appointment_date\` date NOT NULL,
        \`appointment_time\` time NOT NULL,
        \`status\` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
        \`booking_status\` enum('pending','approved','rejected','confirmed','cancelled','completed') DEFAULT 'pending',
        \`approval_status\` enum('waiting','pending','approved','rejected') DEFAULT 'pending',
        \`rejection_reason\` text DEFAULT NULL,
        \`booking_note\` text DEFAULT NULL,
        \`reference_number\` varchar(50) DEFAULT NULL,
        \`queue_status\` enum('not_started','queued','serving','completed','cancelled') DEFAULT 'queued',
        \`reminder_sent\` tinyint(1) DEFAULT 0,
        \`created_by\` int(11) DEFAULT NULL,
        \`updated_by\` int(11) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'service_id', definition: 'int(11) NOT NULL' },
        { name: 'customer_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'barber_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'availability_slot_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'customer_name', definition: 'varchar(100) NOT NULL' },
        { name: 'customer_email', definition: 'varchar(100) NOT NULL' },
        { name: 'customer_phone', definition: 'varchar(20) DEFAULT NULL' },
        { name: 'appointment_date', definition: 'date NOT NULL' },
        { name: 'appointment_time', definition: 'time NOT NULL' },
        { name: 'status', definition: "enum('pending','confirmed','completed','cancelled') DEFAULT 'pending'" },
        { name: 'booking_status', definition: "enum('pending','approved','rejected','confirmed','cancelled','completed') DEFAULT 'pending'" },
        { name: 'approval_status', definition: "enum('waiting','pending','approved','rejected') DEFAULT 'pending'" },
        { name: 'rejection_reason', definition: 'text DEFAULT NULL' },
        { name: 'booking_note', definition: 'text DEFAULT NULL' },
        { name: 'reference_number', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'queue_status', definition: "enum('not_started','queued','serving','completed','cancelled') DEFAULT 'queued'" },
        { name: 'reminder_sent', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'created_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'updated_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'queues',
      create: `CREATE TABLE IF NOT EXISTS \`queues\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`booking_id\` int(11) NOT NULL,
        \`reference_number\` varchar(50) DEFAULT NULL,
        \`queue_position\` int(11) NOT NULL,
        \`estimated_wait_time\` int(11) DEFAULT 0,
        \`queue_status\` enum('not_started','queued','waiting','serving','completed','cancelled') DEFAULT 'queued',
        \`status\` enum('waiting','serving','completed','cancelled','queued','not_started') DEFAULT 'waiting',
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'booking_id', definition: 'int(11) NOT NULL' },
        { name: 'reference_number', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'queue_position', definition: 'int(11) NOT NULL' },
        { name: 'estimated_wait_time', definition: 'int(11) DEFAULT 0' },
        { name: 'queue_status', definition: "enum('not_started','queued','waiting','serving','completed','cancelled') DEFAULT 'queued'" },
        { name: 'status', definition: "enum('waiting','serving','completed','cancelled','queued','not_started') DEFAULT 'waiting'" },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'booking_reviews',
      create: `CREATE TABLE IF NOT EXISTS \`booking_reviews\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`booking_id\` int(11) NOT NULL,
        \`customer_id\` int(11) DEFAULT NULL,
        \`service_id\` int(11) DEFAULT NULL,
        \`barber_id\` int(11) DEFAULT NULL,
        \`reviewed_by\` int(11) DEFAULT NULL,
        \`review_status\` varchar(50) DEFAULT 'pending',
        \`moved_to_queue\` tinyint(1) DEFAULT 0,
        \`queue_position\` int(11) DEFAULT NULL,
        \`confirmed_date\` date DEFAULT NULL,
        \`confirmed_time\` time DEFAULT NULL,
        \`reviewed_at\` datetime DEFAULT NULL,
        \`rejection_reason\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'booking_id', definition: 'int(11) NOT NULL' },
        { name: 'customer_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'service_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'barber_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'reviewed_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'review_status', definition: "varchar(50) DEFAULT 'pending'" },
        { name: 'moved_to_queue', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'queue_position', definition: 'int(11) DEFAULT NULL' },
        { name: 'confirmed_date', definition: 'date DEFAULT NULL' },
        { name: 'confirmed_time', definition: 'time DEFAULT NULL' },
        { name: 'reviewed_at', definition: 'datetime DEFAULT NULL' },
        { name: 'rejection_reason', definition: 'text DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'cms_menus',
      create: `CREATE TABLE IF NOT EXISTS \`cms_menus\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`title\` varchar(100) NOT NULL,
        \`path\` varchar(255) DEFAULT NULL,
        \`icon\` text DEFAULT NULL,
        \`color\` varchar(50) DEFAULT NULL,
        \`parent_id\` int(11) DEFAULT NULL,
        \`order_index\` int(11) DEFAULT 0,
        \`is_section\` tinyint(1) DEFAULT 0,
        \`is_dropdown\` tinyint(1) DEFAULT 0,
        \`is_active\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'title', definition: 'varchar(100) NOT NULL' },
        { name: 'path', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'icon', definition: 'text DEFAULT NULL' },
        { name: 'color', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'parent_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'order_index', definition: 'int(11) DEFAULT 0' },
        { name: 'is_section', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'is_dropdown', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'is_active', definition: 'tinyint(1) DEFAULT 1' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'role_menu_permissions',
      create: `CREATE TABLE IF NOT EXISTS \`role_menu_permissions\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`role_id\` int(11) NOT NULL,
        \`menu_id\` int(11) NOT NULL,
        \`can_view\` tinyint(1) DEFAULT 1,
        \`can_create\` tinyint(1) DEFAULT 0,
        \`can_edit\` tinyint(1) DEFAULT 0,
        \`can_delete\` tinyint(1) DEFAULT 0,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        UNIQUE KEY \`role_menu_unique\` (\`role_id\`,\`menu_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'role_id', definition: 'int(11) NOT NULL' },
        { name: 'menu_id', definition: 'int(11) NOT NULL' },
        { name: 'can_view', definition: 'tinyint(1) DEFAULT 1' },
        { name: 'can_create', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'can_edit', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'can_delete', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    },
    {
      name: 'user_menu_permissions',
      create: `CREATE TABLE IF NOT EXISTS \`user_menu_permissions\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` int(11) NOT NULL,
        \`menu_id\` int(11) NOT NULL,
        \`permission_type\` enum('allow','deny') NOT NULL DEFAULT 'allow',
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        UNIQUE KEY \`user_menu_unique\` (\`user_id\`,\`menu_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'user_id', definition: 'int(11) NOT NULL' },
        { name: 'menu_id', definition: 'int(11) NOT NULL' },
        { name: 'permission_type', definition: "enum('allow','deny') NOT NULL DEFAULT 'allow'" },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    },
    {
      name: 'service_ratings',
      create: `CREATE TABLE IF NOT EXISTS \`service_ratings\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`booking_id\` int(11) NOT NULL,
        \`service_id\` int(11) NOT NULL,
        \`customer_id\` int(11) DEFAULT NULL,
        \`rating\` int(11) DEFAULT NULL,
        \`review\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'booking_id', definition: 'int(11) NOT NULL' },
        { name: 'service_id', definition: 'int(11) NOT NULL' },
        { name: 'customer_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'rating', definition: 'int(11) DEFAULT NULL' },
        { name: 'review', definition: 'text DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    },
    {
      name: 'availability_slots',
      create: `CREATE TABLE IF NOT EXISTS \`availability_slots\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`barber_id\` int(11) DEFAULT NULL,
        \`service_id\` int(11) DEFAULT NULL,
        \`available_date\` date NOT NULL,
        \`start_time\` time NOT NULL,
        \`end_time\` time NOT NULL,
        \`max_bookings\` int(11) NOT NULL DEFAULT 1,
        \`current_bookings\` int(11) DEFAULT 0,
        \`slot_status\` varchar(50) DEFAULT 'available',
        \`notes\` text DEFAULT NULL,
        \`created_by\` int(11) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'barber_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'service_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'available_date', definition: 'date NOT NULL' },
        { name: 'start_time', definition: 'time NOT NULL' },
        { name: 'end_time', definition: 'time NOT NULL' },
        { name: 'max_bookings', definition: 'int(11) NOT NULL DEFAULT 1' },
        { name: 'current_bookings', definition: 'int(11) DEFAULT 0' },
        { name: 'slot_status', definition: "varchar(50) DEFAULT 'available'" },
        { name: 'notes', definition: 'text DEFAULT NULL' },
        { name: 'created_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'revoked_tokens',
      create: `CREATE TABLE IF NOT EXISTS \`revoked_tokens\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`token\` text NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'token', definition: 'text NOT NULL' },
        { name: 'expires_at', definition: 'datetime NOT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    },
    {
      name: 'active_sessions',
      create: `CREATE TABLE IF NOT EXISTS \`active_sessions\` (
        \`user_id\` int(11) NOT NULL PRIMARY KEY,
        \`jti\` varchar(255) NOT NULL,
        \`ip_address\` varchar(100) DEFAULT NULL,
        \`user_agent\` text DEFAULT NULL,
        \`last_activity\` datetime NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'user_id', definition: 'int(11) NOT NULL PRIMARY KEY' },
        { name: 'jti', definition: 'varchar(255) NOT NULL' },
        { name: 'ip_address', definition: 'varchar(100) DEFAULT NULL' },
        { name: 'user_agent', definition: 'text DEFAULT NULL' },
        { name: 'last_activity', definition: 'datetime NOT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'blocked_ips',
      create: `CREATE TABLE IF NOT EXISTS \`blocked_ips\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`ip_address\` varchar(100) NOT NULL,
        \`reason\` varchar(255) DEFAULT NULL,
        \`blocked_at\` datetime DEFAULT current_timestamp(),
        \`blocked_until\` datetime DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'ip_address', definition: 'varchar(100) NOT NULL' },
        { name: 'reason', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'blocked_at', definition: 'datetime DEFAULT current_timestamp()' },
        { name: 'blocked_until', definition: 'datetime DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    }
  ];

  for (const table of tableDefinitions) {
    try {
      await pool.promise().query(table.create);
      console.log(`✅ Ensured table exists: ${table.name}`);
    } catch (err) {
      console.error(`❌ Failed to ensure table ${table.name}:`, err.message);
    }

    for (const col of table.columns) {
      try {
        const [rows] = await pool.promise().query(
          `SELECT COUNT(*) as cnt FROM information_schema.columns 
           WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
          [dbConfig.database, table.name, col.name]
        );
        
        if (rows[0].cnt === 0) {
          await pool.promise().query(`ALTER TABLE \`${table.name}\` ADD COLUMN \`${col.name}\` ${col.definition}`);
          console.log(`  ➕ Added missing column: ${table.name}.${col.name}`);
        }
      } catch (err) {
        console.error(`  ❌ Failed to check/add column ${table.name}.${col.name}:`, err.message);
      }
    }
  }

  // Seed menus if empty
  try {
    const [menuCount] = await pool.promise().query("SELECT COUNT(*) as count FROM cms_menus");
    if (menuCount[0].count === 0) {
      console.log("🌱 Seeding cms_menus table...");
      const jsonPath = path.resolve(__dirname, "..", "all_menus_utf8.json");
      let menuData = [];
      if (fs.existsSync(jsonPath)) {
        try {
          menuData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        } catch (e) {
          console.error("Error reading all_menus_utf8.json:", e);
        }
      }

      // Add default service management menus
      const extraServiceMenus = [
        { id: 50, title: "Services", path: "/services", icon: null, color: "blue", parent_id: 1, order_index: 50, is_section: 0, is_dropdown: 1, is_active: 1 },
        { id: 51, title: "Categories", path: "/services/categories", icon: null, color: "blue", parent_id: 50, order_index: 1, is_section: 0, is_dropdown: 0, is_active: 1 },
        { id: 52, title: "Bookings", path: "/service-bookings", icon: null, color: "blue", parent_id: 50, order_index: 2, is_section: 0, is_dropdown: 0, is_active: 1 },
        { id: 53, title: "Queues", path: "/queues", icon: null, color: "blue", parent_id: 50, order_index: 3, is_section: 0, is_dropdown: 0, is_active: 1 },
        { id: 54, title: "Availability", path: "/services/availability", icon: null, color: "blue", parent_id: 50, order_index: 4, is_section: 0, is_dropdown: 0, is_active: 1 },
      ];

      for (const extra of extraServiceMenus) {
        if (!menuData.some((m) => m.id === extra.id)) {
          menuData.push(extra);
        }
      }

      for (const item of menuData) {
        await pool.promise().query(
          `INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.title,
            item.path || null,
            item.icon || null,
            item.color || 'blue',
            item.parent_id || null,
            item.order_index || 0,
            item.is_section ? 1 : 0,
            item.is_dropdown ? 1 : 0,
            item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1,
          ]
        );
      }
      console.log("✅ Seeded cms_menus successfully");
    }
  } catch (err) {
    console.error("❌ Failed to seed cms_menus:", err.message);
  }

  // Seed role permissions if empty
  try {
    const [permCount] = await pool.promise().query("SELECT COUNT(*) as count FROM role_menu_permissions");
    if (permCount[0].count === 0) {
      console.log("🌱 Seeding role_menu_permissions...");
      const [allMenus] = await pool.promise().query("SELECT id FROM cms_menus");
      for (const m of allMenus) {
        // Admin (Role 1) and Manager (Role 4): full access
        for (const roleId of [1, 4]) {
          await pool.promise().query(
            "INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 1)",
            [roleId, m.id]
          );
        }
        // Barber (Role 2) and Customer (Role 3): view access
        for (const roleId of [2, 3]) {
          await pool.promise().query(
            "INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 0, 0, 0)",
            [roleId, m.id]
          );
        }
      }
      console.log("✅ Seeded role_menu_permissions successfully");
    }
  } catch (err) {
    console.error("❌ Failed to seed role_menu_permissions:", err.message);
  }
};

setTimeout(() => {
  initializeDatabase();
}, 2000);

// Database configuration loaded successfully (mysql2)

module.exports = pool;


