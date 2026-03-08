// routes/api.js
// REST API routes for LivePoll

const express = require('express');
const router = express.Router();
const { getSession, getAllSessions } = require('../models/Session');

// Get all sessions (Dashboard list)
router.get('/sessions', (req, res) => {
    const sessions = getAllSessions();
    res.json(sessions.map(s => s.toJSON()));
});

// Get overall statistics
router.get('/stats', (req, res) => {
    const sessions = getAllSessions();
    const totalParticipants = sessions.reduce((sum, s) => sum + s.getParticipantCount(), 0);
    const activeSessions = sessions.filter(s => s.isActive).length;

    res.json({
        totalSessions: sessions.length,
        totalParticipants,
        activeSessions,
        participationRate: sessions.length > 0 ? (totalParticipants / sessions.length).toFixed(1) : 0
    });
});

// Check if session exists
router.get('/session/:code', (req, res) => {
    const session = getSession(req.params.code);
    if (!session) {
        return res.status(404).json({ error: 'Session not found', exists: false });
    }
    res.json({
        exists: true,
        name: session.name,
        code: session.code,
        participantCount: session.getParticipantCount(),
        isActive: session.isActive
    });
});

// Get current results for a session
router.get('/session/:code/results', (req, res) => {
    const session = getSession(req.params.code);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const activity = session.getCurrentActivity();
    if (!activity) {
        return res.json({ hasActivity: false });
    }

    let results;
    switch (activity.type) {
        case 'poll':
            results = session.getPollResults(activity.id);
            break;
        case 'quiz':
            results = session.getQuizResults(activity.id);
            break;
        case 'wordcloud':
            results = session.getWordCloudResults(activity.id);
            break;
        case 'qa':
            results = session.getQAResults(activity.id);
            break;
    }

    res.json({ hasActivity: true, activity: results });
});

// Get session info (for presenter)
router.get('/session/:code/info', (req, res) => {
    const session = getSession(req.params.code);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session.toJSON());
});

module.exports = router;
