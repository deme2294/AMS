const express = require("express");
const cors = require("cors");

// --- EMERGENCY STARTUP LOGGER ---
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
// -------------------------------

const session = require("express-session");
const path = require("path");
const http = require("http");
// const { ExpressPeerServer } = require("peer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const fs = require("fs");
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
const envPath = path.resolve(__dirname, envFile);
const finalEnvPath = fs.existsSync(envPath) ? envPath : path.resolve(__dirname, ".env");

dotenv.config({ path: finalEnvPath });

if (process.env.NODE_ENV === 'production' && !process.env.RECAPTCHA_SECRET_KEY) {
  console.error('❌ CRITICAL: RECAPTCHA_SECRET_KEY is missing in production environment!');
  console.error('   Please add it to your .env.production file to enable security features.');
}

console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`✅ Loading config from: ${finalEnvPath}`);

// Standardized DB connection
const db = require("./models/db");

// Importing Routes
const userRoutes = require("./routes/userRoutes.js");
const employeeRoutes = require("./routes/employeeRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const analyticsRoutes = require("./routes/analyticsRoutes.js");
const serviceAnalyticsRoutes = require("./routes/serviceAnalyticsRoutes.js");
const authMiddleware = require("./middleware/authMiddleware.js");
const loggingMiddleware = require("./middleware/loggingMiddleware.js");
const verifyToken = require("./middleware/verifyToken.js");
const { restrictTo } = require("./middleware/roleMiddleware.js");
const { ROLES } = require("./middleware/roles.js");
const setupSocket = require("./socketHandler.js");
const cookieParser = require("cookie-parser");

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by'); // Primary way to remove Express header

app.use(cookieParser());

// --- 1. PROPER CORS SETUP (Consolidated & Strict) ---
const allowedOrigins = [
  "https://admin.ethiopianitpark.et",
  "https://ethiopianitpark.et",
  "https://www.ethiopianitpark.et",
  "https://api-cms.startechaigroup.com",
  "http://localhost:3000",
  "http://localhost:3033",
  "http://localhost:3034",
  "http://localhost:5173",
  "http://192.168.1.114:5005",
  "http://192.168.1.114:5006",
  "http://192.168.1.114:5007",
  "http://192.168.1.114:5173",
  "http://localhost:3001",
  "http://localhost:3002",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
    const isOfficialDomain = /(^|\.)ethiopianitpark\.et$/.test(origin) || /(^|\.)startechaigroup\.com$/.test(origin);

    if (isLocalhost || isOfficialDomain) {
      return callback(null, true);
    }

    console.error(`[SECURITY] CORS Blocked malicious origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-Custom-Header"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200
}));
// --- 2. GLOBAL SECURITY HEADERS (Helmet & Custom) ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Kept for now as React often uses inline styles
      imgSrc: ["'self'", "data:", "blob:", "*"],
      connectSrc: ["'self'", "http://localhost:5005", "https://api-cms.startechaigroup.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "*"],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.youtube.com"],
      upgradeInsecureRequests: [],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "sameorigin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { policy: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true, // Legacy support
}));

// Manual Headers for Permissions-Policy and Information Disclosure
app.use((req, res, next) => {
  // Fix for: Missing Permissions-Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)');

  // Fix for: Info Disclosure - attempting to strip headers that might be added by middleware OR proxy wrappers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // CRITICAL: Forcefully remove restrictive COEP/COOP headers that block images
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');

  // CRITICAL: Forcefully allow cross-origin resource sharing for images/assets
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Cache Control (Consolidated)
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
});

// Global CORS Error Logger
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS Error: Origin not allowed' });
  }
  next(err);
});

// PeerJS Server Setup
// const peerServer = ExpressPeerServer(server, {
//   debug: true,
//   allow_discovery: true,
//   proxied: true 
// });
// app.use("/peerjs", peerServer);
//setupSocket(server);

// Trust first proxy (if behind Nginx)
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ams_default_session_secret_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000, // 30 minutes (consistent with other session limits)
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'Lax', // Lax provides a good balance of security and cross-site navigation
    },
  })
);

// --- 3. RATE LIMITING (Protection against DDoS and Brute Force) ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Reduced from 1000 for better security
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  },
  standardHeaders: 'draft-7', // Modern RateLimit headers (Fix for: missing rate-limit headers)
  legacyHeaders: false,
});

app.use(globalLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path, stat) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// --- Rescue Route Removed for Security ---

// --- Health Check & Discovery Routes ---
app.get("/", (req, res) => {
  // Use a simple query with a callback to avoid any promise-related crashes
  db.query("SELECT 1", (err) => {
    res.status(200).json({
      success: true,
      message: "BMS API Service is running"
    });
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Admin helper for Availability Management UI:
// Requirement: when admin updates slots, they should appear in the active slots schedule.
// UI/AMS calls: http://localhost:3034/services/availability
app.get(
  "/services/availability",
  verifyToken,
  restrictTo([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST]),
  async (req, res) => {
    try {
      const { service_id, barber_id, date, slot_status } = req.query;

      // “Active Slots Schedule” => keep it consistent:
      // show available/booked by default, optionally allow explicit slot_status filtering.
      const activeStatuses = ["available", "booked"];

      let query = `
        SELECT 
          a.*, 
          s.service_name, 
          e.name as barber_name, 
          e.fname, 
          e.lname
        FROM availability_slots a
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN employees e ON a.barber_id = e.employee_id
        WHERE 1=1
      `;
      const params = [];

      if (service_id !== undefined && service_id !== "") {
        query += ` AND a.service_id = ?`;
        params.push(service_id);
      }

      if (barber_id !== undefined && barber_id !== "") {
        query += ` AND (a.barber_id = ? OR a.barber_id IS NULL)`;
        params.push(barber_id);
      }

      if (date !== undefined && date !== "") {
        query += ` AND DATE(a.available_date) = DATE(?)`;
        params.push(date);
      }

      if (slot_status !== undefined && slot_status !== "") {
        // allow explicit status filtering if caller asks
        query += ` AND a.slot_status = ?`;
        params.push(slot_status);
      } else {
        query += ` AND a.slot_status IN (${activeStatuses.map(() => "?").join(",")})`;
        params.push(...activeStatuses);
      }

      query += ` ORDER BY a.available_date ASC, a.start_time ASC`;

      const [rows] = await db.promise().query(query, params);

      const formattedRows = rows.map((r) => ({
        ...r,
        barber_name: r.barber_id
          ? (r.barber_name || r.fname || `Barber #${r.barber_id}`)
          : "Global (Any Barber)",
        service_name: r.service_name || `Service #${r.service_id}`,
      }));

      return res.status(200).json({ success: true, data: formattedRows });
    } catch (e) {
      console.error("GET /services/availability error:", e);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch active availability slots",
        error: e.message,
      });
    }
  }
);
// Serve robots.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send("User-agent: *\nAllow: /");
});


