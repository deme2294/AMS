const db = require('../models/db');

/**
 * Get core statistics for the dashboard
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const [users] = await db.promise().query('SELECT COUNT(*) as count FROM users');
        
        // Handle missing 'news' table gracefully
        let newsCount = 0;
        try {
            const [news] = await db.promise().query('SELECT COUNT(*) as count FROM news');
            newsCount = news[0].count;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log('[ANALYTICS] News table does not exist, using 0');
            } else {
                throw err;
            }
        }
        
        // Handle missing 'comments' table gracefully
        let commentsCount = 0;
        let pendingCommentsCount = 0;
        try {
            const [comments] = await db.promise().query('SELECT COUNT(*) as count FROM comments');
            commentsCount = comments[0].count;
            const [pendingComments] = await db.promise().query('SELECT COUNT(*) as count FROM comments WHERE approved = 0');
            pendingCommentsCount = pendingComments[0].count;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log('[ANALYTICS] Comments table does not exist, using 0');
            } else {
                throw err;
            }
        }
        // Handle missing 'subscribers' table gracefully
        let subscribersCount = 0;
        try {
            const [subscribers] = await db.promise().query('SELECT COUNT(*) as count FROM subscribers WHERE status = "active"');
            subscribersCount = subscribers[0].count;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log('[ANALYTICS] Subscribers table does not exist, using 0');
            } else {
                throw err;
            }
        }
        
        // Handle missing 'investor_inquiries' table gracefully
        let inquiriesCount = 0;
        try {
            const [inquiries] = await db.promise().query('SELECT COUNT(*) as count FROM investor_inquiries WHERE status = "pending"');
            inquiriesCount = inquiries[0].count;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log('[ANALYTICS] Investor inquiries table does not exist, using 0');
            } else {
                throw err;
            }
        }
        
        // Handle missing 'contact_messages' table gracefully
        let messagesCount = 0;
        try {
            const [messages] = await db.promise().query('SELECT COUNT(*) as count FROM contact_messages WHERE status = "new"');
            messagesCount = messages[0].count;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log('[ANALYTICS] Contact messages table does not exist, using 0');
            } else {
                throw err;
            }
        }

        res.json({
            success: true,
            data: {
                totalUsers: users[0].count,
                totalPosts: newsCount,
                totalComments: commentsCount,
                pendingComments: pendingCommentsCount,
                activeSubscribers: subscribersCount,
                pendingInquiries: inquiriesCount,
                newMessages: messagesCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
};

/**
 * Get monthly data for charts (example: news posts per month)
 */
exports.getMonthlyGrowth = async (req, res) => {
    try {
        // Handle missing 'news' table gracefully
        let newsGrowth = [];
        try {
            const [newsGrowthResult] = await db.promise().query(`
                SELECT 
                    DATE_FORMAT(createdAt, '%M') as month, 
                    COUNT(*) as count 
                FROM news 
                GROUP BY MONTH(createdAt), month
                ORDER BY MONTH(createdAt)
            `);
            newsGrowth = newsGrowthResult;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log('[ANALYTICS] News table does not exist, using empty array');
            } else {
                throw err;
            }
        }

        const [userGrowth] = await db.promise().query(`
            SELECT 
                DATE_FORMAT(created_at, '%M') as month, 
                COUNT(*) as count 
            FROM users 
            GROUP BY MONTH(created_at), month
            ORDER BY MONTH(created_at)
        `);

        res.json({
            success: true,
            data: {
                newsGrowth,
                userGrowth
            }
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch growth data' });
    }
};
