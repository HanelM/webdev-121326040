const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AuthService = require('../services/authService');
const pool = require('../data/db'); // Adjust path to your database pool if needed

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://webdev-121326040.onrender.com/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0].value;
        const name = profile.displayName;

        // Check if user already exists in database
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];

        if (!user) {
            // Register user if they don't exist
            const registerResult = await pool.query(
                'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
                [email, name, 'GOOGLE_OAUTH_USER']
            );
            user = registerResult.rows[0];
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

// Standard Login & Register Routes
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/groups');
    }
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await AuthService.login(email, password);
        req.session.user = user;
        res.redirect('/groups');
    } catch (error) {
        res.render('login', { error: error.message });
    }
});

router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/groups');
    }
    res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const user = await AuthService.register(email, password, name);
        req.session.user = user;
        res.redirect('/groups');
    } catch (error) {
        res.render('register', { error: error.message });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- Google OAuth Routes ---
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Save user to your custom session structure used across the app
        req.session.user = req.user;
        res.redirect('/groups');
    }
);

module.exports = router;