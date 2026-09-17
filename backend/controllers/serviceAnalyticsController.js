const db = require('../models/db');

/**
 * Get service booking statistics
 */
exports.getServiceStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get booking counts by status
        const [totalBookings] = await db.promise().query(
            'SELECT COUNT(*) as count FROM service_bookings'
        );
        
        const [pendingBookings] = await db.promise().query(
            "SELECT COUNT(*) as count FROM service_bookings WHERE approval_status = 'waiting'"
        );
        
        const [approvedBookings] = await db.promise().query(
            "SELECT COUNT(*) as count FROM service_bookings WHERE approval_status = 'approved'"
        );
        
        const [completedBookings] = await db.promise().query(
            "SELECT COUNT(*) as count FROM service_bookings WHERE status = 'completed'"
        );
        
        const [changesRequested] = await db.promise().query(
            "SELECT COUNT(*) as count FROM service_bookings WHERE approval_status = 'rejected'"
        );
        
        // Today's bookings
        const [todayBookings] = await db.promise().query(
            'SELECT COUNT(*) as count FROM service_bookings WHERE DATE(appointment_date) = ?',
            [today]
        );
        
        // This week's bookings
        const [weekBookings] = await db.promise().query(
            'SELECT COUNT(*) as count FROM service_bookings WHERE YEARWEEK(appointment_date) = YEARWEEK(NOW())'
        );
        
        // This month's bookings
        const [monthBookings] = await db.promise().query(
            'SELECT COUNT(*) as count FROM service_bookings WHERE MONTH(appointment_date) = MONTH(NOW()) AND YEAR(appointment_date) = YEAR(NOW())'
        );
        
        // Queue statistics
        const [queueCount] = await db.promise().query(
            "SELECT COUNT(*) as count FROM queues WHERE queue_status = 'queued'"
        );
        
        const [servingCount] = await db.promise().query(
            "SELECT COUNT(*) as count FROM queues WHERE queue_status = 'serving'"
        );

        res.json({
            success: true,
            data: {
                total: totalBookings[0].count,
                pending: pendingBookings[0].count,
                approved: approvedBookings[0].count,
                completed: completedBookings[0].count,
                changes_requested: changesRequested[0].count,
                today: todayBookings[0].count,
                thisWeek: weekBookings[0].count,
                thisMonth: monthBookings[0].count,
                inQueue: queueCount[0].count,
                serving: servingCount[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching service stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch service stats' });
    }
};

/**
 * Get bookings by day for the past N days
 */
exports.getDailyBookings = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const [dailyBookings] = await db.promise().query(`
            SELECT 
                DATE(appointment_date) as date,
                COUNT(*) as total,
                SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN approval_status = 'waiting' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM service_bookings
            WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(appointment_date)
            ORDER BY date ASC
        `, [days]);
        
        res.json({
            success: true,
            data: dailyBookings
        });
    } catch (error) {
        console.error('Error fetching daily bookings:', error.message);
        res.json({ success: true, data: [] });
    }
};

/**
 * Get bookings by month for the past N months
 */
exports.getMonthlyBookings = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        
        const [monthlyBookings] = await db.promise().query(`
            SELECT 
                DATE_FORMAT(appointment_date, '%Y-%m') as month,
                DATE_FORMAT(appointment_date, '%M %Y') as month_name,
                COUNT(*) as total,
                SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM service_bookings
            WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(appointment_date, '%Y-%m'), month_name
            ORDER BY month ASC
        `, [months]);
        
        res.json({
            success: true,
            data: monthlyBookings
        });
    } catch (error) {
        console.error('Error fetching monthly bookings:', error.message);
        res.json({ success: true, data: [] });
    }
};

/**
 * Get service category breakdown
 */
exports.getCategoryBreakdown = async (req, res) => {
    try {
        const [categories] = await db.promise().query(`
            SELECT 
                c.category_name as category,
                COUNT(sb.id) as total_bookings,
                SUM(CASE WHEN sb.status = 'completed' THEN 1 ELSE 0 END) as completed,
                COALESCE(AVG(s.price), 0) as avg_price
            FROM service_categories c
            LEFT JOIN services s ON s.category_id = c.id
            LEFT JOIN service_bookings sb ON sb.service_id = s.id
            GROUP BY c.id, c.category_name
            ORDER BY total_bookings DESC
        `);
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching category breakdown:', error.message);
        res.json({ success: true, data: [] });
    }
};

/**
 * Get service breakdown (most popular services)
 */
