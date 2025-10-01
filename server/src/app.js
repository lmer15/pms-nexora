// Initialize Firebase Admin
require('./config/firebase-admin');

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const facilityShareRoutes = require('./routes/facilityShareRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const noteRoutes = require('./routes/noteRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');
const { downloadAttachment } = require('./controllers/taskAttachmentController');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandlerMiddleware');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for attachments
app.use('/uploads/attachments', express.static(path.join(__dirname, '../uploads/attachments')));

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Public download route
app.get('/api/attachments/download/:filename', downloadAttachment);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/facilities', facilityShareRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/timeLogs', timeLogRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
