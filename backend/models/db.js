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
      name: 'roles',
      create: `CREATE TABLE IF NOT EXISTS \`roles\` (
        \`role_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`role_name\` varchar(50) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`status\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'role_id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'role_name', definition: 'varchar(50) NOT NULL' },
        { name: 'description', definition: 'text DEFAULT NULL' },
        { name: 'status', definition: 'tinyint(1) DEFAULT 1' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
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
        \`banner_image\` varchar(255) DEFAULT NULL,
        \`color\` varchar(50) DEFAULT '#ec4899',
        \`sort_order\` int(11) DEFAULT 0,
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
        { name: 'banner_image', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'color', definition: "varchar(50) DEFAULT '#ec4899'" },
        { name: 'sort_order', definition: 'int(11) DEFAULT 0' },
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
        \`banner_image\` varchar(255) DEFAULT NULL,
        \`service_icon\` varchar(50) DEFAULT NULL,
        \`rating_avg\` decimal(3,2) DEFAULT 0.00,
        \`rating_count\` int(11) DEFAULT 0,
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
        { name: 'banner_image', definition: 'varchar(255) DEFAULT NULL' },
        { name: 'service_icon', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'rating_avg', definition: 'decimal(3,2) DEFAULT 0.00' },
        { name: 'rating_count', definition: 'int(11) DEFAULT 0' },
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
        \`booking_id\` bigint(20) unsigned DEFAULT NULL,
        \`service_id\` int(11) NOT NULL,
        \`user_id\` int(11) DEFAULT NULL,
        \`customer_id\` int(11) DEFAULT NULL,
        \`rating\` int(11) NOT NULL DEFAULT 5,
        \`review\` text DEFAULT NULL,
        \`review_text\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'booking_id', definition: 'bigint(20) unsigned DEFAULT NULL' },
        { name: 'service_id', definition: 'int(11) NOT NULL' },
        { name: 'user_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'customer_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'rating', definition: 'int(11) NOT NULL DEFAULT 5' },
        { name: 'review', definition: 'text DEFAULT NULL' },
        { name: 'review_text', definition: 'text DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
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
    },
    {
      name: 'complaints',
      create: `CREATE TABLE IF NOT EXISTS \`complaints\` (
        \`complaint_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` int(11) NOT NULL,
        \`title\` varchar(150) NOT NULL,
        \`category_id\` bigint(20) unsigned DEFAULT NULL,
        \`description\` text NOT NULL,
        \`status\` enum('Pending','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Pending',
        \`priority\` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
        \`tracking_number\` varchar(50) DEFAULT NULL,
        \`resolution_notes\` text DEFAULT NULL,
        \`is_escalated\` tinyint(1) DEFAULT 0,
        \`assigned_department_id\` int(11) DEFAULT NULL,
        \`assigned_to_user_id\` int(11) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'complaint_id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'user_id', definition: 'int(11) NOT NULL' },
        { name: 'title', definition: 'varchar(150) NOT NULL' },
        { name: 'category_id', definition: 'bigint(20) unsigned DEFAULT NULL' },
        { name: 'description', definition: 'text NOT NULL' },
        { name: 'status', definition: "enum('Pending','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Pending'" },
        { name: 'priority', definition: "enum('Low','Medium','High','Critical') DEFAULT 'Medium'" },
        { name: 'tracking_number', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'resolution_notes', definition: 'text DEFAULT NULL' },
        { name: 'is_escalated', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'assigned_department_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'assigned_to_user_id', definition: 'int(11) DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'complaint_assignees',
      create: `CREATE TABLE IF NOT EXISTS \`complaint_assignees\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`complaint_id\` int(11) NOT NULL,
        \`assignee_id\` int(11) NOT NULL,
        \`assigned_by\` int(11) DEFAULT NULL,
        \`assigned_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`unassigned_at\` timestamp NULL DEFAULT NULL,
        \`notes\` text DEFAULT NULL,
        \`is_active\` tinyint(1) DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'complaint_id', definition: 'int(11) NOT NULL' },
        { name: 'assignee_id', definition: 'int(11) NOT NULL' },
        { name: 'assigned_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'assigned_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'unassigned_at', definition: 'timestamp NULL DEFAULT NULL' },
        { name: 'notes', definition: 'text DEFAULT NULL' },
        { name: 'is_active', definition: 'tinyint(1) DEFAULT 1' }
      ]
    },
    {
      name: 'complaint_comments',
      create: `CREATE TABLE IF NOT EXISTS \`complaint_comments\` (
        \`comment_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`complaint_id\` int(11) NOT NULL,
        \`user_id\` int(11) NOT NULL,
        \`comment_text\` text NOT NULL,
        \`is_internal\` tinyint(1) DEFAULT 0,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'comment_id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'complaint_id', definition: 'int(11) NOT NULL' },
        { name: 'user_id', definition: 'int(11) NOT NULL' },
        { name: 'comment_text', definition: 'text NOT NULL' },
        { name: 'is_internal', definition: 'tinyint(1) DEFAULT 0' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' },
        { name: 'updated_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
      ]
    },
    {
      name: 'complaint_history',
      create: `CREATE TABLE IF NOT EXISTS \`complaint_history\` (
        \`history_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`complaint_id\` int(11) NOT NULL,
        \`changed_by\` int(11) DEFAULT NULL,
        \`old_status\` varchar(50) DEFAULT NULL,
        \`new_status\` varchar(50) DEFAULT NULL,
        \`change_notes\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'history_id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'complaint_id', definition: 'int(11) NOT NULL' },
        { name: 'changed_by', definition: 'int(11) DEFAULT NULL' },
        { name: 'old_status', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'new_status', definition: 'varchar(50) DEFAULT NULL' },
        { name: 'change_notes', definition: 'text DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    },
    {
      name: 'complaint_feedback',
      create: `CREATE TABLE IF NOT EXISTS \`complaint_feedback\` (
        \`feedback_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`complaint_id\` int(11) NOT NULL,
        \`user_id\` int(11) NOT NULL,
        \`rating\` int(11) DEFAULT NULL,
        \`comments\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'feedback_id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'complaint_id', definition: 'int(11) NOT NULL' },
        { name: 'user_id', definition: 'int(11) NOT NULL' },
        { name: 'rating', definition: 'int(11) DEFAULT NULL' },
        { name: 'comments', definition: 'text DEFAULT NULL' },
        { name: 'created_at', definition: 'timestamp NOT NULL DEFAULT current_timestamp()' }
      ]
    },
    {
      name: 'complaint_attachments',
      create: `CREATE TABLE IF NOT EXISTS \`complaint_attachments\` (
        \`attachment_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`complaint_id\` int(11) NOT NULL,
        \`file_name\` varchar(255) NOT NULL,
        \`file_path\` varchar(500) NOT NULL,
        \`file_size\` int(11) DEFAULT NULL,
        \`file_type\` varchar(100) DEFAULT NULL,
        \`uploaded_by\` int(11) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
      columns: [
        { name: 'attachment_id', definition: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY' },
        { name: 'complaint_id', definition: 'int(11) NOT NULL' },
        { name: 'file_name', definition: 'varchar(255) NOT NULL' },
        { name: 'file_path', definition: 'varchar(500) NOT NULL' },
        { name: 'file_size', definition: 'int(11) DEFAULT NULL' },
        { name: 'file_type', definition: 'varchar(100) DEFAULT NULL' },
        { name: 'uploaded_by', definition: 'int(11) DEFAULT NULL' },
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

  // Ensure service_ratings.booking_id allows NULL
  try {
    await pool.promise().query("ALTER TABLE `service_ratings` MODIFY COLUMN `booking_id` bigint(20) unsigned DEFAULT NULL");
  } catch (err) {
    // Ignore if table doesn't exist yet or already altered
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

  // Ensure special direct service actions in cms_menus for all roles
  try {
    const specialMenus = [
      {
        title: 'Book Service',
        path: '/services/book/12',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>',
        color: 'blue',
        parent_id: 100,
        order_index: 4
      },
      {
        title: 'Rate Service',
        path: '/rate-service/15',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>',
        color: 'yellow',
        parent_id: 100,
        order_index: 5
      }
    ];

    for (const sm of specialMenus) {
      const [ex] = await pool.promise().query("SELECT id FROM cms_menus WHERE path = ?", [sm.path]);
      let mId;
      if (ex.length === 0) {
        const [maxRes] = await pool.promise().query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cms_menus");
        const nextId = maxRes[0].next_id;
        await pool.promise().query(
          "INSERT INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1)",
          [nextId, sm.title, sm.path, sm.icon, sm.color, sm.parent_id, sm.order_index]
        );
        mId = nextId;
      } else {
        mId = ex[0].id;
      }
      for (const rId of [1, 2, 3, 4, 5]) {
        await pool.promise().query(
          "INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 0)",
          [rId, mId]
        );
      }
    }
  } catch (err) {
    // Non-blocking
  }

  // Seed Beauty Salon categories & services (self-contained inside models/db.js)
  try {
    const beautyCategories = [
      {
        id: 1,
        category_name: 'Hair Styling & Care',
        description: 'Expert haircuts, styling, vibrant coloring, balayage, and restorative hair treatments.',
        icon: 'fa-scissors',
        category_icon: 'fa-scissors',
        color: '#ec4899',
        sort_order: 1,
        image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      },
      {
        id: 2,
        category_name: 'Luxury Facials & Skincare',
        description: 'HydraFacials, deep cleansing, anti-aging therapies, and rejuvenating skin peel treatments.',
        icon: 'fa-spa',
        category_icon: 'fa-spa',
        color: '#a855f7',
        sort_order: 2,
        image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1512290900672-1f486427d11a?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      },
      {
        id: 3,
        category_name: 'Nail Bar & Pedicure',
        description: 'Deluxe spa pedicures, manicures, acrylic sculpting, and long-lasting gel nail art.',
        icon: 'fa-hand-sparkles',
        category_icon: 'fa-hand-sparkles',
        color: '#f43f5e',
        sort_order: 3,
        image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      },
      {
        id: 4,
        category_name: 'Bridal & Glam Makeup',
        description: 'Bespoke bridal makeovers, party glam, photoshoot aesthetics, and premium false lash applications.',
        icon: 'fa-wand-magic-sparkles',
        category_icon: 'fa-wand-magic-sparkles',
        color: '#d946ef',
        sort_order: 4,
        image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      },
      {
        id: 5,
        category_name: 'Body Spa & Massages',
        description: 'Swedish full-body massage, hot stone relaxation, aromatherapy, and exfoliating body polishes.',
        icon: 'fa-hot-tub-person',
        category_icon: 'fa-hot-tub-person',
        color: '#06b6d4',
        sort_order: 5,
        image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      },
      {
        id: 6,
        category_name: 'Waxing & Brow Sculpting',
        description: 'Precision eyebrow threading, tinting, and gentle silky full-body waxing services.',
        icon: 'fa-feather',
        category_icon: 'fa-feather',
        color: '#eab308',
        sort_order: 6,
        image_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      },
      {
        id: 7,
        category_name: 'Gentlemen Grooming',
        description: 'Classic skin fades, beard sculpt & contouring, and royal hot-towel steam shave treatments.',
        icon: 'fa-crown',
        category_icon: 'fa-crown',
        color: '#3b82f6',
        sort_order: 7,
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
        status: 'active'
      }
    ];

    for (const cat of beautyCategories) {
      await pool.promise().query(
        `INSERT INTO service_categories 
          (id, category_name, description, icon, category_icon, color, sort_order, image_url, category_image, banner_image, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          category_name=VALUES(category_name),
          description=VALUES(description),
          icon=VALUES(icon),
          category_icon=VALUES(category_icon),
          color=VALUES(color),
          sort_order=VALUES(sort_order),
          image_url=VALUES(image_url),
          category_image=VALUES(category_image),
          banner_image=VALUES(banner_image),
          status=VALUES(status)`,
        [
          cat.id, cat.category_name, cat.description, cat.icon, cat.category_icon,
          cat.color, cat.sort_order, cat.image_url, cat.image_url, cat.banner_image, cat.status
        ]
      );
    }

    const beautyServices = [
      {
        category_id: 1,
        service_name: 'Signature Blowout & Styling',
        service_slug: 'signature-blowout-styling',
        short_description: 'Volumizing wash, deep conditioning scalp massage, and red-carpet blowout styling.',
        description: 'Indulge in our salon signature blowout. Begins with an invigorating organic hair bath, conditioning scalp massage, and finished with a blowout that leaves hair silky, radiant, and bouncing with volume.',
        price: 450.00,
        discount_price: 380.00,
        duration: 45,
        duration_minutes: 45,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 4.90,
        rating_count: 24,
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-wind',
        service_type: 'hair'
      },
      {
        category_id: 1,
        service_name: 'Balayage & Color Glossing',
        service_slug: 'balayage-color-glossing',
        short_description: 'Hand-painted sun-kissed dimension with a nourishing gloss tone sealant.',
        description: 'Custom hand-painted French balayage highlights designed to enhance your natural tones with zero harsh demarcation lines. Includes a restorative bond builder and high-shine gloss toner.',
        price: 1800.00,
        discount_price: 1550.00,
        duration: 120,
        duration_minutes: 120,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 5.00,
        rating_count: 18,
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-palette',
        service_type: 'hair'
      },
      {
        category_id: 2,
        service_name: 'Hydra-Glow Deep Cleansing Facial',
        service_slug: 'hydra-glow-facial',
        short_description: 'Vortex suction infusion with hyaluronic acid, LED light therapy, and detox massage.',
        description: 'A non-invasive, multi-step treatment that combines the benefits of next-level hydra-dermabrasion, a chemical peel, automated painless extractions, and a special delivery of Antioxidants and Hyaluronic Acid for instantly glowing skin.',
        price: 950.00,
        discount_price: 850.00,
        duration: 60,
        duration_minutes: 60,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 4.95,
        rating_count: 32,
        image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1512290900672-1f486427d11a?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-droplet',
        service_type: 'skincare'
      },
      {
        category_id: 3,
        service_name: 'Deluxe Rosewater Pedicure & Gel Manicure',
        service_slug: 'deluxe-pedicure-gel-manicure',
        short_description: 'Organic rose petal foot bath, callus smoothing, massage, and chip-resistant gel polish.',
        description: 'Pure relaxation for hands and feet. Featuring a warm rose petal foot bath, organic sugar scrub exfoliation, hot towel wrap, hydrating paraffin dip, and high-shine LED gel manicure with custom nail art accent.',
        price: 750.00,
        discount_price: 680.00,
        duration: 75,
        duration_minutes: 75,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 4.88,
        rating_count: 19,
        image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-hand-sparkles',
        service_type: 'nails'
      },
      {
        category_id: 4,
        service_name: 'Royal Bridal Makeover Package',
        service_slug: 'royal-bridal-makeover',
        short_description: 'Complete high-definition bridal makeup, couture hairstyling, mink lashes, and veil setting.',
        description: 'Our premier VIP bridal beauty experience. Includes skin prep, airbrush or high-definition bridal makeup contouring, custom false lashes, bridal hairstyling with jewelry/veil pinning, and a touch-up emergency kit.',
        price: 3200.00,
        discount_price: 2900.00,
        duration: 150,
        duration_minutes: 150,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 5.00,
        rating_count: 15,
        image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-heart',
        service_type: 'bridal'
      },
      {
        category_id: 5,
        service_name: 'Swedish Aromatherapy Relaxing Massage',
        service_slug: 'swedish-aromatherapy-massage',
        short_description: 'Full-body stress relief using organic botanical essential oils and warm compress.',
        description: 'Melt away everyday tension and fatigue with a full-body rhythmic Swedish massage. Uses warm aromatic botanical oils, long fluid strokes, and pressure-point techniques to restore muscular ease and serenity.',
        price: 1100.00,
        discount_price: 950.00,
        duration: 60,
        duration_minutes: 60,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 4.92,
        rating_count: 27,
        image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-spa',
        service_type: 'spa'
      },
      {
        category_id: 7,
        service_name: 'VIP Royal Gentleman Cut & Hot Towel Shave',
        service_slug: 'vip-royal-gentleman-cut-shave',
        short_description: 'Precision scissor/clipper haircut, warm steam lather shave, and cold stone tonic splash.',
        description: 'The definitive gentlemen grooming ritual. Features an architected haircut, straight-razor neck line, hot herbal steam towels, pre-shave essential oils, straight-razor shave, and an ice-cold tonic skin soothing splash.',
        price: 650.00,
        discount_price: 550.00,
        duration: 60,
        duration_minutes: 60,
        is_available: 1,
        status: 'active',
        is_featured: 1,
        rating_avg: 4.96,
        rating_count: 41,
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
        service_image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
        banner_image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
        service_icon: 'fa-crown',
        service_type: 'barber'
      }
    ];

    for (const s of beautyServices) {
      const [existing] = await pool.promise().query(
        'SELECT id FROM services WHERE service_slug = ? LIMIT 1',
        [s.service_slug]
      );

      if (existing.length > 0) {
        await pool.promise().query(
          `UPDATE services SET
            category_id = ?, service_name = ?, short_description = ?, description = ?,
            price = ?, discount_price = ?, duration = ?, duration_minutes = ?,
            is_available = ?, status = ?, is_featured = ?, rating_avg = ?, rating_count = ?,
            image_url = ?, service_image = ?, banner_image = ?, service_icon = ?, service_type = ?
           WHERE id = ?`,
          [
            s.category_id, s.service_name, s.short_description, s.description,
            s.price, s.discount_price, s.duration, s.duration_minutes,
            s.is_available, s.status, s.is_featured, s.rating_avg, s.rating_count,
            s.image_url, s.service_image, s.banner_image, s.service_icon, s.service_type,
            existing[0].id
          ]
        );
      } else {
        await pool.promise().query(
          `INSERT INTO services 
            (category_id, service_name, service_slug, short_description, description,
             price, discount_price, duration, duration_minutes, is_available, status,
             is_featured, rating_avg, rating_count, image_url, service_image, banner_image,
             service_icon, service_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.category_id, s.service_name, s.service_slug, s.short_description, s.description,
            s.price, s.discount_price, s.duration, s.duration_minutes, s.is_available, s.status,
            s.is_featured, s.rating_avg, s.rating_count, s.image_url, s.service_image, s.banner_image,
            s.service_icon, s.service_type
          ]
        );
      }
    }

    const sampleRatings = [
      { service_slug: 'hydra-glow-facial', user_id: 9004, rating: 5, review: 'Absolute glow! My skin has never looked so fresh and radiant.' },
      { service_slug: 'signature-blowout-styling', user_id: 9004, rating: 5, review: 'Fantastic styling and head massage, lasted for 3 full days.' },
      { service_slug: 'swedish-aromatherapy-massage', user_id: 9004, rating: 5, review: 'Incredible deep relaxation. Highly recommend the lavender essential oil.' },
      { service_slug: 'deluxe-pedicure-gel-manicure', user_id: 9004, rating: 5, review: 'Flawless nail art and super soothing rosewater bath!' }
    ];

    for (const r of sampleRatings) {
      const [svc] = await pool.promise().query('SELECT id FROM services WHERE service_slug = ? LIMIT 1', [r.service_slug]);
      if (svc.length > 0) {
        const [existingRating] = await pool.promise().query(
          'SELECT id FROM service_ratings WHERE service_id = ? AND (user_id = ? OR customer_id = ?) LIMIT 1',
          [svc[0].id, r.user_id, r.user_id]
        );
        if (existingRating.length === 0) {
          await pool.promise().query(
            `INSERT INTO service_ratings (booking_id, service_id, user_id, customer_id, rating, review, review_text)
             VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
            [svc[0].id, r.user_id, r.user_id, r.rating, r.review, r.review]
          );
        }
      }
    }
    console.log('✅ Ensured Beauty Salon categories, services & sample ratings seeded');
  } catch (err) {
    console.warn("ℹ️ Beauty Salon seeding note:", err.message);
  }

  try {
    // Keep unpermitted legacy CMS modules deactivated
    const unpermittedLegacyIds = [1, 2, 4, 5, 7, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 50, 51, 52, 53, 54];
    await pool.promise().query('UPDATE cms_menus SET is_active = 0 WHERE id IN (?)', [unpermittedLegacyIds]);
  } catch (cleanErr) {
    console.warn("ℹ️ Menu cleanup note:", cleanErr.message);
  }
};

setTimeout(() => {
  initializeDatabase();
}, 2000);

// Database configuration loaded successfully (mysql2)

module.exports = pool;


