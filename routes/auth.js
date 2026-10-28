const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');

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

module.exports = router;
