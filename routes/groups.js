const express = require('express');
const router = express.Router();
const GroupService = require('../services/groupService');

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (!req.session.user) {
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            // [AC-8] An unauthenticated user cannot access group creation endpoints via direct API calls
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // [AC-1] A visitor who opens /groups without being signed in is automatically redirected to /login
        return res.redirect('/login');
    }
    next();
}

router.use(requireAuth);

// Dashboard view
router.get('/', async (req, res) => {
    try {
        const dashboardData = await GroupService.listUserDashboard(req.session.user.id);
        res.render('groups/index', { ...dashboardData, user: req.session.user, error: null });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Create group
router.post('/', async (req, res) => {
    try {
        const { name, description, maxMembers } = req.body;
        await GroupService.createGroup(req.session.user.id, {
            name,
            description,
            maxMembers: maxMembers ? parseInt(maxMembers) : 10
        });
        res.redirect('/groups');
    } catch (error) {
        const dashboardData = await GroupService.listUserDashboard(req.session.user.id);
        res.status(error.status || 400).render('groups/index', {
            ...dashboardData,
            user: req.session.user,
            error: error.message
        });
    }
});

// Group details view
router.get('/:id', async (req, res) => {
    try {
        const groupDetails = await GroupService.getGroupDetails(parseInt(req.params.id), req.session.user.id);
        res.render('groups/show', { group: groupDetails, user: req.session.user, error: null });
    } catch (error) {
        if (error.message === 'Group not found') {
            return res.status(404).send('Group not found');
        }
        res.status(500).send(error.message);
    }
});

// Join group
router.post('/:id/join', async (req, res) => {
    try {
        await GroupService.joinGroup(parseInt(req.params.id), req.session.user.id);
        res.redirect(`/groups/${req.params.id}`);
    } catch (error) {
        const groupDetails = await GroupService.getGroupDetails(parseInt(req.params.id), req.session.user.id);
        res.status(error.status || 400).render('groups/show', {
            group: groupDetails,
            user: req.session.user,
            error: error.message
        });
    }
});

// Leave group
router.post('/:id/leave', async (req, res) => {
    try {
        await GroupService.leaveGroup(parseInt(req.params.id), req.session.user.id);
        res.redirect('/groups');
    } catch (error) {
        const groupDetails = await GroupService.getGroupDetails(parseInt(req.params.id), req.session.user.id);
        res.status(error.status || 400).render('groups/show', {
            group: groupDetails,
            user: req.session.user,
            error: error.message
        });
    }
});

// Schedule meeting
router.post('/:id/meetings', async (req, res) => {
    try {
        const { title, startTime, endTime, location } = req.body;
        await GroupService.scheduleMeeting(parseInt(req.params.id), req.session.user.id, {
            title, startTime, endTime, location
        });
        res.redirect(`/groups/${req.params.id}`);
    } catch (error) {
        const groupDetails = await GroupService.getGroupDetails(parseInt(req.params.id), req.session.user.id);
        res.status(error.status || 400).render('groups/show', {
            group: groupDetails,
            user: req.session.user,
            error: error.message
        });
    }
});

module.exports = router;
