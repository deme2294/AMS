-- ============================================
-- SEED DATA FOR BARBER MANAGEMENT SYSTEM
-- ============================================

USE db_barber;

-- ============================================
-- 1. SERVICE CATEGORIES
-- ============================================

INSERT IGNORE INTO service_categories (
    id,
    category_name,
    description,
    category_image,
    category_icon,
    status,
    display_order
) VALUES
(1, 'Haircut Services', 
    'Professional haircut and hair styling services for men, women, and children including classic cuts, fades, and modern styles.',
    '/uploads/service-categories/haircut.jpg',
    'fa-solid fa-scissors',
    'active',
    1),
    
(2, 'Beard & Grooming', 
    'Complete beard trimming, shaping, shaving, and facial grooming services to keep you looking sharp.',
    '/uploads/service-categories/beard.jpg',
    'fa-solid fa-user-tie',
    'active',
    2),
    
(3, 'Premium & VIP Services', 
    'Luxury grooming packages with premium treatments, hot towel shaves, and VIP attention.',
    '/uploads/service-categories/premium.jpg',
    'fa-solid fa-crown',
    'active',
    3),
    
(4, 'Hair Treatments', 
    'Hair coloring, highlighting, perming, and specialized treatment services.',
    '/uploads/service-categories/treatments.jpg',
    'fa-solid fa-spray-can',
    'active',
    4),
    
(5, 'Kids Services', 
    'Special services designed for children with patience and fun atmosphere.',
    '/uploads/service-categories/kids.jpg',
    'fa-solid fa-child',
    'active',
    5);

-- ============================================
-- 2. SAMPLE SERVICES
-- ============================================

INSERT IGNORE INTO services (
    id,
    category_id,
    service_name,
    service_slug,
    short_description,
    description,
    price,
    discount_price,
    duration_minutes,
    service_type,
    is_available,
    is_featured,
    published_publicly,
    status,
    buffer_time_minutes
) VALUES
-- Haircut Services
(1, 1, 'Classic Haircut',
    'classic-haircut',
    'Traditional professional haircut',
    'Traditional haircut with scissor and clipper work, includes wash and basic styling.',
    250.00,
    NULL,
    30,
    'haircut',
    1, 1, 1,
    'active',
    5),

(2, 1, 'Premium Fade',
    'premium-fade',
    'Modern fade haircut with precision',
    'Skin fade, low fade, high fade, or mid fade with razor line-up and styling.',
    350.00,
    300.00,
    45,
    'haircut',
    1, 1, 1,
    'active',
    5),

(3, 1, 'Buzz Cut',
    'buzz-cut',
    'Quick and clean all-over cut',
    'Fast all-over clipper cut, perfect for low maintenance style.',
    150.00,
    NULL,
    15,
    'haircut',
    1, 0, 1,
    'active',
    5),

-- Beard Services
(4, 2, 'Beard Trim & Shape',
    'beard-trim-shape',
    'Professional beard trimming and shaping',
    'Precision beard trimming and shaping with razor edge line-up.',
    150.00,
    NULL,
    20,
    'beard_trim',
    1, 0, 1,
    'active',
    5),

(5, 2, 'Hot Towel Shave',
    'hot-towel-shave',
    'Luxury straight razor shave',
    'Traditional hot towel straight razor shave with pre-shave oil and aftershave.',
    300.00,
    NULL,
    30,
    'beard_trim',
    1, 1, 1,
    'active',
    10),

-- Premium & Combo Services
(6, 3, 'Executive Package',
    'executive-package',
    'Complete grooming package',
    'Haircut + Beard trim + Hot towel treatment + Face mask + Head massage.',
    600.00,
    550.00,
    90,
    'combo',
    1, 1, 1,
    'active',
    15),

(7, 3, 'VIP Royal Treatment',
    'vip-royal-treatment',
    'Ultimate luxury grooming experience',
    'Full VIP service: Premium haircut, hot towel shave, facial, scalp treatment, shoulder massage.',
    1200.00,
    1000.00,
    120,
    'vip',
    1, 1, 1,
    'active',
    20),

-- Hair Treatments
(8, 4, 'Hair Coloring',
    'hair-coloring',
    'Professional hair coloring service',
    'Full head hair coloring with premium products and color consultation.',
    500.00,
    NULL,
    60,
    'hair_coloring',
    1, 0, 1,
    'active',
    10),

(9, 4, 'Hair Wash & Conditioning',
    'hair-wash-conditioning',
    'Deep cleansing and conditioning',
    'Professional hair wash with scalp massage and conditioning treatment.',
    100.00,
    NULL,
    20,
    'hair_wash',
    1, 0, 1,
    'active',
    5),

-- Kids Services
(10, 5, 'Kids Haircut',
    'kids-haircut',
    'Haircut for children (under 12)',
    'Patient and fun haircut service specially designed for children.',
    200.00,
    NULL,
    25,
    'kids',
    1, 0, 1,
    'active',
    5);

-- ============================================
-- 3. COMPLAINT CATEGORIES
-- ============================================

