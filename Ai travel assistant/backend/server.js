const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const { seedTransports } = require('./seeders/transportSeeder');
const { seedStations } = require('./seeders/stationSeeder');
const { seedFoodRecommendations } = require('./seeders/foodSeeder');
const { seedAdmin } = require('./seeders/adminSeeder');
const { seedTrains } = require('./seeders/trainSeeder');
const { seedFares } = require('./seeders/seed_fares');
const { seedChatbotKnowledge } = require('./seeders/chatbotSeeder');
const { seedAdminPanelData } = require('./seeders/adminPanelSeeder');
const { expirePendingBookings } = require('./services/bookingLifecycleService');
const { apiLimiter } = require('./middleware/rateLimiter');
const { antiScrapingShield, honeypotTrapHandler } = require('./middleware/antiScrapingMiddleware');

const authRoutes = require('./routes/authRoutes');
const travelRoutes = require('./routes/travelRoutes');
const profileRoutes = require('./routes/profileRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const foodRoutes = require('./routes/foodRoutes');
const carbonRoutes = require('./routes/carbonRoutes');
const securityRoutes = require('./routes/securityRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const sosRoutes = require('./routes/sosRoutes');
const supportRoutes = require('./routes/supportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const ragRoutes = require('./routes/ragRoutes');
const stationRoutes = require('./routes/stationRoutes');
const agentRoutes = require('./routes/agentRoutes');
const knowledgeGraphRoutes = require('./routes/knowledgeGraphRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const activityRoutes = require('./routes/activityRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const n8nRoutes = require('./routes/n8nRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const v1PublicRoutes = require('./routes/v1PublicRoutes');
const { loadHotelData } = require('./services/hotelService');



// ─── Mandatory Secret Validation (Fails startup if required secrets missing in production) ───
if (process.env.NODE_ENV === 'production') {
  const missingSecrets = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missingSecrets.push('JWT_SECRET (min 32 chars)');
  if (!process.env.DB_PASSWORD) missingSecrets.push('DB_PASSWORD');
  if (!process.env.INTERNAL_SERVICE_KEY) missingSecrets.push('INTERNAL_SERVICE_KEY');

  if (missingSecrets.length > 0) {
    console.error(`[FATAL] Startup aborted. Missing mandatory production secrets: ${missingSecrets.join(', ')}`);
    process.exit(1);
  }
}

const app = express();

// ─── Trust proxy for accurate IP detection (disabled by default to prevent header spoofing) ───
const trustProxyConfig = process.env.TRUST_PROXY === 'true' 
  ? 1 
  : (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== 'false' ? process.env.TRUST_PROXY : false);
app.set('trust proxy', trustProxyConfig);

// ─── Security Headers ───
app.use(helmet({
  crossOriginResourcePolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173", "ws://localhost:5173"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      upgradeInsecureRequests: [],
    },
  }
}));

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser server-to-server requests without Origin header
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      if (process.env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
        if (origin.includes('.devtunnels.ms')) return true;
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // Reject origin cleanly by withholding CORS headers without throwing an HTTP 500 exception
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Key', 'X-API-Token', 'x-api-key', 'X-Client-Shield', 'x-client-shield', 'x-traveliq-secret']
}));

// ─── Parsers (Restricted payload size to prevent memory exhaustion; preserve raw body for webhook HMAC) ───
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cookieParser());

