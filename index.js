const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');

const app = express();

// Startup check for required environment variables
const required = ['SESSION_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
    console.error(`missing ${missing.join(', ')}: see .env.example`);
    process.exit(1);
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);
app.use('/groups', groupRoutes);

// Default redirect
app.get('/', (req, res) => {
    res.redirect('/groups');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', db: 'ok' });
});

// Handle unknown pages (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status ?? 500;
    res.status(status).json({
        error: status < 500 ? 'That request is not valid' : 'Something went wrong on our side'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});