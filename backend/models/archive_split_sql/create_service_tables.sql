-- ================================================
-- SERVICE MANAGEMENT MODULE - DATABASE SCHEMA
-- Barber Management System
-- ================================================

-- ------------------------------------------------
-- 1. Service Categories Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS service_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    image VARCHAR(500) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster lookups
CREATE INDEX idx_service_categories_status ON service_categories(status);
CREATE INDEX idx_service_categories_created_by ON service_categories(created_by);

-- ------------------------------------------------
-- 2. Services Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    barber_id INT NULL,
    service_name VARCHAR(200) NOT NULL,
    service_slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2) NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    service_image VARCHAR(500) NULL,
    service_icon VARCHAR(100) NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    max_customers_per_slot INT DEFAULT 1,
    preparation_time INT DEFAULT 0,
    cleanup_time INT DEFAULT 0,
    booking_buffer_time INT DEFAULT 0,
    service_type ENUM('standard', 'combo', 'home_service', 'vip') DEFAULT 'standard',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_barber_id ON services(barber_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_is_available ON services(is_available);
CREATE INDEX idx_services_is_featured ON services(is_featured);
CREATE INDEX idx_services_slug ON services(service_slug);
CREATE INDEX idx_services_created_by ON services(created_by);

-- ------------------------------------------------
-- 3. Service Bookings Table (booking_services)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS service_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference_number VARCHAR(50) NULL,
    customer_id INT NULL,
    service_id INT NOT NULL,
    barber_id INT NULL,
    availability_slot_id INT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(200) NULL,
    customer_phone VARCHAR(20) NULL,
    appointment_date DATE NULL,
    appointment_time TIME NULL,
    booking_note TEXT NULL,
    attachment_file VARCHAR(500) NULL,
    booking_status ENUM('pending', 'approved', 'queued', 'serving', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
    approval_status ENUM('waiting', 'approved', 'rejected') DEFAULT 'waiting',
    queue_status ENUM('not_started', 'queued', 'serving', 'completed') DEFAULT 'not_started',
    reminder_sent TINYINT(1) DEFAULT 0,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (availability_slot_id) REFERENCES availability_slots(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_service_bookings_service_id ON service_bookings(service_id);
CREATE INDEX idx_service_bookings_barber_id ON service_bookings(barber_id);
CREATE INDEX idx_service_bookings_date ON service_bookings(appointment_date);
CREATE INDEX idx_service_bookings_status ON service_bookings(booking_status);
CREATE INDEX idx_service_bookings_reference ON service_bookings(reference_number);
CREATE INDEX idx_service_bookings_reminder ON service_bookings(reminder_sent);

-- ================================================
-- SAMPLE DATA INSERTION (Optional for Testing)
-- ================================================

-- Insert sample categories
INSERT IGNORE INTO service_categories (category_name, description, status, created_by) VALUES
('Haircut', 'Professional haircut services for all ages', 'active', 1),
('Beard', 'Beard trimming, shaping, and grooming services', 'active', 1),
('Combo', 'Combined hair and beard services', 'active', 1),
('Kids', 'Specialized haircut services for children', 'active', 1),
('Premium', 'VIP and luxury grooming experiences', 'active', 1);

-- Insert sample services
INSERT IGNORE INTO services (category_id, service_name, service_slug, description, price, duration_minutes, service_type, status, created_by) VALUES
(1, 'Classic Haircut', 'classic-haircut', 'Traditional haircut with scissor and clipper work', 250.00, 30, 'standard', 'active', 1),
(1, 'Fade Haircut', 'fade-haircut', 'Skin fade, low fade, high fade, or mid fade', 300.00, 45, 'standard', 'active', 1),
(2, 'Beard Trim', 'beard-trim', 'Precise beard shaping and trimming', 150.00, 20, 'standard', 'active', 1),
(2, 'Hot Towel Shave', 'hot-towel-shave', 'Traditional straight razor shave with hot towel', 200.00, 30, 'vip', 'active', 1),
(3, 'Haircut + Beard Trim', 'haircut-beard-combo', 'Complete grooming package with haircut and beard trim', 350.00, 60, 'combo', 'active', 1),
(4, 'Kids Haircut (Under 12)', 'kids-haircut', 'Gentle and patient haircut service for kids', 200.00, 25, 'standard', 'active', 1),
(5, 'VIP Grooming Session', 'vip-grooming', 'Premium service with extended time and exclusive care', 600.00, 90, 'vip', 'active', 1);
