require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const { sequelize } = require('./models');
const { seedTransports } = require('./seeders/transportSeeder');
const { seedStations } = require('./seeders/stationSeeder');
const { seedFoodRecommendations } = require('./seeders/foodSeeder');
const { seedAdmin } = require('./seeders/adminSeeder');
const { seedTrains } = require('./seeders/trainSeeder');
const { seedChatbotKnowledge } = require('./seeders/chatbotSeeder');
const { seedAdminPanelData } = require('./seeders/adminPanelSeeder');
const { apiLimiter } = require('./middleware/rateLimiter');

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



const app = express();

// ─── Trust proxy for accurate IP detection ───
app.set('trust proxy', 1);

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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') || 
      origin.includes('devtunnels.ms')
    ) {
      return callback(null, true);
    }
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Key', 'X-API-Token', 'x-api-key']
}));

// ─── Parsers ───
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ─── Global API rate limiter ───
app.use('/api', apiLimiter);

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

// ─── Serve uploaded files ───
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    
    // Run seeders after sync
    try {
      console.log('⏳ Running seeders...');
      await seedAdmin();
      await seedTransports();
      await seedStations();
      await seedTrains();
      await seedFoodRecommendations();
      await seedChatbotKnowledge();
      await loadHotelData();
      await seedAdminPanelData();
      console.log('✅ Seeders completed.');
    } catch (seedErr) {
      console.error('⚠️  Seeder warning (non-fatal):', seedErr.message);
    }
    
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
      process.env.DB_USER || 'root',
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
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
