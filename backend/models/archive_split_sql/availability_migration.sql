-- Availability slots persistence for Service Booking (Admin/Barber controlled)
-- Creates `availability_slots` and links booking consumption.

-- =============================================
-- 1) AVAILABILITY SLOTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barber_id INT NULL,
    service_id INT NOT NULL,
    available_date DATE NOT NULL,

    -- slot is represented by a single start/end time window (24h TIME)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- max how many bookings are allowed concurrently for this slot window
    max_bookings INT NOT NULL DEFAULT 1,
    
    -- current bookings count (for quick lookup)
    current_bookings INT DEFAULT 0,

    -- slot status values: available, booked, closed, paused
    slot_status ENUM('available', 'booked', 'closed', 'paused') NOT NULL DEFAULT 'available',

    -- optional notes
    notes TEXT,

    -- optional: who created/updated
    created_by INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_availability_slots_service_date (service_id, available_date),
    INDEX idx_availability_slots_barber_date (barber_id, available_date),
    INDEX idx_availability_slots_status (slot_status),

    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- =============================================
-- 2) LINK BOOKINGS TO AVAILABILITY SLOT
-- =============================================
ALTER TABLE service_bookings
    ADD COLUMN IF NOT EXISTS availability_slot_id INT NULL,
    ADD INDEX idx_service_bookings_availability_slot (availability_slot_id);

-- If your MySQL setup is strict about FK types, you can keep this FK commented.
-- For now we keep it optional to avoid migration failures on mismatched types.
-- ALTER TABLE service_bookings
--     ADD CONSTRAINT fk_service_bookings_availability_slot
--     FOREIGN KEY (availability_slot_id) REFERENCES availability_slots(id)
--     ON DELETE SET NULL;