INSERT IGNORE INTO categories (category_id, category_name, description, status) VALUES
(1, 'Service Quality', 'Issues related to the quality of service provided', 'active'),
(2, 'Staff Behavior', 'Complaints about staff conduct or professionalism', 'active'),
(3, 'Cleanliness & Hygiene', 'Concerns about shop cleanliness and hygiene standards', 'active'),
(4, 'Booking & Scheduling', 'Issues with appointment booking or scheduling', 'active'),
(5, 'Pricing & Billing', 'Concerns about pricing, charges, or billing', 'active'),
(6, 'Wait Time', 'Complaints about excessive waiting times', 'active'),
(7, 'Product Quality', 'Issues with products used during service', 'active'),
(8, 'Other', 'Other complaints not covered by above categories', 'active');

-- ============================================
-- 4. MENU STRUCTURE FOR SERVICES
-- ============================================

-- Services Section (Parent Menu)
INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES (100, 'Services', NULL, NULL, 'blue', NULL, 30, 1, 0, 1);

-- Service Sub-Menus
INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES 
(101, 'Categories', '/services/categories', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>', 
    'blue', 100, 31, 0, 0, 1),

(102, 'All Services', '/services', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.952-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', 
    'emerald', 100, 32, 0, 0, 1),

(103, 'Add Service', '/services/add', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>', 
    'green', 100, 33, 0, 0, 1);

-- Bookings Section (Parent Menu)
INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES (110, 'Bookings', NULL, NULL, 'purple', NULL, 40, 1, 0, 1);

-- Booking Sub-Menus
INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES 
(111, 'Pending Review', '/bookings/pending', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', 
    'orange', 110, 41, 0, 0, 1),

(112, 'All Bookings', '/bookings', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>', 
    'blue', 110, 42, 0, 0, 1),

(113, 'Queue Management', '/queue', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>', 
    'purple', 110, 43, 0, 0, 1);

-- ============================================
-- 5. ROLE-MENU PERMISSIONS
-- ============================================

-- Admin permissions (full access)
INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(1, 100, 1, 0, 0, 0),
(1, 101, 1, 1, 1, 1),
(1, 102, 1, 1, 1, 1),
(1, 103, 1, 1, 0, 0),
-- Bookings Section
(1, 110, 1, 0, 0, 0),
(1, 111, 1, 1, 1, 1),
(1, 112, 1, 1, 1, 1),
(1, 113, 1, 1, 1, 1);

-- Manager permissions (similar to admin)
INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(4, 100, 1, 0, 0, 0),
(4, 101, 1, 1, 1, 1),
(4, 102, 1, 1, 1, 1),
(4, 103, 1, 1, 0, 0),
-- Bookings Section
(4, 110, 1, 0, 0, 0),
(4, 111, 1, 1, 1, 0),
(4, 112, 1, 1, 1, 0),
(4, 113, 1, 1, 1, 0);

-- Barber permissions (limited access)
INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(2, 100, 1, 0, 0, 0),
(2, 101, 1, 0, 0, 0),
(2, 102, 1, 0, 0, 0),
-- Bookings Section
(2, 110, 1, 0, 0, 0),
(2, 112, 1, 0, 0, 0),
(2, 113, 1, 0, 0, 0);

-- Receptionist permissions (booking management)
INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(5, 100, 1, 0, 0, 0),
(5, 101, 1, 0, 0, 0),
(5, 102, 1, 0, 0, 0),
-- Bookings Section
(5, 110, 1, 0, 0, 0),
(5, 111, 1, 1, 1, 0),
(5, 112, 1, 1, 1, 0),
(5, 113, 1, 1, 1, 0);

-- Customer permissions (view only for services)
INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section (view only)
(3, 100, 1, 0, 0, 0),
(3, 102, 1, 0, 0, 0);

-- ============================================
-- 6. SYSTEM SETTINGS
-- ============================================

INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'Elite Barber Shop', 'string', 'Name of the barber shop', 1),
('site_email', 'info@elitebarbershop.com', 'string', 'Contact email address', 1),
('site_phone', '+251-911-123456', 'string', 'Contact phone number', 1),
('booking_approval_required', 'true', 'boolean', 'Whether bookings require admin approval', 0),
('booking_advance_days', '30', 'number', 'How many days in advance customers can book', 1),
('queue_auto_position', 'true', 'boolean', 'Automatically calculate queue positions', 0),
('review_min_rating', '1', 'number', 'Minimum rating value', 1),
('review_max_rating', '5', 'number', 'Maximum rating value', 1),
('review_requires_booking', 'true', 'boolean', 'Reviews require completed booking', 0),
('notification_email_enabled', 'true', 'boolean', 'Enable email notifications', 0),
('notification_sms_enabled', 'false', 'boolean', 'Enable SMS notifications', 0),
('business_hours_start', '09:00', 'string', 'Business opening time', 1),
('business_hours_end', '20:00', 'string', 'Business closing time', 1),
('business_days', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', 'json', 'Working days', 1);

-- ============================================
-- END OF SEED DATA
-- ============================================
