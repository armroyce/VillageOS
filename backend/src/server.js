require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./config/logger');
const controlDb = require('./config/controlDb');
const Village = require('./models/control/Village');
const Subscription = require('./models/control/Subscription');

// Set up associations on control models
Village.hasOne(Subscription, { foreignKey: 'village_id', as: 'subscription' });
Subscription.belongsTo(Village, { foreignKey: 'village_id' });

const app = express();

// Security
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.FRONTEND_URL_PROD,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.village_id || req.ip,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/super', require('./routes/super.routes'));
app.use('/api/v1', require('./routes/tenant.routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' } });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await controlDb.authenticate();
    logger.info('Control DB connected');
    await controlDb.sync();
    logger.info('Control DB synced');
    app.listen(PORT, () => logger.info(`VillageOS API running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