exports.getServiceBreakdown = async (req, res) => {
    try {
        const [services] = await db.promise().query(`
            SELECT 
                s.service_name as service,
                s.price,
                c.category_name as category,
                COUNT(sb.id) as total_bookings,
                SUM(CASE WHEN sb.status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM services s
            LEFT JOIN service_bookings sb ON sb.service_id = s.id
            LEFT JOIN service_categories c ON c.id = s.category_id
            GROUP BY s.id, s.service_name, s.price, c.category_name
            ORDER BY total_bookings DESC
            LIMIT 20
        `);
        
        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error('Error fetching service breakdown:', error.message);
        res.json({ success: true, data: [] });
    }
};

/**
 * Get barber performance statistics
 */
exports.getBarberPerformance = async (req, res) => {
    try {
        // First check if we have any employees
        const [employees] = await db.promise().query('SELECT employee_id, fname, lname FROM employees LIMIT 1');
        
        if (employees.length === 0) {
            // No employees, return empty array
            return res.json({
                success: true,
                data: []
            });
        }

        const [barbers] = await db.promise().query(`
            SELECT 
                e.employee_id as barber_id,
                CONCAT(COALESCE(e.fname, 'Unknown'), ' ', COALESCE(e.lname, 'Barber')) as barber_name,
                COUNT(sb.id) as total_bookings,
                SUM(CASE WHEN sb.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                COALESCE(AVG(s.price), 0) as avg_service_price
            FROM employees e
            LEFT JOIN service_bookings sb ON sb.barber_id = e.employee_id
            LEFT JOIN services s ON s.id = sb.service_id
            GROUP BY e.employee_id, e.fname, e.lname
            ORDER BY total_bookings DESC
            LIMIT 20
        `);
        
        res.json({
            success: true,
            data: barbers
        });
    } catch (error) {
        console.error('Error fetching barber performance:', error.message);
        console.error('SQL Error:', error.sql);
        // Return empty data instead of error to prevent frontend crash
        res.json({
            success: true,
            data: []
        });
    }
};

/**
 * Get booking status distribution
 */
exports.getStatusDistribution = async (req, res) => {
    try {
        const [statuses] = await db.promise().query(`
            SELECT 
                approval_status as status,
                COUNT(*) as count
            FROM service_bookings
            GROUP BY approval_status
        `);
        
        const [completionStatuses] = await db.promise().query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM service_bookings
            GROUP BY status
        `);
        
        res.json({
            success: true,
            data: {
                approval_status: statuses,
                booking_status: completionStatuses
            }
        });
    } catch (error) {
        console.error('Error fetching status distribution:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch status distribution' });
    }
};

/**
 * Get recent bookings for dashboard
 */
exports.getRecentBookings = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [bookings] = await db.promise().query(`
            SELECT 
                sb.id,
                sb.reference_number,
                sb.appointment_date,
                sb.appointment_time,
                sb.approval_status,
                sb.status as booking_status,
                sb.customer_name,
                sb.customer_phone,
                s.service_name,
                s.price,
                CONCAT(COALESCE(e.fname, ''), ' ', COALESCE(e.lname, '')) as barber_name
            FROM service_bookings sb
            LEFT JOIN services s ON s.id = sb.service_id
            LEFT JOIN employees e ON e.employee_id = sb.barber_id
            ORDER BY sb.created_at DESC
            LIMIT ?
        `, [limit]);
        
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching recent bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent bookings' });
    }
};

/**
 * Get revenue statistics
 */
exports.getRevenueStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Today's revenue
        const [todayRevenue] = await db.promise().query(`
            SELECT COALESCE(SUM(s.price), 0) as total
            FROM service_bookings sb
            JOIN services s ON s.id = sb.service_id
            WHERE DATE(sb.appointment_date) = ? AND sb.status = 'completed'
        `, [today]);
        
        // This week's revenue
        const [weekRevenue] = await db.promise().query(`
            SELECT COALESCE(SUM(s.price), 0) as total
            FROM service_bookings sb
            JOIN services s ON s.id = sb.service_id
            WHERE YEARWEEK(sb.appointment_date) = YEARWEEK(NOW()) AND sb.status = 'completed'
        `);
        
        // This month's revenue
        const [monthRevenue] = await db.promise().query(`
            SELECT COALESCE(SUM(s.price), 0) as total
            FROM service_bookings sb
            JOIN services s ON s.id = sb.service_id
            WHERE MONTH(sb.appointment_date) = MONTH(NOW()) AND YEAR(sb.appointment_date) = YEAR(NOW()) AND sb.status = 'completed'
        `);
        
        // Total revenue
        const [totalRevenue] = await db.promise().query(`
            SELECT COALESCE(SUM(s.price), 0) as total
            FROM service_bookings sb
            JOIN services s ON s.id = sb.service_id
            WHERE sb.status = 'completed'
        `);
        
        res.json({
            success: true,
            data: {
                today: todayRevenue[0].total,
                thisWeek: weekRevenue[0].total,
                thisMonth: monthRevenue[0].total,
                total: totalRevenue[0].total
            }
        });
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch revenue stats' });
    }
};