// Auth Routes - Mounted early with multiple paths for maximum resilience
// Supports both legacy/root calls and standard /api calls
app.use("/api", authRoutes);
app.use("/", authRoutes);

// Using Routes
app.use("/api", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/roles", require("./routes/roleRoutes.js"));
app.use("/api/analytics", analyticsRoutes);
app.use("/api/service-analytics", serviceAnalyticsRoutes);
app.use("/api/services", require("./routes/serviceRoutes.js"));
app.use("/api/service-categories", require("./routes/serviceCategoryRoutes.js"));
app.use("/api/availability", require("./routes/availabilityRoutes.js"));
app.use("/api/service_bookings", require("./routes/service_bookingsRoutes.js"));
app.use("/api/booking_workflow", require("./routes/bookingWorkflowRoutes.js"));
app.use("/api/queues", require("./routes/queueRoutes.js"));
app.use("/api/notifications", require("./routes/notificationRoutes.js"));
app.use("/api/settings", require("./routes/settingsRoutes.js"));

// Complaint Analytics Endpoint - Mock Data for now
app.get("/api/complaints/analytics", verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), (req, res) => {
  res.json({
    success: true,
    data: {
      statusDistribution: [
        { status: 'Pending', count: 0 },
        { status: 'In Progress', count: 0 },
        { status: 'Resolved', count: 0 },
        { status: 'Closed', count: 0 }
      ],
      priorityDistribution: [
        { priority: 'Low', count: 0 },
        { priority: 'Medium', count: 0 },
        { priority: 'High', count: 0 },
        { priority: 'Critical', count: 0 }
      ],
      typeDistribution: [
        { complaint_type: 'Service Quality', type: 'Service Quality', count: 0 },
        { complaint_type: 'Staff Behavior', type: 'Staff Behavior', count: 0 },
        { complaint_type: 'Facility', type: 'Facility', count: 0 },
        { complaint_type: 'Booking Issue', type: 'Booking Issue', count: 0 },
        { complaint_type: 'Other', type: 'Other', count: 0 }
      ],
      recentComplaints: []
    }
  });
});

