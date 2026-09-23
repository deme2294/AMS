-- ================================================
-- MIGRATION: Add missing fields to service_bookings table
-- ================================================

-- Add customer_id field to link to users table
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS customer_id INT NULL AFTER customer_email;
ALTER TABLE service_bookings ADD FOREIGN KEY IF NOT EXISTS (customer_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Add approval_status field for admin/barber approval workflow
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS approval_status ENUM('waiting', 'approved', 'rejected') DEFAULT 'waiting' AFTER status;

-- Add rejection_reason field for rejected bookings
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL AFTER approval_status;

-- Add reference_number field for queue management
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50) NULL AFTER rejection_reason;

-- Add queue_status field for queue management
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS queue_status ENUM('queued', 'serving', 'completed', 'skipped') NULL AFTER reference_number;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_service_bookings_customer_id ON service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_approval_status ON service_bookings(approval_status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_reference_number ON service_bookings(reference_number);