// ─── Dynamic robots.txt to disallow scrapers and lay honeypot traps ───
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /api/
Disallow: /api/scrapers/
Disallow: /api/v1/deals-export
Disallow: /api/travel/export-all
Allow: /api/health
Allow: /api/v1/public
Sitemap: https://traveliq.com/sitemap.xml
`);
});

// ─── Honeypot Traps for Automated Crawlers & Scraping Bots ───
app.all('/api/scrapers/crawler-trap', honeypotTrapHandler);
app.all('/api/v1/deals-export', honeypotTrapHandler);
app.all('/api/travel/export-all', honeypotTrapHandler);

// ─── Global API rate limiter & Anti-Scraping Bot Shield ───
app.use('/api', apiLimiter);
app.use('/api', antiScrapingShield);

// ─── Request logger (slow requests) ───
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[SLOW] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ─── Serve ONLY public user avatars statically ───
// Private files (support attachments, RAG documents, etc.) are strictly served through authenticated endpoints
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
  }
}));

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/graph', knowledgeGraphRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/n8n', n8nRoutes);

// B2B & Developer Platform Routes
app.use('/api/developer', apiKeyRoutes);
app.use('/api/v1/public', v1PublicRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'TravelIQ Backend (MySQL)', uptime: process.uptime() });
});


// ─── 404 handler ───
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler (Express v5 compatible) ───
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  console.error(err.stack);
  
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// ─── Sync database and start server ───
console.log('⏳ Starting database synchronization...');
sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
  .then(() => {
      console.log('⏳ Syncing schema...');
      return sequelize.sync({ alter: false });
  })
  .then(() => {
      console.log('⏳ Restoring foreign key checks...');
      return sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  })
  .then(async () => {
    console.log('✅ MySQL Database synchronized with alter schema successfully.');
    
    // Ensure train_stops view is created for deterministic routing
    try {
      await sequelize.query(`
        CREATE OR REPLACE VIEW train_stops AS
        SELECT id, train_number AS train_no, train_number, station_code, arrival_time, departure_time, day_count, stop_sequence
        FROM train_schedules
      `);
    } catch (vErr) {
      console.warn('[DB Init] train_stops view notice:', vErr.message);
    }
    
    // Run seeders after sync
    try {
      console.log('⏳ Running seeders...');
      await seedAdmin();
      await seedTransports();
      await seedStations();
      await seedTrains();
      await seedFares();
      await seedFoodRecommendations();
      await seedChatbotKnowledge();
      await loadHotelData();
      await seedAdminPanelData();
      console.log('✅ Seeders completed.');
    } catch (seedErr) {
      console.error('⚠️  Seeder warning (non-fatal):', seedErr.message);
    }
    
    // ─── Scheduled Background Worker: Pending Booking Expiration (P1 requirement) ───
    const pendingExpiryInterval = setInterval(async () => {
      try {
        const expResult = await expirePendingBookings({ maxAgeMinutes: 15 });
        if (expResult?.expiredCount > 0) {
          console.log(`[LifecycleScheduler] Expired ${expResult.expiredCount} stale pending bookings.`);
        }
      } catch (expErr) {
        console.warn('[LifecycleScheduler] Expiry worker notice:', expErr.message);
      }
    }, 60000); // Recurring check every 60 seconds

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already occupied!`);
        console.error(`👉 Another process is running on this port. To fix this, you can:`);
        console.error(`   1. Run 'npx kill-port ${PORT}' to automatically free up the port.`);
        console.error(`   2. Or modify the PORT variable inside backend/.env to another port (e.g., PORT=5001).\n`);
        process.exit(1);
      } else {
        console.error('❌ Server listener error:', err.message);
      }
    });
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err.message);
    console.error('   Make sure MySQL is running and the "traveliq" database exists.');
    console.error('   Connection config: host=%s port=%s user=%s db=%s',
      process.env.DB_HOST || 'localhost',
      process.env.DB_PORT || '3306',
      process.env.DB_USER || 'traveliq_app',
      process.env.DB_NAME || 'traveliq'
    );
    process.exit(1);
  });

// ─── Graceful shutdown ───
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  sequelize.close().then(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  console.error('Fatal Uncaught Exception:', err.message);
  console.error(err.stack);
  // Do not continue in potentially corrupted state; close DB and exit with non-zero status
  sequelize.close().finally(() => {
    process.exit(1);
  });
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

module.exports = { app };