// Menus endpoint - Returns empty array for now
app.get("/api/menus/my-nav", verifyToken, (req, res) => {
  res.json({ success: true, data: [] });
});

// Notification & Stats fallback routes
app.get("/api/complaints/stats", (req, res) => {
  res.json({ success: true, data: { pending: 0, highPriority: 0, total: 0 } });
});
app.get("/api/contact/messages", (req, res) => {
  res.json({ success: true, data: [] });
});
app.get("/api/investor-inquiries", (req, res) => {
  res.json({ success: true, data: [] });
});

// 404 Handler - Catch-all for unmatched routes
app.use((req, res, next) => {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl || req.url}`;
  console.log(`[404] ${req.method} ${fullUrl} - Not Matched (Base: ${req.baseUrl}, URL: ${req.url})`);
  res.status(404).json({
    success: false,
    message: `API Route ${req.method} ${req.originalUrl || req.url} not found on this server.`,
    debug: {
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      method: req.method
    }
  });
});

// Global Error Handling
app.use((err, req, res, next) => {
  // Log full details on server side only
  const timestamp = new Date().toISOString();
  console.error(`[ERROR ${timestamp}] ${req.method} ${req.url}`);
  console.error(`Message: ${err.message}`);
  if (err.stack) console.error(err.stack);

  // 1. Handle JSON Parsing Errors (SyntaxError from express.json)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: "The request contains malformed data. Please check your input format."
    });
  }

  // 2. Handle Multer Errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: "File upload failed. Please ensure the file meets the requirements (size, type)."
    });
  }

  // 3. Handle CORS Errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS Error: Access restricted' });
  }

  const statusCode = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? "An unexpected server error occurred. Our team has been notified."
      : (isDev ? err.message : "The request could not be processed. Please try again later."),
    ...(isDev && { stack: err.stack }) // Only expose stack in dev mode
  });
});

// --- .env Loading Verification ---
// (Already handled at top of file)

// ... rest of imports/setup remains same ...
// (Note: Port and server logic follows)

// Get local IP address
const os = require('os');
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';
for (const name of Object.keys(networkInterfaces)) {
  for (const iface of networkInterfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIP = iface.address;
      break;
    }
  }
  if (localIP !== 'localhost') break;
}

// ---- Port auto-selection (scan for first free port) ----
const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const isPortFree = (port) => {
  return new Promise((resolve) => {
    const srv = net.createServer();

    srv.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') return resolve(false);
      return resolve(false);
    });

    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });

    srv.listen(port, '0.0.0.0');
  });
};

const killProcessOnPort = async (port) => {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port} | findstr LISTENING`);
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }

    if (pids.size === 0) return false;

    for (const pid of pids) {
      try {
        await execPromise(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
        const { stdout: taskOutput } = await execPromise(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
        if (taskOutput.includes('node.exe') || taskOutput.includes('node')) {
          await execPromise(`taskkill /F /PID ${pid}`);
          console.log(`🧹 Killed stale node process (PID: ${pid}) on port ${port}`);
        }
      } catch (e) {
        // Process may have already exited
      }
    }
    return true;
  } catch (e) {
    return false;
  }
};

const findFreePort = async (startPort, maxAttempts = 100) => {
  let port = startPort;

  for (let i = 0; i < maxAttempts; i++) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);

    if (free) return port;

    console.warn(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
    port += 1;
  }

  throw new Error(`No free port found starting from ${startPort} (tried ${maxAttempts} ports).`);
};

