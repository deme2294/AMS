-- Migration: Add complaint_assignees table for multi-user assignment support
-- Run this script to enable assigning complaints to multiple users

-- Create complaint_assignees table
CREATE TABLE IF NOT EXISTS complaint_assignees (
    assignee_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    assignment_comment TEXT,
    response TEXT,
    response_submitted_at TIMESTAMP NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_assignee_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_assignee_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    CONSTRAINT unique_complaint_assignee UNIQUE (complaint_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create index for faster lookups
CREATE INDEX idx_complaint_assignees_complaint ON complaint_assignees(complaint_id);
CREATE INDEX idx_complaint_assignees_user ON complaint_assignees(user_id);

-- Migrate existing single assignments to the new table
-- This will copy any existing assigned_to values to the new table
INSERT IGNORE INTO complaint_assignees (complaint_id, user_id, is_primary, created_at)
SELECT complaint_id, assigned_to, TRUE, created_at 
FROM complaints 
WHERE assigned_to IS NOT NULL AND assigned_to != 0;

-- Optional: Add trigger to auto-create assignee when assigned_to is updated in complaints table
DELIMITER //
CREATE TRIGGER after_complaint_assigned_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF OLD.assigned_to != NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
        -- Add new assignee if not already exists
        INSERT IGNORE INTO complaint_assignees (complaint_id, user_id, is_primary)
        VALUES (NEW.complaint_id, NEW.assigned_to, TRUE);
    END IF;
END//
DELIMITER ;

SELECT 'complaint_assignees migration completed successfully' AS status;