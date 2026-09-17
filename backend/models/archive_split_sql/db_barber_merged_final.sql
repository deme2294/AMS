-- ==========================================
-- Unified db_barber Database Script
-- ==========================================

CREATE DATABASE IF NOT EXISTS `db_barber` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `db_barber`;

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT IGNORE INTO roles (role_id, role_name,status) VALUES
(1, 'admin', 1),
(2, 'barber', 1),
(3, 'customer', 1);

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `name`, `description`, `created_at`) VALUES
(1, 'IT', 'Information Technology Department', '2026-01-02 10:25:30'),
(2, 'HR', 'Human Resources', '2026-01-02 10:25:30'),
(3, 'Finance', 'Finance and Accounts', '2026-01-02 10:25:30'),
(4, 'Marketing', 'Marketing and Public Relations', '2026-01-02 10:25:30');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--


--
-- Dumping data for table `organization_types`
--


--- inserting the values into the service_categories table.

INSERT INTO service_categories (
    category_name,
    description,
    category_image,
    category_icon,
    status
)
VALUES

(
    'Haircut Services',
    'Professional haircut and hair styling services for men, women, and children.',
    'uploads/service-categories/hair-cut.jpg',
    'fa-solid fa-scissors',
    'active'
),

(
    'Beard & Grooming Services',
    'Beard trimming, shaping, shaving, and facial grooming services.',
    'uploads/service-categories/beard-grooming.jpg',
    'fa-solid fa-user-tie',
    'active'
),

(
    'Premium & Combo Services',
    'Premium grooming packages including haircut, beard styling, hair wash, and VIP treatments.',
    'uploads/service-categories/premium-combo.jpg',
    'fa-solid fa-crown',
    'active'
);


--  creating the complaint assignees table.


