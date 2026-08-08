const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Body Parser & CORS Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Logging Middleware in Dev
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limit each IP to 2000 requests per windowMs
    message: { success: false, message: 'Too many requests from this IP, please try again later' },
});
app.use('/api', limiter);

// Serve static frontend files from 'client' folder
app.use(express.static(path.join(__dirname, '../client')));

// REST API Route Registrations
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/pregnancies', require('./routes/pregnancyRoutes'));
app.use('/api/anc-visits', require('./routes/ancRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/babies', require('./routes/babyRoutes'));
app.use('/api/pnc-visits', require('./routes/pncRoutes'));
app.use('/api/laboratory', require('./routes/labRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

// Fallback to client/index.html for single-page routing
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Connect to MongoDB and start Express server
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 7000;
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`  ANC/PNC MANAGEMENT SYSTEM SERVER RUNNING ON PORT ${PORT} `);
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`  Client Interface: http://localhost:${PORT}`);
        console.log(`=======================================================`);
    });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`[Unhandled Rejection Error]: ${err.message}`);
});

module.exports = app;
