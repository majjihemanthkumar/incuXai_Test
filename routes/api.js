// routes/api.js
// REST API routes for LivePoll

const express = require('express');
const router = express.Router();
const { DbSession } = require('../models/DbSession');

// Check if session exists
router.get('/session/:code', async (req, res) => {
    try {
        const session = await DbSession.getByCode(req.params.code);
        if (!session) {
            return res.status(404).json({ error: 'Session not found', exists: false });
        }
        res.json({
            exists: true,
            name: session.name,
            code: session.code,
            participantCount: 0,
            isActive: session.is_active,
            is_active: session.is_active
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current results for a session
router.get('/session/:code/results', async (req, res) => {
    try {
        const session = await DbSession.getByCode(req.params.code);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const activity = (session.activities || []).find(a => a.is_open);
        if (!activity) {
            return res.json({ hasActivity: false });
        }

        const results = await DbSession.getResults(activity.id, activity.type);
        res.json({ hasActivity: true, activity: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get session info (for presenter)
router.get('/session/:code/info', async (req, res) => {
    try {
        const session = await DbSession.getByCode(req.params.code);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