--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `name`, `role_id`, `department_id`, `supervisor_id`, `fname`, `lname`, `email`, `phone`, `sex`) VALUES
(21, 'www www', 1, 1, NULL, 'hayal', 'tamrat', NULL, '0916048977', NULL),
(34, 'hayaltame', NULL, 2, 21, 'ggg', 'ggg', 'beki@gmail.com', '0934556621', 'F'),
(36, 'hayaltame', NULL, 2, 0, 'some', 'one', 'bekeei@gmail.com', '0934556621', 'M'),
(37, 'hayaltame111', 1, NULL, NULL, 'some11', 'tame', 'oneq@gmail.com', '0934556688', 'M'),
(38, 'hayaltame3333', 1, NULL, NULL, 'aaa', 'a', 'one1a111@gmail.com', '0934556111', 'M'),
(39, 'hayaltame1114444', 1, NULL, NULL, 'some00', 'one11', 'one222@gmail.com', '0934556688', 'M'),
(40, 'hayaltame1114444444', 1, NULL, NULL, 'yeab444', 'one4444', 'beki444@gmail.com', '0934556444', 'M'),
(41, 'hayaltame444', 1, NULL, NULL, 'yeabeee', 'eeee', 'eeeee@gmail.com', '0934556644', 'M'),
(43, 'rtttttt44', 1, NULL, NULL, 'yeabeee', 'eeee', 'eeee44e@gmail.com', '0934556677', 'M'),
(45, 'tttttttttttt111', 1, NULL, NULL, 'yeabrrr', 'tamer', 'onerrr@gmail.com', '0934556655', 'M'),
(46, 'bekele woya', 8, NULL, NULL, 'bekele', 'woya', 'woya@gmail.com', '0933499094', 'M'),
(47, 'admin admin', 1, 2, 1, 'admin', 'admin', 'admin@email.com', '123-456-7890', 'M'),
(48, 'hylt', 8, NULL, 0, 'hl', 'tm', 'hl@gmail.com', '0934556644', 'M'),
(49, 'yonas', 2, NULL, NULL, 'yonas', 'ceo', 'yonas@itp.org', '0933499093', 'M'),
(50, 'simegn', 5, 2, 49, 'geter', 'geter', 'simegn@itp.org', '0933499094', 'M'),
(51, 'hayal@itp.org', 8, 2, 50, 'hayal', 'hayal', 'hayal@itp.org', '0933499097', 'M'),
(54, 'hayalt@itp.org', 8, 2, 0, 'hayalt', 'hayalt', 'hayalt@itp.org', '0933499097', 'M'),
(55, 'abebe', 4, NULL, 0, 'abebe', 'abe', 'abe@itp.et', '0934556624', 'M'),
(56, '333333333', 4, 2, 49, 'some00333333', 'one333333', 'beki33333333333@gmail.com', '0934556333', 'M'),
(57, 'staf', 8, 2, 56, 'staf', 'staf', 'staf@gmail.com', '0934556688', 'M'),
(58, 'nebyat', 6, 2, 50, 'nebyat', 'nebyat', 'nebyat@itp.et', '093455444', 'F'),
(59, 'ewunetu', 7, 2, 58, 'ewunetu', 'ewunetu', 'ewunetu@itp.et', '0934556453', 'M'),
(60, 'general', 3, NULL, 49, 'general', 'manager', 'manager@itp.et', '0933499366', 'M'),
(62, 'staf1', 8, 2, 66, 'staf1', 'staf1', 'staf1@itp.et', '0934556688', 'M'),
(63, 'hayalta4444', 6, 2, 50, 'some', 'one', 'berrrrrki@gmail.com', '0934556555', 'M'),
(64, 'yeabeeeee', 1, NULL, NULL, 'some', 'one', 'eeee@gmail.com', '0934556688', 'M'),
(65, 'team leader', 7, 2, 58, 'teaml', 'teaml', 'teaml@gmail.com', '09373773333', 'M'),
(66, 'team leader', 7, 2, 58, 'teamleader', 'teamleader', 'teamleader@gmail.com', '09373773333', 'M'),
(67, 'hayal', 1, NULL, NULL, 'hayal', 'tamrat', 'hayal@itp.it', '0916048977', 'M'),
(68, 'hayal', 8, 2, 65, 'hayal', 'tamrat', 'hayalt@itp.it', '0916048977', 'M'),
(69, 'registrar@gmail.com', 5, NULL, NULL, 'registrar', 'registrar', 'registrar@gmail.com', '0916048977', 'M'),
(70, 'Nathan', 1, NULL, NULL, 'Hayal', 'Girum', 'nathan@itp.et', '0976180462', 'M'),
(71, 'Hayal Tamrat Girum', 3, NULL, NULL, 'Hayal', 'Girum', 'hayal@gmai.com', '0976180462', 'M'),
(72, 'nathay tamrat', 5, NULL, 70, 'hayal', 'tamrat', 'regist@bus.com', '0916048977', 'M'),
(73, 'hayal tamrat', 1, NULL, NULL, 'nathay', 'tamrat', 'astu@nathayblog.com', '0916048977', 'M'),
(75, 'hayal tamrat', 4, NULL, 70, 'nathay', 'tamrat', 'hager@temechain.com', '0916048977', 'M'),
(78, 'hayal tamrat', 4, NULL, 70, 'nathay', 'tamrat', 'hager1@temechain.com', '0916048977', 'M'),
(82, 'hayal tamrat', 4, 1, 49, 'hayal', 'tamrat', 'hager22@temechain.com', '0916048977', 'M'),
(83, 'Hayal Tamrat', 5, NULL, NULL, 'Hayal', 'Tamrat', 'Hayalt@hu.edu.et', '0916048977', 'M'),
(84, 'Hayal ', 1, NULL, NULL, 'Nathay ', 'Nathay ', 'Nathantamrat50@gmail.com', '90188837377', 'M'),
(85, 'nathay tamrat', 5, NULL, NULL, 'nathay', 'tamrat', 'astu@nathayblog.et', '0916048977', 'M'),
(86, 'agent', 6, 1, 50, 'test', 'some one', 'agent@lonche.com', 'itp@123', 'M'),
(87, 'hayal tamrat', 1, 1, NULL, 'hayal', 'tamrat', 'hayaltamrat@gmail.com', '+25191222112', NULL),
(88, 'yossef knfe', 4, 2, NULL, 'yossef', 'knfe', 'yosef@gmail.com', '0913566735', NULL),
(89, 'test21 test21', 3, 1, NULL, 'test21', 'test21', 'test21@gmail.com', '', NULL),
(90, 'Hayal Tamrat', 1, 1, NULL, 'Hayal', 'Tamrat', 'kidoastu1993@gmail.com', '0913566735', NULL),
(91, 'nathan tame', 1, 1, NULL, 'nathan', 'tame', 'hayaltamrat3@gmail.com', '0909090909', NULL),
(92, 'test admin', 1, 1, NULL, 'test', 'admin', 'testadmin@gmail.com', '0913566735', NULL),
(93, 'test hr', 4, 2, NULL, 'test', 'hr', 'testhr@gmail.com', '', NULL),
(94, 'test Leasing', 0, 1, NULL, 'test', 'Leasing', 'testleasing@gmail.com', '0913566735', NULL),
(95, 'test conten', 3, 1, NULL, 'test', 'conten', 'testcontent@gmail.com', '0913566735', NULL),
(96, 'test event', 5, 1, NULL, 'test', 'event', 'testevent@gmail.com', '0913566735', NULL),
(97, 'test follow_up', 2, 1, NULL, 'test', 'follow_up', 'testfollowup@gmail.com', '0913566735', NULL),
(98, 'content tets1', 3, 1, NULL, 'content', 'tets1', 'contenttest1@gmail.com', '0917266671', NULL),
(99, 'test test', 1, 1, NULL, 'test', 'test', 'test@gmail.com', '98893219831298', NULL),
(100, 'Security Auditor', 1, 1, NULL, 'Security', 'Auditor', 'audit_1771417756741@example.com', '0900000000', NULL),
(5000, 'Security Auditor', 1, 1, NULL, 'Security', 'Auditor', 'audit_1771418828658@example.com', '0900000000', NULL),
(5001, 'Security Auditor', 1, 1, NULL, 'Security', 'Auditor', 'audit_1771419160931@example.com', '0900000000', NULL),
(5002, 'tets tets', 4, 2, NULL, 'tets', 'tets', 'tets113@gmail.com', '0917122712', NULL),
(5003, 'contet contet', 3, 1, NULL, 'contet', 'contet', 'contet1@gmail.com', '+251913566735', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_positions`
--


--
-- Dumping data for table `employee_positions`
--

INSERT INTO `employee_positions` (`id`, `employee_id`, `org_node_id`, `is_primary`, `is_delegation`, `created_at`) VALUES
(1, 151, 13, 1, 0, '2026-03-19 11:10:44'),
(2, 151, 15, 0, 1, '2026-03-19 11:11:39'),
(3, 151, 16, 0, 1, '2026-03-19 11:11:50'),
(4, 146, 11, 1, 0, '2026-03-19 11:12:47'),
(5, 149, 52, 1, 0, '2026-03-19 11:21:25'),
(6, 109, 55, 1, 0, '2026-03-20 05:31:29'),
(7, 152, 14, 1, 1, '2026-03-20 05:38:43'),
(8, 152, 17, 0, 1, '2026-03-20 05:39:19'),
(9, 152, 18, 0, 1, '2026-03-20 05:39:35'),
(10, 143, 10, 1, 0, '2026-03-20 05:40:11'),
(11, 142, 9, 1, 0, '2026-03-20 05:41:17'),
(12, 139, 52, 1, 0, '2026-03-20 11:47:21'),
(13, 72, 10, 1, 0, '2026-03-20 14:00:50'),
(14, 146, 14, 1, 0, '2026-03-23 06:56:06'),
(15, 117, 19, 1, 0, '2026-03-23 06:56:06'),
(17, 109, 55, 1, 0, '2026-03-23 08:48:56'),
(18, 139, 26, 1, 0, '2026-03-23 08:48:56');

-- --------------------------------------------------------

--
-- Table structure for table `organization_structure`
--


INSERT INTO users (
    user_id, employee_id, user_name, password,
    created_at, status, online_flag, updated_at,
    role_id, avatar_url, failed_login_attempts,
    account_locked_until, reset_token, reset_token_expires,
    redemption_token, redemption_token_expires
)
VALUES
    (
        9001, 9001, 'nathan27',
        '$2a$10$UnLS/LqxPeKfzlQOR6Fi1eHtdb7K9Q64iKo3UYo1r/Qbn0GhOLdW.',
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

---


--
-- Dumping data for table `organization_structure`
--

INSERT INTO `organization_structure` (`id`, `name`, `name_amharic`, `type`, `parent_id`, `level`, `description`, `head_employee_id`, `status`, `created_at`, `updated_at`) VALUES
(9, 'CEO', 'CEO', 'CEO', NULL, 1, 'CEO', NULL, 'active', '2025-12-16 07:33:36', '2025-12-16 07:33:36'),
(10, 'Deputy CEO', 'Deputy CEO', 'Deputy CEO', 9, 2, 'Deputy CEO', NULL, 'active', '2025-12-16 07:34:14', '2025-12-16 07:34:14'),
(11, 'IT Directorate', 'IT Directorate', 'Directorate', 10, 3, 'IT Directorate', NULL, 'active', '2025-12-16 07:35:17', '2025-12-16 07:35:17'),
(12, 'Constraction  Directorate', 'Constraction  Directorate', 'Directorate', 10, 3, 'Constraction  Directorate', NULL, 'active', '2025-12-16 07:35:45', '2025-12-16 07:35:45'),
(13, 'Inovation and Encubation Department', 'Inovation and Encubation Department', 'Department', 11, 4, 'Inovation and Encubation Department', NULL, 'active', '2025-12-16 07:39:08', '2025-12-16 07:39:08'),
(14, 'Digital Service and Infrastructure Devevelopment', 'Digital Service and Infrastructure Devevelopment', 'Department', 11, 4, 'Digital Service and Infrastructure Devevelopment', NULL, 'active', '2025-12-16 07:40:31', '2025-12-16 07:40:31'),
(15, 'Reaserch Section ', 'Reaserch Section ', 'Section', 13, 5, 'Reaserch Section ', NULL, 'active', '2025-12-16 07:41:09', '2025-12-16 07:41:09'),
(16, 'Encubation Section ', 'Encubation Section ', 'Section', 13, 5, 'Encubation Section ', NULL, 'active', '2025-12-16 07:41:37', '2025-12-16 07:41:37'),
(17, 'Network and Infrastructure ', 'Network and Infrastructure ', 'Section', 14, 5, 'Network and Infrastructure ', NULL, 'active', '2025-12-16 07:42:18', '2025-12-16 07:42:18'),
(18, 'Software development', 'Software development', 'Section', 14, 5, 'Software development', NULL, 'active', '2025-12-16 07:43:06', '2025-12-16 07:43:06'),
(19, 'Ciyber Security ', 'Ciyber Security ', 'Section', 14, 5, 'Ciyber Security ', NULL, 'active', '2025-12-16 07:43:29', '2025-12-16 07:43:29'),
(20, 'Construction and Design ', 'Construction and Design ', 'Department', 12, 4, 'Construction and Design ', NULL, 'active', '2025-12-16 07:45:58', '2025-12-16 07:45:58'),
(21, 'Construction ', 'Construction', 'Section', 20, 5, 'Construction', NULL, 'active', '2025-12-16 07:46:29', '2025-12-16 07:46:29'),
(22, 'Design ', 'Design', 'Section', 20, 5, 'Design Section ', NULL, 'active', '2025-12-16 07:46:51', '2025-12-16 07:46:51'),
(24, 'Land and Office Managment', 'Land and Office Managment', 'Department', 12, 4, 'Land and Office Managment', NULL, 'active', '2025-12-16 07:49:24', '2025-12-16 07:49:24'),
(25, 'Utilities and service ', 'Utilities and service ', 'Department', 12, 4, 'Utilities and service ', NULL, 'active', '2025-12-16 07:50:30', '2025-12-16 07:50:30'),
(26, 'Enviroment and Greenery ', 'Enviroment and Greenery ', 'Department', 12, 4, 'Enviroment and Greenery ', NULL, 'active', '2025-12-16 07:51:34', '2025-12-16 07:51:34'),
(27, 'Markating ', 'Markating ', 'Department', 10, 3, 'Markating Department', NULL, 'active', '2025-12-16 07:54:07', '2025-12-16 07:54:07'),
(28, 'Markating and Sales ', 'Markating and Sales ', 'Section', 27, 4, 'Markating and Sales ', NULL, 'active', '2025-12-16 07:54:49', '2025-12-16 07:54:49'),
(29, 'Investor Support', 'Investor Support', 'Section', 27, 4, 'Investor Support', NULL, 'active', '2025-12-16 07:55:18', '2025-12-16 07:55:18'),
(30, 'Bussines Development and Support', 'Bussines Development and Support', 'Section', 27, 4, 'Bussines Development and Support', NULL, 'active', '2025-12-16 07:56:02', '2025-12-16 07:56:02'),
(31, 'Corporate Adminstration Directorate', 'Corporate Adminstration Directorate', 'Directorate', 9, 2, 'Corporate Adminstration Directorate', NULL, 'active', '2025-12-16 07:57:02', '2025-12-16 07:57:25'),
(32, 'Finance Department', 'Finance Department', 'Department', 31, 3, 'Finance Department', NULL, 'active', '2025-12-16 07:58:00', '2025-12-16 07:58:00'),
(33, 'HR Department', 'HR Department', 'Department', 31, 3, 'HR Department', NULL, 'active', '2025-12-16 07:58:22', '2025-12-16 07:58:22'),
(34, 'Procrument and Resource Admin', 'Procrument and Resource Admin', 'Department', 31, 3, 'Procrument and Resource Admin', NULL, 'active', '2025-12-16 07:59:08', '2025-12-16 07:59:08'),
(35, 'Income and Cost Section ', 'Income and Cost Section ', 'Section', 32, 4, 'Income and Cost Section ', NULL, 'active', '2025-12-16 08:00:55', '2025-12-16 08:00:55'),
(36, 'Budget Section ', 'Budget Section ', 'Section', 32, 4, 'Budget Section ', NULL, 'active', '2025-12-16 08:02:21', '2025-12-16 08:02:21'),
(37, 'Procrument Section ', 'Procrument Section ', 'Section', 34, 4, 'Procrument Section ', NULL, 'active', '2025-12-16 08:02:56', '2025-12-16 08:03:46'),
(38, 'Inventory Admin', 'Inventory Admin', 'Section', 34, 4, 'Inventory Admin', NULL, 'active', '2025-12-16 08:02:58', '2025-12-16 08:04:30'),
(39, 'General Service ', 'General Service ', 'Section', 34, 4, 'General Service ', NULL, 'active', '2025-12-16 08:05:25', '2025-12-16 08:05:25'),
(40, 'HR Admin ', 'HR Admin ', 'Section', 33, 4, 'HR Admin ', NULL, 'active', '2025-12-16 08:06:04', '2025-12-16 08:06:04'),
(41, 'Training and HR development', 'Training and HR development', 'Section', 33, 4, 'Training and HR development', NULL, 'active', '2025-12-16 08:06:49', '2025-12-16 08:06:49'),
(42, 'Security ', 'Security ', 'Department', 9, 2, NULL, NULL, 'active', '2025-12-16 08:53:00', '2025-12-16 08:53:00'),
(43, 'CEO Office Addmistration ', 'CEO Office Addmistration ', 'Department', 9, 2, NULL, NULL, 'active', '2025-12-16 08:53:55', '2025-12-16 08:53:55'),
(44, 'Law Department', 'Law Department', 'Department', 9, 2, NULL, NULL, 'active', '2025-12-16 08:54:21', '2025-12-16 08:54:35'),
(45, 'Strategic Advisor', 'Strategic Advisor', 'unit', 9, 2, NULL, NULL, 'active', '2025-12-16 08:56:27', '2025-12-16 08:57:07'),
(46, 'Law Service ', 'Law Service ', 'Section', 44, 3, NULL, NULL, 'active', '2025-12-16 08:58:26', '2025-12-16 08:58:26'),
(47, 'Complaice Section ', 'Complaice Section ', 'Section', 44, 3, NULL, NULL, 'active', '2025-12-16 08:58:47', '2025-12-16 08:58:47'),
(48, 'Auditor', 'Auditor', 'Section', 9, 2, NULL, NULL, 'active', '2025-12-16 08:59:47', '2025-12-16 08:59:47'),
(49, 'Corporation Communication Section ', 'Corporation Communication Section ', 'Section', 9, 2, NULL, NULL, 'active', '2025-12-16 09:00:36', '2025-12-16 09:00:36'),
(50, 'Plan and followup ', 'Plan and followup ', 'Section', 9, 2, NULL, NULL, 'active', '2025-12-16 09:01:49', '2025-12-16 09:01:49'),
(51, 'Senior', 'Senior', 'Senior Software Developer', 18, 6, NULL, NULL, 'active', '2026-03-19 11:18:02', '2026-03-19 11:18:02'),
(52, 'Specialist', 'Specialist', ' Software Developer Specialist', 18, 6, NULL, NULL, 'active', '2026-03-19 11:18:31', '2026-03-19 11:18:31'),
(53, 'Assistant', 'Assistant', ' Software Developer Assistant', 18, 6, NULL, NULL, 'active', '2026-03-19 11:18:52', '2026-03-19 11:18:52'),
(54, 'Senior System admin', 'Senior System admin', 'Senior', 17, 6, NULL, NULL, 'active', '2026-03-20 05:29:38', '2026-03-20 05:29:38'),
(55, ' System admin Specialist', ' System admin Specialist', 'Specialist', 17, 6, NULL, NULL, 'active', '2026-03-20 05:30:06', '2026-03-20 05:30:06'),
(56, ' System admin Asistant', ' System admin Asistant', 'Assistant', 17, 6, NULL, NULL, 'active', '2026-03-20 05:30:31', '2026-03-20 05:30:31');

-- --------------------------------------------------------

--
-- Table structure for table `organization_types`
--


--
-- Dumping data for table `cms_menus`
--

INSERT INTO `cms_menus` (`id`, `title`, `path`, `icon`, `color`, `parent_id`, `order_index`, `is_section`, `is_dropdown`, `is_active`) VALUES
(0, 'Component Library', '/admin/components', '<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z\" /></svg>', 'violet', 7, 83, 0, 0, 1),
(1, 'App', NULL, NULL, 'blue', NULL, 10, 1, 0, 1),
(4, 'Interaction', '', '', 'blue', NULL, 40, 1, 0, 1),
(5, 'Appearance', NULL, NULL, 'blue', NULL, 50, 1, 0, 1),
(6, 'Users', NULL, NULL, 'blue', NULL, 60, 1, 0, 1),
(7, 'Settings', '', '', 'blue', NULL, 70, 1, 0, 0),
(8, 'Dashboard', '/dashboard', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z\" /></svg>', 'blue', 1, 11, 0, 1, 1),
(9, 'Overview', '/dashboard/overview', NULL, 'blue', 8, 1, 0, 0, 1),
(10, 'Analytics', '/dashboard/analytics', NULL, 'blue', 8, 2, 0, 0, 1),
(11, 'Posts', '/content/posts', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z\" /></svg>', 'emerald', 2, 21, 0, 1, 1),
(12, 'Add Posts', '/content/posts', '', 'blue', 11, 1, 0, 0, 1),
(13, 'Manage Posts', '/post/managePosts', NULL, 'blue', 11, 2, 0, 0, 1),
(14, 'Gallery', '/post/gallery', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" /></svg>', 'amber', 2, 22, 0, 1, 1),
(15, 'Gallery Managmet', '/post/gallery', '', 'blue', 14, 1, 0, 0, 1),
(16, 'Manage Gallery', '/post/manageGallery', NULL, 'blue', 14, 2, 0, 0, 0),
(17, 'Pages', '/content/pages', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z\" /></svg>', 'indigo', 2, 23, 0, 0, 0),
(18, 'Categories', '/content/categories', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z\" /></svg>', 'orange', 2, 24, 0, 0, 0),
(19, 'Tags', '/content/tags', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z\" /></svg>', 'pink', 2, 25, 0, 0, 0),
(20, 'Offices', '/content/offices', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4\" /></svg>', 'cyan', 2, 26, 0, 0, 1),
(21, 'Leased Lands', '/content/leased-lands', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 114 0 2 2 0 002 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" /></svg>', 'green', 2, 27, 0, 0, 1),
(22, 'Live Events', '/content/live-events', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'red', 2, 28, 0, 0, 1),
(23, 'Careers', '/content/careers', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'blue', 2, 29, 0, 0, 1),
(24, 'Partners & Investors', '/content/partners-investors', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" /></svg>', 'violet', 2, 30, 0, 0, 1),
(25, 'Incubation', '/content/incubation', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 10V3L4 14h7v7l9-11h-7z\" /></svg>', 'blue', 2, 31, 0, 0, 1),
(26, 'Trainings', '/content/trainings', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253\" /></svg>', 'amber', 2, 32, 0, 0, 1),
(27, 'Investment Steps', '/content/investment-steps', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\" /></svg>', 'teal', 2, 33, 0, 0, 1),
(28, 'Board Members', '/content/board-members', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" /></svg>', 'purple', 2, 34, 0, 0, 1),
(29, 'Who We Are', '/content/who-we-are', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" /></svg>', 'indigo', 2, 35, 0, 0, 1),
(30, 'Library', '/media/library', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10\" /></svg>', 'purple', 3, 41, 0, 0, 0),
(32, 'Contact', '/interaction/contact', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'blue', 4, 51, 0, 1, 0),
(34, 'Contact Inbox', '/interaction/contact-messages', '', 'blue', 4, 1, 0, 0, 1),
(36, 'Manage Forms', '/interaction/forms/manage', NULL, 'blue', 33, 1, 0, 0, 1),
(37, 'Submissions', '/interaction/forms/submissions', NULL, 'blue', 33, 2, 0, 0, 1),
(39, 'Menus', '/appearance/menus', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6h16M4 12h16M4 18h16\" /></svg>', 'rose', 5, 61, 0, 0, 1),
(40, 'Theme', '/appearance/theme-settings', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\" /></svg>', 'violet', 5, 62, 0, 0, 1),
(41, 'Users', '/users/all', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z\" /></svg>', 'lime', 6, 71, 0, 0, 1),
(42, 'Add User', '/users/add', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z\" /></svg>', 'sky', 6, 72, 0, 0, 1),
(43, 'Subscribers', '/users/subscribers', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'fuchsia', 6, 73, 0, 0, 1),
(44, 'Settings', '/settings/general', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z\" /><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 12a3 3 0 11-6 0 3 3 0 016 0z\" /></svg>', 'slate', 7, 81, 0, 0, 1),
(45, 'Audit Logs', '/settings/audit-logs', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\" /></svg>', 'red', 7, 82, 0, 0, 1),
(46, 'Roles & Permissions', '/users/roles', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z\" /></svg>', 'indigo', 6, 74, 0, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--


--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `message`, `status`, `created_at`) VALUES
(1, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2025-12-19 11:32:58'),
(2, 'Bereket Tamrat', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 07:38:32'),
(3, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 09:19:18'),
(4, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 09:31:32'),
(5, 'Hayal', 'onerrr@gmail.com', '', 'Tets', 'read', '2026-01-10 05:48:42'),

--
-- Dumping data for table `employee_positions`
--

INSERT INTO `employee_positions` (`id`, `employee_id`, `org_node_id`, `is_primary`, `is_delegation`, `created_at`) VALUES
(1, 151, 13, 1, 0, '2026-03-19 11:10:44'),
(2, 151, 15, 0, 1, '2026-03-19 11:11:39'),
(3, 151, 16, 0, 1, '2026-03-19 11:11:50'),
(4, 146, 11, 1, 0, '2026-03-19 11:12:47'),
(5, 149, 52, 1, 0, '2026-03-19 11:21:25'),
(6, 109, 55, 1, 0, '2026-03-20 05:31:29'),
(7, 152, 14, 1, 1, '2026-03-20 05:38:43'),
(8, 152, 17, 0, 1, '2026-03-20 05:39:19'),
(9, 152, 18, 0, 1, '2026-03-20 05:39:35'),
(10, 143, 10, 1, 0, '2026-03-20 05:40:11'),
(11, 142, 9, 1, 0, '2026-03-20 05:41:17'),
(12, 139, 52, 1, 0, '2026-03-20 11:47:21'),
(13, 72, 10, 1, 0, '2026-03-20 14:00:50'),
(14, 146, 14, 1, 0, '2026-03-23 06:56:06'),
(15, 117, 19, 1, 0, '2026-03-23 06:56:06'),
(17, 109, 55, 1, 0, '2026-03-23 08:48:56'),
(18, 139, 26, 1, 0, '2026-03-23 08:48:56');

-- --------------------------------------------------------

--
-- Table structure for table `organization_structure`
--


--
-- Dumping data for table `role_menu_permissions`
--

INSERT INTO `role_menu_permissions` (`role_id`, `menu_id`, `can_view`, `can_create`, `can_edit`, `can_delete`) VALUES
(0, 8, 1, 0, 0, 0),
(0, 9, 1, 0, 0, 0),
(0, 10, 1, 0, 0, 0),
(0, 20, 1, 0, 0, 0),
(0, 21, 1, 0, 0, 0),
(1, 0, 1, 0, 0, 0),
(1, 1, 1, 0, 0, 0),
(1, 2, 1, 0, 0, 0),
(1, 3, 1, 0, 0, 0),
(1, 4, 1, 0, 0, 0),
(1, 5, 1, 0, 0, 0),
(1, 6, 1, 0, 0, 0),
(1, 7, 1, 0, 0, 0),
(1, 8, 1, 0, 0, 0),
(1, 9, 1, 0, 0, 0),
(1, 10, 1, 0, 0, 0),
(1, 11, 1, 0, 0, 0),
(1, 12, 1, 0, 0, 0),
(1, 13, 1, 0, 0, 0),
(1, 14, 1, 0, 0, 0),
(1, 15, 1, 0, 0, 0),
(1, 16, 1, 0, 0, 0),
(1, 20, 1, 0, 0, 0),
(1, 21, 1, 0, 0, 0),
(1, 22, 1, 0, 0, 0),
(1, 23, 1, 0, 0, 0),
(1, 24, 1, 0, 0, 0),
(1, 25, 1, 0, 0, 0),
(1, 26, 1, 0, 0, 0),
(1, 27, 1, 0, 0, 0),
(1, 28, 1, 0, 0, 0),
(1, 29, 1, 0, 0, 0),
(1, 32, 1, 0, 0, 0),
(1, 34, 1, 0, 0, 0),
(1, 35, 1, 0, 0, 0),
(1, 38, 1, 0, 0, 0),
(1, 39, 1, 0, 0, 0),
(1, 41, 1, 0, 0, 0),
(1, 42, 1, 0, 0, 0),
(1, 43, 1, 0, 0, 0),
(1, 45, 1, 0, 0, 0),
(1, 46, 1, 0, 0, 0),
(1, 47, 1, 0, 0, 0),
(2, 4, 1, 0, 0, 0),
(2, 8, 1, 0, 0, 0),
(2, 9, 1, 0, 0, 0),
(2, 10, 1, 0, 0, 0),
(2, 34, 1, 0, 0, 0),
(2, 35, 1, 0, 0, 0),
(3, 8, 1, 0, 0, 0),
(3, 9, 1, 0, 0, 0),
(3, 10, 1, 0, 0, 0),
(3, 12, 1, 0, 0, 0),
(3, 13, 1, 0, 0, 0),
(3, 14, 1, 0, 0, 0),
(3, 15, 1, 0, 0, 0),
(3, 16, 1, 0, 0, 0),
(4, 0, 1, 0, 0, 0),
(4, 8, 1, 0, 0, 0),
(4, 9, 1, 0, 0, 0),
(4, 10, 1, 0, 0, 0),
(4, 23, 1, 0, 0, 0),
(4, 47, 1, 0, 0, 0),
(5, 8, 1, 0, 0, 0),
(5, 9, 1, 0, 0, 0),
(5, 10, 1, 0, 0, 0),
(5, 22, 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `subscribers`
--


--
-- Dumping data for table `user_menu_permissions`
--

INSERT INTO `user_menu_permissions` (`user_id`, `menu_id`, `permission_type`) VALUES
(0, 4, 'allow'),
(0, 7, 'allow'),
(0, 9, 'allow'),
(0, 10, 'allow'),
(0, 12, 'allow'),
(0, 13, 'allow'),
(0, 15, 'allow'),
(0, 26, 'allow'),
(0, 27, 'allow'),
(0, 28, 'allow'),
(0, 29, 'allow'),
(0, 34, 'allow'),
(0, 36, 'allow'),
(0, 39, 'allow'),
(0, 40, 'allow'),
(0, 41, 'allow'),
(0, 42, 'allow'),
(0, 43, 'allow'),
(0, 44, 'allow'),
(0, 45, 'allow'),
(0, 46, 'allow'),
(34, 1, 'deny'),
(34, 2, 'deny'),
(34, 3, 'deny'),
(34, 4, 'deny'),
(34, 5, 'deny'),
(34, 6, 'deny'),
(34, 7, 'deny'),
(34, 8, 'deny'),
(34, 9, 'allow'),
(34, 10, 'deny'),
(34, 11, 'deny'),
(34, 12, 'allow'),
(34, 13, 'deny'),
(34, 14, 'deny'),
(34, 15, 'allow'),
(34, 16, 'deny'),
(34, 17, 'deny'),
(34, 18, 'deny'),
(34, 19, 'deny'),
(34, 20, 'deny'),
(34, 21, 'deny'),
(34, 22, 'deny'),
(34, 24, 'deny'),
(34, 25, 'deny'),
(34, 26, 'deny'),
(34, 27, 'deny'),
(34, 28, 'deny'),
(34, 29, 'deny'),
(34, 30, 'deny'),
(34, 32, 'deny'),
(34, 33, 'deny'),
(34, 34, 'allow'),
(34, 35, 'deny'),
(34, 36, 'deny'),
(34, 37, 'deny'),
(34, 38, 'deny'),
(34, 39, 'deny'),
(34, 40, 'deny'),
(34, 41, 'deny'),
(34, 42, 'deny'),
(34, 43, 'deny'),
(34, 44, 'deny'),
(34, 45, 'deny'),
(34, 46, 'deny'),
(36, 23, 'allow'),
(81, 12, 'allow'),
(81, 13, 'allow'),
(81, 15, 'allow'),
(81, 16, 'allow'),
(84, 0, 'allow'),
(84, 1, 'allow'),
(84, 2, 'allow'),
(84, 3, 'allow'),
(84, 4, 'allow'),
(84, 5, 'allow'),
(84, 6, 'allow'),
(84, 7, 'allow'),
(84, 8, 'allow'),
(84, 9, 'allow'),
(84, 10, 'allow'),
(84, 11, 'allow'),
(84, 12, 'allow'),
(84, 13, 'allow'),
(84, 14, 'allow'),
(84, 15, 'allow'),
(84, 16, 'allow'),
(84, 17, 'allow'),
(84, 18, 'allow'),
(84, 19, 'allow'),
(84, 20, 'allow'),
(84, 21, 'allow'),
(84, 22, 'allow'),
(84, 23, 'allow'),
(84, 24, 'allow'),
(84, 25, 'allow'),
(84, 26, 'allow'),
(84, 27, 'allow'),
(84, 28, 'allow'),
(84, 29, 'allow'),
(84, 30, 'allow'),
(84, 32, 'allow'),
(84, 33, 'allow'),
(84, 34, 'allow'),
(84, 35, 'allow'),
(84, 36, 'allow'),
(84, 37, 'allow'),
(84, 38, 'allow'),
(84, 39, 'allow'),
(84, 40, 'allow'),
(84, 41, 'allow'),
(84, 42, 'allow'),
(84, 43, 'allow'),
(84, 44, 'allow'),
(84, 45, 'allow'),
(84, 46, 'allow'),
(84, 47, 'allow'),
(89, 10, 'allow'),
(89, 32, 'allow'),
(89, 34, 'allow'),
(89, 35, 'allow'),
(1002, 47, 'allow');

--
-- Indexes for dumped tables
--


--
-- Dumping data for table `active_sessions`
--

INSERT INTO `active_sessions` (`id`, `user_id`, `jti`, `ip_address`, `user_agent`, `created_at`, `last_activity`) VALUES
(28, 83, 'b808c2e6-1dc0-4db6-b5f6-19a4af2b49f4', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 10:11:41', '2026-03-30 11:04:52');

-- --------------------------------------------------------

--
-- Table structure for table `approvalhierarchy`
--


-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--


-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--


--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 10:15:10'),
(2, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 10:15:11'),
(3, 3, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '127.0.0.1', '2026-01-02 10:22:58'),
(4, 3, 'CREATE', 'User', NULL, '{\"fname\":\"hayal\",\"lname\":\"tamrat\",\"user_name\":\"hayalt\",\"email\":\"hayaltamrat@gmail.com\",\"phone\":\"+25191222112\",\"department_id\":\"1\",\"role_id\":\"1\"}', '127.0.0.1', '2026-01-02 10:27:54'),
(5, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 10:28:18'),
(6, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 10:28:23'),
(7, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"6\"}', '127.0.0.1', '2026-01-02 11:31:54'),
(8, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-02 11:33:43'),
(9, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-02 11:35:03'),
(10, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"some one\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-02 11:35:17'),
(11, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 11:41:15'),
(12, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 11:41:57'),
(13, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-02 11:45:34'),
(14, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 12:43:34'),
(15, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 12:45:41'),
(16, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 12:59:24'),
(17, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:02:54'),
(18, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 13:12:26'),
(19, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:14:49'),
(20, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"onerrr@gmail.com\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:26:28'),
(21, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 13:26:45'),
(22, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:28:03'),
(23, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"onerrr@gmail.com\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:28:07'),
(24, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"onerrr@gmail.com\",\"attempts\":2}', '127.0.0.1', '2026-01-02 13:28:11'),
(25, 128, 'LOGOUT', 'User', '128', NULL, '127.0.0.1', '2026-01-02 13:35:54'),
(26, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 13:36:02'),
(27, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:48:55'),
(28, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":2}', '127.0.0.1', '2026-01-02 13:48:58'),
(29, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":3}', '127.0.0.1', '2026-01-02 13:49:01'),
(30, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":4}', '127.0.0.1', '2026-01-02 13:49:04'),
(31, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":5}', '127.0.0.1', '2026-01-02 13:49:08'),
(32, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 13:53:53'),
(33, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:53:57'),
(34, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:54:22'),
(35, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":2}', '127.0.0.1', '2026-01-02 13:54:26'),
(36, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":3}', '127.0.0.1', '2026-01-02 13:54:29'),
(37, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":4}', '127.0.0.1', '2026-01-02 13:54:32'),
(38, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":5}', '127.0.0.1', '2026-01-02 13:54:35'),
(39, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 14:03:48'),
(40, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 14:03:51'),
(41, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":1}', '127.0.0.1', '2026-01-02 14:03:59'),
(42, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":2}', '127.0.0.1', '2026-01-02 14:04:02'),
(43, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":3}', '127.0.0.1', '2026-01-02 14:04:05'),
(44, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":4}', '127.0.0.1', '2026-01-02 14:04:08'),
(45, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":5}', '127.0.0.1', '2026-01-02 14:04:12'),
(46, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-02 14:21:23'),
(47, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 14:21:48'),
(48, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-02 14:22:45'),
(49, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-03 10:34:17'),
(50, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-03 11:09:08'),
(51, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-03 11:09:25'),
(52, 35, 'CREATE', 'Media', '6', '{\"title\":\"our leaders \",\"count\":4}', '127.0.0.1', '2026-01-03 11:10:52'),
(53, 35, 'DELETE', 'Media', '9', NULL, '127.0.0.1', '2026-01-03 11:11:02'),
(54, 3, 'CREATE', 'User', NULL, '{\"fname\":\"yossef\",\"lname\":\"knfe\",\"user_name\":\"yossef\",\"email\":\"yosef@gmail.com\",\"phone\":\"0913566735\",\"department_id\":\"2\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-03 14:04:12'),
(55, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-03 14:04:19'),
(56, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-03 14:04:51'),
(57, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-03 14:05:07'),
(58, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 14:05:17'),
(59, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-03 14:05:47'),
(60, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-03 14:05:56'),
(61, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-03 14:06:21'),
(62, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 14:06:32'),
(63, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-03 14:06:51'),
(64, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-03 17:53:30'),
(65, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"yossef\",\"attempts\":1}', '127.0.0.1', '2026-01-03 17:54:00'),
(66, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-03 17:54:09'),
(67, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-03 17:54:29'),
(68, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"yossef\",\"attempts\":2}', '127.0.0.1', '2026-01-03 17:54:41'),
(69, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 17:55:01'),
(70, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 18:17:13'),
(71, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 07:15:06'),
(72, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-04 07:15:28'),
(73, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:15:41'),
(74, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:21:19'),
(75, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:21:21'),
(76, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:29:35'),
(77, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 07:29:40'),
(78, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-04 07:30:26'),
(79, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:30:31'),
(80, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:43:30'),
(81, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:43:31'),
(82, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:47:57'),
(83, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 07:48:10'),
(84, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-04 07:53:42'),
(85, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:53:48'),
(86, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 08:29:21'),
(87, 3, 'LOGOUT', 'User', '3', NULL, '196.189.144.152', '2026-01-05 05:55:25'),
(88, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '196.189.144.152', '2026-01-05 11:47:33'),
(128, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-01-30 07:56:46'),
(129, 84, 'LOGOUT', 'User', '84', NULL, '::1', '2026-01-30 08:04:03'),
(130, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-01-30 08:04:06'),
(131, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:50:29'),
(132, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:52:43'),
(133, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:59:07'),
(134, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:59:37'),
(135, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:01:43'),
(136, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:15:17'),
(137, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:26:29'),
(138, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:34:36'),
(139, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:50:08'),
(140, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:51:19'),
(141, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 14:00:44'),
(142, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 14:20:22'),
(143, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-03 06:10:45'),
(144, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-16 12:39:46'),
(145, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-16 17:45:49'),
(146, 83, 'CREATE', 'User', NULL, '{\"fname\":\"content\",\"lname\":\"tets1\",\"user_name\":\"contenttest1\",\"email\":\"contenttest1@gmail.com\",\"phone\":\"0917266671\",\"department_id\":\"1\",\"role_id\":\"3\"}', '::ffff:127.0.0.1', '2026-02-16 19:16:16'),
(147, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-16 19:16:22'),
(148, 90, 'LOGIN', 'User', '90', '{\"username\":\"contenttest1\"}', '::ffff:127.0.0.1', '2026-02-16 19:16:47'),
(149, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-16 19:18:43'),
(150, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-16 20:24:22'),
(151, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 06:47:55'),
(152, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:29:41'),
(153, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 07:34:22'),
(154, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:34:25'),
(155, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 07:38:28'),
(156, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:39:49'),
(157, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 07:57:44'),
(158, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:57:46'),
(159, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 08:18:21'),
(160, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 08:29:11'),
(161, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 08:29:13'),
(162, 83, 'CREATE', 'News', '7', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:46:00'),
(163, 83, 'CREATE', 'News', '8', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:47:40'),
(164, 83, 'CREATE', 'News', '9', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:48:01'),
(165, 83, 'CREATE', 'News', '10', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:49:05'),
(166, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 09:10:37'),
(167, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-17 09:10:44'),
(168, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 09:10:47'),
(169, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-17 10:54:14'),
(170, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 10:54:18'),
(171, 83, 'CREATE', 'News', '11', '{\"title\":\"test\"}', '::1', '2026-02-17 11:09:25'),
(172, 83, 'UPDATE', 'News', '11', '{\"title\":\"test\"}', '::1', '2026-02-17 11:09:53'),
(173, 83, 'CREATE', 'Media', '9', '{\"title\":\"Field Test Singular\",\"count\":1}', '::1', '2026-02-17 11:22:24'),
(174, 83, 'CREATE', 'Media', '10', '{\"title\":\"Field Test Plural\",\"count\":1}', '::1', '2026-02-17 11:22:24'),
(175, 83, 'CREATE', 'Media', '11', '{\"title\":\"Field Test Singular\",\"count\":1}', '::1', '2026-02-17 11:22:43'),
(176, 83, 'CREATE', 'Media', '12', '{\"title\":\"Field Test Plural\",\"count\":1}', '::1', '2026-02-17 11:22:43'),
(177, 83, 'CREATE', 'Media', '13', '{\"title\":\"Field Test Singular\",\"count\":1}', '::1', '2026-02-17 11:27:40'),
(178, 83, 'CREATE', 'Media', '14', '{\"title\":\"Field Test Plural\",\"count\":1}', '::1', '2026-02-17 11:27:40'),
(179, 83, 'CREATE', 'Media', '15', '{\"title\":\"test\",\"count\":1}', '::1', '2026-02-17 11:32:01'),
(180, 83, 'DELETE', 'Media', '15', NULL, '::1', '2026-02-17 11:32:08'),
(181, 83, 'DELETE', 'Media', '14', NULL, '::1', '2026-02-17 11:33:27'),
(182, 83, 'UPDATE', 'Media', '13', '{\"title\":\"Field Test Singular\"}', '::1', '2026-02-17 11:33:50'),
(183, 83, 'DELETE', 'Media', '13', NULL, '::1', '2026-02-17 11:33:57'),
(184, 83, 'DELETE', 'Media', '11', NULL, '::1', '2026-02-17 11:39:10'),
(185, 83, 'DELETE', 'Media', '12', NULL, '::1', '2026-02-17 11:39:13'),
(186, 83, 'DELETE', 'Media', '10', NULL, '::1', '2026-02-17 11:49:50'),
(187, 83, 'DELETE', 'Media', '9', NULL, '::1', '2026-02-17 11:49:53'),
(188, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 12:45:43'),
(189, 83, 'DELETE', 'News', '10', NULL, '::1', '2026-02-17 12:47:16'),
(190, 83, 'DELETE', 'News', '9', NULL, '::1', '2026-02-17 12:47:19'),
(191, 83, 'DELETE', 'News', '8', NULL, '::1', '2026-02-17 12:47:22'),
(192, 83, 'DELETE', 'News', '7', NULL, '::1', '2026-02-17 12:47:24'),
(193, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 12:47:58'),
(194, 83, 'CREATE', 'Event', '2', '{\"title\":\"test\"}', '::1', '2026-02-17 12:54:52'),
(195, 83, 'DELETE', 'Event', '2', NULL, '::1', '2026-02-17 13:01:04'),
(196, 83, 'CREATE', 'Event', '3', '{\"title\":\"test\"}', '::1', '2026-02-17 13:01:32'),
(197, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:05:37'),
(198, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:19:40'),
(199, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:20:51'),
(200, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:21:20'),
(201, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:21:34'),
(202, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:21:44'),
(203, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:22:07'),
(204, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 13:47:33'),
(205, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:48:55'),
(206, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:50:57'),
(207, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:52:06'),
(208, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:53:50'),
(209, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:54:12'),
(210, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:55:41'),
(211, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-17 14:05:12'),
(212, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 14:05:15'),
(213, 83, 'UPDATE', 'Event', '3', '{\"title\":\"test\"}', '::1', '2026-02-17 14:06:00'),
(214, 83, 'UPDATE', 'Event', '3', '{\"title\":\"test\"}', '::1', '2026-02-17 14:06:40'),
(215, 83, 'DELETE', 'Event', '3', NULL, '::1', '2026-02-17 14:06:56'),
(216, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 14:27:13'),
(217, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 06:11:32'),
(218, 83, 'DELETE', 'News', '11', NULL, '::1', '2026-02-18 06:12:04'),
(219, 83, 'CREATE', 'User', NULL, '{\"fname\":\"test\",\"lname\":\"test\",\"user_name\":\"test@gmail.com\",\"email\":\"test@gmail.com\",\"phone\":\"98893219831298\",\"department_id\":\"1\",\"role_id\":\"1\"}', '::1', '2026-02-18 07:01:04'),
(220, 83, 'UPDATE', 'User', NULL, '{\"fname\":\"test\",\"lname\":\"some one\",\"user_name\":\"test@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '::1', '2026-02-18 07:01:55'),
(221, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":1}', '::1', '2026-02-18 07:02:04'),
(222, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '::1', '2026-02-18 07:03:45'),
(223, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":1}', '::1', '2026-02-18 07:03:46'),
(224, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 08:28:04'),
(225, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 11:24:27'),
(226, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 12:29:16'),
(227, 83, 'CREATE', 'User', NULL, '{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771417756741@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771417756741\"}', '::1', '2026-02-18 12:29:16'),
(228, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 12:47:08'),
(229, 83, 'CREATE', 'User', NULL, '{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771418828658@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771418828658\"}', '::1', '2026-02-18 12:47:08'),
(230, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-18 12:48:41'),
(231, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 12:52:40'),
(232, 83, 'CREATE', 'User', NULL, '{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771419160931@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771419160931\"}', '::1', '2026-02-18 12:52:41'),
(233, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '::1', '2026-02-18 13:21:53'),
(234, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-18 14:22:46'),
(235, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 07:52:24'),
(236, 83, 'CREATE', 'User', NULL, '{\"fname\":\"tets\",\"lname\":\"tets\",\"user_name\":\"tets27\",\"email\":\"tets113@gmail.com\",\"phone\":\"0917122712\",\"department_id\":\"2\",\"role_id\":\"4\"}', '::1', '2026-02-19 07:53:52'),
(237, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 07:54:03'),
(238, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 07:54:05'),
(239, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 07:55:37'),
(240, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 07:57:12'),
(241, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 08:18:38'),
(242, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 08:18:44'),
(243, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 08:18:47'),
(244, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 08:29:23'),
(245, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-19 08:46:14'),
(246, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 08:48:16'),
(247, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 08:50:33'),
(248, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 08:50:38'),
(249, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 08:59:15'),
(250, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 08:59:50'),
(251, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 09:00:11'),
(252, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 09:03:31'),
(253, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 09:03:34'),
(254, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 09:06:21'),
(255, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 09:06:28'),
(256, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 10:38:50'),
(257, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 10:38:55'),
(258, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 06:55:15'),
(259, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 12:04:18'),
(260, 83, 'CREATE', 'User', NULL, '{\"fname\":\"contet\",\"lname\":\"contet\",\"user_name\":\"contet1\",\"email\":\"contet1@gmail.com\",\"phone\":\"+251913566735\",\"department_id\":\"1\",\"role_id\":\"3\"}', '::1', '2026-02-20 12:05:05'),
(261, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-20 12:05:10'),
(262, 1003, 'LOGIN', 'User', '1003', '{\"username\":\"contet1\"}', '::1', '2026-02-20 12:05:13'),
(263, 1003, 'LOGOUT', 'User', '1003', NULL, '::1', '2026-02-20 12:37:06'),
(264, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 12:37:14'),
(265, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-20 12:54:10'),
(266, 1003, 'LOGIN', 'User', '1003', '{\"username\":\"contet1\"}', '::1', '2026-02-20 12:54:14'),
(267, 1003, 'LOGOUT', 'User', '1003', NULL, '::1', '2026-02-20 13:00:46'),
(268, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 13:00:52'),
(269, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-20 13:10:37'),
(270, 83, 'DELETE', 'Comment', '8', NULL, '::1', '2026-02-20 13:58:21'),
(271, 83, 'DELETE', 'Comment', '10', NULL, '::1', '2026-02-20 13:58:26'),
(272, 83, 'DELETE', 'Comment', '15', NULL, '::1', '2026-02-20 13:58:31'),
(273, 83, 'APPROVE', 'Comment', '169', NULL, '::1', '2026-02-20 14:02:06'),
(274, 83, 'APPROVE', 'Comment', '169', NULL, '::1', '2026-02-20 14:02:46'),
(275, 83, 'APPROVE', 'Comment', '174', NULL, '::1', '2026-02-20 14:05:53'),
(276, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 16:35:44'),
(277, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-20 18:05:50'),
(278, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 18:05:56'),
(279, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:40:47'),
(280, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:41:47'),
(281, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:42:25'),
(282, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:52:02'),
(283, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 09:51:22'),
(284, 84, 'LOGOUT', 'User', '84', NULL, '::1', '2026-02-26 09:51:24'),
(285, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-03-05 03:39:32'),
(286, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-05 03:42:22'),
(287, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 07:04:02'),
(288, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 09:57:41'),
(289, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 11:24:38'),
(290, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 12:01:07'),
(291, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 12:32:28'),
(292, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 12:48:21'),
(293, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:03:25'),
(294, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-03-26 13:06:45'),
(295, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:06:47'),
(296, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:21:25'),
(297, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:45:44'),
(298, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '::1', '2026-03-26 14:05:09'),
(299, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":1}', '::1', '2026-03-26 14:05:10'),
(300, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 14:09:16'),
(301, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 14:15:49'),
(302, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 15:26:00'),
(303, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 15:43:46'),
(304, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 16:54:27'),
(305, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 17:32:22'),
(306, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 18:50:00'),
(307, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 06:16:36'),
(308, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 06:35:28'),
(309, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 06:53:34'),
(310, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 07:17:58'),
(311, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 12:34:27'),
(312, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 13:21:41'),
(313, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-03-27 13:21:41'),
(314, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-03-27 13:21:41'),
(315, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 13:22:07'),
(316, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 14:07:00'),
(317, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-30 07:11:41');

-- --------------------------------------------------------

--
-- Table structure for table `blocked_ips`
--


-- Complaints menu for Admin and Barber (inserted after Services block)

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--


--
-- Dumping data for table `roles

-- --------------------------------------------------------

--
-- Table structure for table `role_menu_permissions`
--



--
-- Dumping data for table `subscribers`
--

INSERT INTO `subscribers` (`id`, `email`, `status`, `subscribed_at`, `unsubscribed_at`) VALUES
(1, 'hayaltamrat@gmail.com', 'active', '2025-12-19 08:07:31', NULL),
(4, 'hayaltamrat1@gmail.com', 'active', '2025-12-19 08:13:22', NULL),
(5, 'hayaltamrat4@gmail.com', 'active', '2026-01-03 11:18:11', NULL),
(6, 'hayaltamrat5@gmail.com', 'active', '2026-01-05 06:08:14', NULL),
(7, 'berekettamrat2015@gmail.com', 'active', '2026-01-05 06:19:46', NULL),
(8, 'hayalt5@gmail.com', 'active', '2026-01-05 07:35:38', NULL),
(9, 'hayaltamrat6@gmail.com', 'active', '2026-01-05 07:38:04', NULL),
(10, 'hayaltamrat123@gmail.com', 'active', '2026-01-05 07:39:35', NULL),
(11, 'astu@nathayblog.com', 'active', '2026-01-05 08:53:24', NULL),
(12, 'berekettamrat20115@gmail.com', 'active', '2026-01-05 08:55:14', NULL),
(13, 'astuw@nathayblog.com', 'active', '2026-01-05 09:03:44', NULL),
(14, 'kidoastu1993@gmail.com', 'active', '2026-01-05 09:11:40', NULL),
(15, 'kidoastu19293@gmail.com', 'active', '2026-01-05 09:31:45', NULL),
(16, 'worket2@gmail.com', 'active', '2026-01-05 09:38:34', NULL),
(17, 'worketh20172@gmail.com', 'active', '2026-01-05 09:39:59', NULL),
(18, 'hager@temechain.com', 'active', '2026-01-05 10:01:00', NULL),
(19, 'bereketeab550@gmail.com', 'active', '2026-01-05 10:22:08', NULL),
(20, 'berekettamrat20154@gmail.com', 'active', '2026-01-06 04:38:05', NULL),
(21, 'fekadualemu208@gmail.com', 'active', '2026-01-08 07:13:49', NULL),
(22, 'super@gmail.com', 'active', '2026-01-09 04:56:42', NULL),
(23, 'somchaibinl@gmail.com', 'active', '2026-01-09 15:27:10', NULL),
(24, 'natha@gmail.com', 'active', '2026-01-09 18:55:42', NULL),
(25, 'onertrr@gmail.com', 'active', '2026-01-11 07:04:03', NULL),
(26, 'alemu.abera@ethiopianitpark.et', 'active', '2026-01-12 11:33:37', NULL),
(27, 'kedirahmed19963384@gmail.com', 'active', '2026-01-12 12:17:52', NULL),
(28, 'matthewarop@gmail.com', 'active', '2026-01-13 06:12:35', NULL),
(29, 'sirajdeldebo96@gmail.com', 'active', '2026-01-14 10:25:37', NULL),
(30, 'hayaltamrat8@gmail.com', 'active', '2026-01-15 10:31:21', NULL),
(31, 'mchala04@gmail.com', 'active', '2026-01-18 00:53:59', NULL),
(32, 'hayaltamrat23@gmail.com', 'active', '2026-01-19 16:24:52', NULL),
(33, 'hayaltamrat3@gmail.com', 'active', '2026-01-19 16:32:37', NULL),
(34, 'tsehayutilahun@gmail.com', 'active', '2026-01-20 08:25:12', NULL),
(35, 'kirubelmulugeta3@gmail.com', 'active', '2026-01-24 05:37:40', NULL),
(36, 'na@gmail.com', 'active', '2026-01-29 19:48:18', NULL),
(37, 'na1@gmail.com', 'active', '2026-01-29 19:48:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--


--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('density', 'compact', '2026-03-26 13:07:28'),
('fontFamily', 'system', '2026-03-26 13:07:28'),
('logoPreview', '', '2026-03-26 13:04:58'),
('primaryColor', 'blue', '2026-03-26 13:04:58'),
('themeMode', 'dark', '2026-03-30 07:21:16');

-- Table structure for table `user_menu_permissions`
--


--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `message`, `status`, `created_at`) VALUES
(1, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2025-12-19 11:32:58'),
(2, 'Bereket Tamrat', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 07:38:32'),
(3, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 09:19:18'),
(4, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 09:31:32'),
(5, 'Hayal', 'onerrr@gmail.com', '', 'Tets', 'read', '2026-01-10 05:48:42'),
(6, 'Mesfin Tsegaye', 'mesfin@mevinai.com', '+251911522902', 'Hello, this is Mesfin, Founder of Mevinai PLC. I’m interested in renting a workspace for our company and would appreciate guidance on the next steps. We’re a growing startup and are looking for an environment that can support our team’s expansion and innovation.', 'read', '2026-01-12 13:19:08'),
(7, 'Mesfin Tsegaye', 'mesfin@mevinai.com', '+251911522902', 'Hello, this is Mesfin, Founder of Mevinai PLC. I’m interested in renting a workspace for our company and would appreciate guidance on the next steps. We’re a growing startup and are looking for an environment that can support our team’s expansion and innovation.', 'read', '2026-01-12 13:19:35'),
(8, 'Hayal Tamrat Girum', 'hayaltamrat3@gmail.com', '+251976180462', 'this is test from hayal\n', 'replied', '2026-01-19 15:09:36'),
(9, 'Dagim Mathewos', 'dmathewos529@gmail.com', '+251903918129', 'Subject: Cooperative Training Placement Request – 5 Web Development & Database Students (Teferi Mekonnen Polytechnic College)\n\nTo:  Ethiopian IT Park (ICT Park) Addis Ababa, Ethiopia\n\nDear Sir/Madam,\n\nWe are writing to formally express our keen interest in undertaking our Cooperative Training (Internship) at the Ethiopian IT Park. We are a group of five (5) dedicated students currently completing our Level 3 certification in Web Development and Database Management at Teferi Mekonnen Polytechnic College.\n\nAs students of one of Ethiopia’s most historic technical institutions, we are eager to bridge the gap between our academic studies and the real-world digital ecosystem. We believe that the Ethiopian IT Park, as the nation\'s premier technology hub, offers the ideal environment for us to refine our technical skills while contributing to the Park\'s digital objectives.\n\nDuring our placement, we are prepared to assist resident companies or the Park administration in the following areas:\n\nWeb Development: Assisting in front-end updates, UI/UX maintenance, and basic web programming (HTML, CSS, JavaScript).\n\nDatabase Management: Supporting data entry, SQL queries, database cleaning, and documentation.\n\nTechnical Support: Aiding in IT infrastructure maintenance and general technical troubleshooting within the Special Economic Zone.\n\nWe are highly motivated, disciplined, and ready to adapt to the fast-paced professional environment of the IT Park. We have attached our institutional recommendation letter from Teferi Mekonnen Polytechnic College for your review.\n\nWe would welcome the opportunity to discuss how we can contribute to your organization during our training period. Thank you for considering our request and for your commitment to empowering the next generation of Ethiopian IT professionals.\n\nSincerely,\n\nStudent Representative Name: Dagim Mathewos Phone Number: +251-903-918-129 College: Teferi Mekonnen Polytechnic College', 'read', '2026-01-26 14:34:42'),
(10, '<script>alert(\'XSS\')</script>', 'test@gmail.com', '<script>alert(\'XSS\')</script>', '<script>alert(\'XSS\')</script>', 'read', '2026-01-29 13:53:36'),
(11, 'Habtam Habtam', 'hayaltamrat@gmail.com', '+359933499097', 'test', 'new', '2026-01-29 19:35:27'),
(12, 'John Doe', 'test@example.com', NULL, 'Normal message', 'read', '2026-02-02 13:41:27'),
(13, 'Contact Tester', 'tester@example.com', '0988776655', 'This is a valid test message', 'new', '2026-02-18 12:08:01'),
(14, 'Contact Tester', 'tester@example.com', '0988776655', 'This is a valid test message', 'new', '2026-02-18 12:08:57'),
(15, 'Test', 'test@test.com', NULL, 'Hello', 'new', '2026-02-18 14:00:57'),
(16, 'Tester', 'test@test.com', NULL, 'text', 'new', '2026-02-18 14:01:46'),
(17, 'Tester', 'test@test.com', NULL, 'text', 'new', '2026-02-18 14:01:46'),
(18, 'Tester', 'test@test.com', NULL, 'x', 'new', '2026-02-18 14:01:47'),
(19, 'Tester', 'test@test.com', NULL, 'text', 'new', '2026-02-18 14:01:47'),
(20, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(21, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(22, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(23, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(24, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(25, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(26, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(27, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(28, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(29, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(30, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(31, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(32, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(33, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(34, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(35, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(36, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(37, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(38, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(39, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:23'),
(40, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:23'),
(41, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:56'),
(42, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:56'),
(43, 'John Doe', 'john@verified.com', '0912345678', 'Legitimate message.', 'new', '2026-02-21 08:48:39'),
(44, 'John Doe', 'john@verified.com', '0912345678', 'Legitimate message.', 'new', '2026-02-21 08:49:41'),
(45, 'John Doe', 'john@verified.com', '0912345678', 'Legitimate message.', 'new', '2026-02-21 08:52:56');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;




-- inserting the values into services table.
INSERT INTO services (
    category_id,
    service_name,
    service_slug,
    short_description,
    description,
    price,
    duration_minutes,
    service_type,
    is_featured,
    published_publicly,
    status
)
VALUES

(
    1,
    'Classic Haircut',
    'classic-haircut',
    'Professional haircut service',
    'Professional haircut with styling and finishing.',
    150.00,
    30,
    'haircut',
    TRUE,
    TRUE,
    'active'
),

(
    2,
    'Beard Trim',
    'beard-trim',
    'Professional beard shaping',
    'Complete beard trimming and styling service.',
    100.00,
    20,
    'beard_trim',
    FALSE,
    TRUE,
    'active'
),

(
    3,
    'Haircut + Beard Combo',
    'haircut-beard-combo',
    'Complete grooming package',
    'Haircut and beard trimming package.',
    220.00,
    60,
    'combo',
    TRUE,
    TRUE,
    'active'
);



-- Table structure for the table `complaint_comments`


CREATE INDEX idx_complaint_assignees_complaint ON complaint_assignees(complaint_id);
CREATE INDEX idx_complaint_assignees_user ON complaint_assignees(user_id);

INSERT IGNORE INTO roles (role_id, role_name,status) VALUES
(1, 'admin', 1),
(2, 'barber', 1),
(3, 'customer', 1);

-- Table for the service reviews and rs


-- Table structure for the table `complaint_comments`