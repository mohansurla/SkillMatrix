require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase } = require('./database/db');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const config = require('./config');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'SkillMatrix API is running 🚀', version: '1.0.0' });
});

// API routes
app.use('/api', routes);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(config.server.port, () => {
      console.log(`\n🚀 SkillMatrix API running on http://localhost:${config.server.port}`);
      console.log(`📦 Environment: ${config.server.env}`);
      console.log(`🗄️  Database: SQLite\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();