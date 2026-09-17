-- Minimal seed to make /api/login work.
-- Inserts into employees + users with a bcrypt password hash.
--
-- Example password for the seeded admin user is: Admin@1234
-- bcryptjs hash (generated with bcryptjs@10):
--   $2a$10$YG.cWVUa29Rz/xMFyMMd.O/KOw5G5HRVlImKmobpFcoBQo9BB9iBu
-- Ensure roles exist
INSERT IGNORE INTO roles (role_id, role_name, status)
VALUES
  (1, 'Admin', 1),
  (2, 'barber', 1),
  (3, 'customer', 1);
  
-- Employees (login matches u.user_name OR e.email)
INSERT IGNORE INTO employees (
  employee_id, name, role_id, department_id, supervisor_id,
  fname, lname, email, phone, sex
)
VALUES
  (9000, 'Seed Admin', 1, NULL, NULL, 'Seed', 'Admin', 'demshuterefe94@gmail.com', NULL, 'M');

-- Users
INSERT INTO users (
  user_id, employee_id, user_name, password,
  created_at, status, online_flag, updated_at,
  role_id, avatar_url, failed_login_attempts,
  account_locked_until, reset_token, reset_token_expires,
  redemption_token, redemption_token_expires
)
VALUES
  (
    9000, 9000, 'demshuterefe94@gmail.com',
    '$2a$10$YG.cWVUa29Rz/xMFyMMd.O/KOw5G5HRVlImKmobpFcoBQo9BB9iBu',
    NOW(), '1', 0, NOW(),
    1, NULL, 0,
    NULL, NULL, NULL,
    NULL, NULL
  )
  
ON DUPLICATE KEY UPDATE
  employee_id = VALUES(employee_id),
  user_name = VALUES(user_name),
  password = VALUES(password),
  status = VALUES(status),
  failed_login_attempts = 0,
  account_locked_until = NULL;