const startServerOnPort = (port) => {
  return new Promise((resolve, reject) => {
    const newServer = http.createServer(app);

    newServer.once('listening', () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📱 Mobile access: http://${localIP}:${port}/complaint-form`);

      // Attach socket ONLY after successful start
      try {
        setupSocket(newServer);
      } catch (e) {
        console.error('❌ setupSocket failed:', e);
      }

      // Seed default system roles on startup (safe — uses ON DUPLICATE KEY UPDATE)
      try {
        const roleController = require('./controllers/roleController');
        roleController.seedDefaultRoles();
      } catch (e) {
        console.error('[ROLES] Failed to seed default roles:', e);
      }

      resolve({ server: newServer, port });
    });

    newServer.once('error', (err) => {
      reject(err);
    });

    newServer.listen(port);
  });
};

// ✅ DEFINE PORT ONLY ONCE
// Requirement: start scanning from 5005 (unless explicitly overridden)
const PORT_START = parseInt(process.env.PORT_START) || parseInt(process.env.PORT) || 5005;

/**
 * ✅ START: auto-scan + if race still happens, retry on next ports
 * Note: requirement says “when port 5005 is busy, auto-switch”.
 * We keep scanning from PORT_START upward and ONLY start the HTTP server once.
 */
(async () => {
  const MAX_START_ATTEMPTS = 50;

  // Clean up stale node processes on the preferred port before starting
  const cleaned = await killProcessOnPort(PORT_START);
  if (cleaned) {
    console.log(`🧹 Cleaned up stale process on port ${PORT_START}`);
  }

  for (let i = 0; i < MAX_START_ATTEMPTS; i++) {
    const candidatePort = PORT_START + i;

    try {
      // Optional: pre-check to reduce chance of racing with another process
      const free = await isPortFree(candidatePort);
      if (!free) {
        console.warn(`⚠️ Port ${candidatePort} is busy, trying ${candidatePort + 1}...`);
        continue;
      }

      await startServerOnPort(candidatePort);
      return;
    } catch (e) {
      if (e && e.code === 'EADDRINUSE') {
        console.warn(`⚠️ EADDRINUSE on ${candidatePort}. Retrying next port...`);
        continue;
      }
      console.error('❌ Failed to start server:', e);
      process.exit(1);
    }
  }

  console.error(`❌ Could not start server: no free ports found starting from ${PORT_START}.`);
  process.exit(1);
})();


// Scheduled task to clean up expired revoked tokens every 6 hours
setInterval(async () => {
  try {
    console.log("[SECURITY] Running cleanup for expired revoked tokens...");
    const [result] = await db.promise().query("DELETE FROM revoked_tokens WHERE expires_at < NOW()");
    if (result.affectedRows > 0) {
      console.log(`[SECURITY] Cleaned up ${result.affectedRows} expired revoked tokens.`);
    }
  } catch (err) {
    console.error("[SECURITY] Error during revoked tokens cleanup:", err);
  }
}, 6 * 60 * 60 * 1000);



/// TAKE THE ABOVE BY COMPARING.
// 10-minute appointment reminder job using node-cron logic
setInterval(async () => {
  try {
    const [upcomingBookings] = await db.promise().query(
      "SELECT sb.*, s.service_name, e.name as barber_name \r\n" +
      "         FROM service_bookings sb \r\n" +
      "         JOIN services s ON sb.service_id = s.id \r\n" +
      "         LEFT JOIN employees e ON sb.barber_id = e.employee_id \r\n" +
      "         WHERE sb.approval_status = 'approved' \r\n" +
      "           AND sb.queue_status = 'queued' \r\n" +
      "           AND (sb.reminder_sent IS NULL OR sb.reminder_sent = 0)"
    );

    for (const booking of upcomingBookings) {
      const [q] = await db.promise().query(
        'SELECT queue_position FROM queues WHERE booking_id = ?',
        [booking.id]
      );

      if (q.length > 0) {
        const queuePosition = q[0].queue_position;
        const amsMailer = require('./services/amsMailerService');
        await amsMailer.sendAppointmentReminderEmail(
          booking.customer_email,
          booking.customer_name,
          booking.service_name,
          booking.barber_name || 'Any Barber',
          booking.appointment_date,
          booking.appointment_time,
          booking.reference_number,
          queuePosition
        );

        await db.promise().query(
          "UPDATE service_bookings SET reminder_sent = 1 WHERE id = ?",
          [booking.id]
        );
      }
    }
  } catch (err) {
    console.error("[REMINDER] Error sending appointment reminders:", err);
  }
}, 60000); // Run every minute

console.log("✅ Appointment reminder scheduler started");

// (end of file)


