// server.js — LivePoll Main Server
// Express + Socket.io for real-time interactive presentations

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { DbSession } = require('./models/DbSession');
const { insforge } = require('./utils/insforge');

// --- App Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));
app.use('/api', apiRoutes);

// --- Health Check ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- Catch-All for React Router (fallback for deployment) ---
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
        next();
    }
});

// --- Socket.io Event Handlers ---
io.on('connection', (socket) => {
    console.log(`✦ User connected: ${socket.id}`);

    // ─── CREATE SESSION ───
    socket.on('create-session', async (data, callback) => {
        try {
            const session = await DbSession.create(data.name || 'Untitled Session');
            socket.join(session.code);
            console.log(`✦ Session created (DB): ${session.code} by ${socket.id}`);
            callback({
                success: true,
                session: {
                    id: session.id,
                    code: session.code,
                    name: session.name,
                    isActive: session.is_active,
                    activities: []
                }
            });
        } catch (error) {
            console.error('Error creating session:', error);
            callback({ success: false, error: 'Failed to create session' });
        }
    });

    // ─── JOIN SESSION ───
    socket.on('join-session', async (data, callback) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) {
                return callback({ success: false, error: 'Session not found' });
            }
            if (!session.is_active) {
                return callback({ success: false, error: 'Session has ended' });
            }

            const participant = await DbSession.addParticipant(session.id, data.name);
            socket.join(data.code);
            console.log(`✦ ${data.name || 'Anonymous'} joined session ${data.code} (DB: ${participant.id})`);

            // Notify presenter about new participant
            // Note: We still use Socket.io for the real-time notification here for now
            // but we fetch the updated list from the DB
            const { data: participants } = await insforge.database
                .from('participants')
                .select('name, joined_at')
                .eq('session_id', session.id);

            io.to(data.code).emit('participant-joined', {
                participantCount: participants.length,
                name: data.name || 'Anonymous',
                participants: participants.map(p => ({ name: p.name, joinedAt: p.joined_at }))
            });

            // Send current activity to the new participant
            const currentActivity = (session.activities || []).find(a => a.is_open);
            callback({
                success: true,
                sessionName: session.name,
                participantCount: participants.length,
                currentActivity: currentActivity ? {
                    id: currentActivity.id,
                    type: currentActivity.type,
                    question: currentActivity.question,
                    options: currentActivity.options,
                    isOpen: currentActivity.is_open
                } : null
            });
        } catch (error) {
            console.error('Error joining session:', error);
            callback({ success: false, error: 'Failed to join session' });
        }
    });

    // ─── ADD ACTIVITY ───
    socket.on('add-activity', async (data, callback) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) {
                return callback({ success: false, error: 'Unauthorized or session not found' });
            }

            const activity = await DbSession.addActivity(session.id, {
                type: data.type,
                question: data.question,
                options: data.options || [],
                correctAnswer: data.correctAnswer ?? null
            });

            console.log(`✦ Activity added (DB): ${data.type} in session ${data.code}`);

            // Get updated session data to return
            const updatedSession = await DbSession.getByCode(data.code);

            callback({
                success: true,
                activity: {
                    id: activity.id,
                    type: activity.type,
                    question: activity.question,
                    options: activity.options,
                    isOpen: activity.is_open
                },
                session: {
                    ...updatedSession,
                    activities: updatedSession.activities.map(a => ({
                        ...a,
                        isOpen: a.is_open,
                        responseCount: 0 // Ideally fetch from DB
                    }))
                }
            });
        } catch (error) {
            console.error('Error adding activity:', error);
            callback({ success: false, error: 'Failed to add activity' });
        }
    });

    // ─── LAUNCH ACTIVITY ───
    socket.on('launch-activity', async (data, callback) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) {
                return callback({ success: false, error: 'Unauthorized or session not found' });
            }

            const activityToLaunch = session.activities[data.index];
            if (!activityToLaunch) {
                return callback({ success: false, error: 'No activity at that index' });
            }

            const activity = await DbSession.launchActivity(activityToLaunch.id);

            console.log(`✦ Launched activity ${data.index}: ${activity.type} in session ${data.code}`);

            // Broadcast to all participants
            socket.to(data.code).emit('activity-launched', {
                id: activity.id,
                type: activity.type,
                question: activity.question,
                options: activity.options,
                isOpen: true
            });

            callback({
                success: true,
                activity: {
                    id: activity.id,
                    type: activity.type,
                    question: activity.question,
                    options: activity.options,
                    isOpen: true
                }
            });
        } catch (error) {
            console.error('Error launching activity:', error);
            callback({ success: false, error: 'Failed to launch activity' });
        }
    });

    // ─── NEXT ACTIVITY ───
    socket.on('next-activity', async (data, callback) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) {
                return callback({ success: false, error: 'Unauthorized or session not found' });
            }

            const currentIdx = session.activities.findIndex(a => a.is_open);
            const nextIdx = currentIdx + 1;

            if (nextIdx >= session.activities.length) {
                return callback({ success: false, error: 'No more activities' });
            }

            const activity = await DbSession.launchActivity(session.activities[nextIdx].id);

            socket.to(data.code).emit('activity-launched', {
                id: activity.id,
                type: activity.type,
                question: activity.question,
                options: activity.options,
                isOpen: true
            });

            const updatedSession = await DbSession.getByCode(data.code);

            callback({
                success: true,
                activity: {
                    id: activity.id,
                    type: activity.type,
                    question: activity.question,
                    options: activity.options,
                    isOpen: true
                },
                session: updatedSession
            });
        } catch (error) {
            console.error('Error in next-activity:', error);
            callback({ success: false, error: 'Failed to navigate' });
        }
    });

    // ─── PREVIOUS ACTIVITY ───
    socket.on('prev-activity', async (data, callback) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) {
                return callback({ success: false, error: 'Unauthorized or session not found' });
            }

            const currentIdx = session.activities.findIndex(a => a.is_open);
            const prevIdx = currentIdx - 1;

            if (prevIdx < 0) {
                return callback({ success: false, error: 'Already at the beginning' });
            }

            const activity = await DbSession.launchActivity(session.activities[prevIdx].id);

            socket.to(data.code).emit('activity-launched', {
                id: activity.id,
                type: activity.type,
                question: activity.question,
                options: activity.options,
                isOpen: true
            });

            const updatedSession = await DbSession.getByCode(data.code);
            callback({ success: true, activity, session: updatedSession });
        } catch (error) {
            console.error('Error in prev-activity:', error);
            callback({ success: false, error: 'Failed to navigate' });
        }
    });

    // ─── SUBMIT POLL VOTE ───
    socket.on('submit-vote', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            const participant = await DbSession.getParticipantBySocket(session.id, socket.id);
            if (!participant) return;

            await DbSession.submitResponse(data.activityId, participant.id, { optionIndex: data.optionIndex });

            const results = await DbSession.getResults(data.activityId, 'poll');
            if (results) {
                io.to(data.code).emit('poll-results', results);
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
        }
    });

    socket.on('submit-answer', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            const participant = await DbSession.getParticipantBySocket(session.id, socket.id);
            if (!participant) return;

            const activity = session.activities.find(a => a.id === data.activityId);
            if (!activity) return;

            const isCorrect = data.optionIndex === activity.correct_answer;
            const timeLimit = 25; // Default for now
            const responseTimeMs = data.responseTimeMs || 25000;

            let score = 0;
            if (isCorrect) {
                const timeTaken = Math.min(responseTimeMs / 1000, timeLimit);
                const timeRemaining = Math.max(0, timeLimit - timeTaken);
                score = Math.round(1000 * (timeRemaining / timeLimit));
                score = Math.max(score, 50);
            }

            await DbSession.submitResponse(
                data.activityId,
                participant.id,
                { optionIndex: data.optionIndex, score, isCorrect },
                responseTimeMs
            );

            // Tell the individual
            socket.emit('quiz-feedback', {
                isCorrect,
                correctOption: activity.options[activity.correct_answer] || '',
                score
            });

            // Update results for presenter
            const results = await DbSession.getResults(data.activityId, 'quiz');
            if (results) {
                // Find presenter socket for this session - for now we broadcast to room
                // or we could filter in the frontend. To keep it simple, broadcast to room.
                io.to(data.code).emit('quiz-results', results);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    });

    // ─── SUBMIT WORD (Word Cloud) ───
    socket.on('submit-word', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            const participant = await DbSession.getParticipantBySocket(session.id, socket.id);
            if (!participant) return;

            await DbSession.submitResponse(data.activityId, participant.id, { word: data.word });

            const results = await DbSession.getResults(data.activityId, 'wordcloud');
            if (results) {
                io.to(data.code).emit('wordcloud-results', results);
            }
        } catch (error) {
            console.error('Error submitting word:', error);
        }
    });

    // ─── SUBMIT QUESTION (Q&A) ───
    socket.on('submit-question', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            const participant = await DbSession.getParticipantBySocket(session.id, socket.id);
            if (!participant) return;

            await DbSession.submitResponse(data.activityId, participant.id, {
                question: data.question,
                upvoteCount: 0
            });

            const results = await DbSession.getResults(data.activityId, 'qa');
            if (results) {
                io.to(data.code).emit('qa-results', results);
            }
        } catch (error) {
            console.error('Error submitting question:', error);
        }
    });

    // ─── UPVOTE QUESTION ───
    socket.on('upvote-question', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            // In our DB schema, upvotes are part of the response payload for Q&A questions
            // We need to find the response, update its upvoteCount
            const { data: response } = await insforge.database
                .from('responses')
                .select('*')
                .eq('id', data.questionId)
                .single();

            if (response) {
                const payload = response.payload;
                payload.upvoteCount = (payload.upvoteCount || 0) + 1;

                await insforge.database
                    .from('responses')
                    .update({ payload })
                    .eq('id', data.questionId);

                const results = await DbSession.getResults(data.activityId, 'qa');
                if (results) {
                    io.to(data.code).emit('qa-results', results);
                }
            }
        } catch (error) {
            console.error('Error upvoting question:', error);
        }
    });

    // ─── END SESSION ───
    socket.on('end-session', async (data, callback) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) {
                return callback({ success: false, error: 'Session not found' });
            }

            await DbSession.endSession(data.code);
            const overallLeaderboard = await DbSession.getOverallLeaderboard(session.id);

            socket.to(data.code).emit('session-ended', { message: 'Session has ended. Thank you!' });

            console.log(`✦ Session ${data.code} ended (DB).`);
            callback({ success: true, leaderboard: overallLeaderboard });
        } catch (error) {
            console.error('Error ending session:', error);
            callback({ success: false, error: 'Failed to end session' });
        }
    });

    // ─── SHOW LEADERBOARD ───
    socket.on('show-leaderboard', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            const leaderboard = await DbSession.getOverallLeaderboard(session.id);
            io.to(data.code).emit('leaderboard-reveal', { leaderboard });
        } catch (error) {
            console.error('Error showing leaderboard:', error);
        }
    });

    // ─── CLOSE ACTIVITY ───
    socket.on('close-activity', async (data) => {
        try {
            const session = await DbSession.getByCode(data.code);
            if (!session) return;

            const currentActivity = session.activities.find(a => a.is_open);
            if (currentActivity) {
                await insforge.database
                    .from('activities')
                    .update({ is_open: false })
                    .eq('id', currentActivity.id);

                socket.to(data.code).emit('activity-closed', { activityId: currentActivity.id });
            }
        } catch (error) {
            console.error('Error closing activity:', error);
        }
    });

    // ─── DISCONNECT ───
    socket.on('disconnect', async () => {
        console.log(`✦ User disconnected: ${socket.id}`);

        // Find participant in DB
        const { data: participant } = await insforge.database
            .from('participants')
            .select('*, sessions(code, id)')
            .eq('socket_id', socket.id)
            .maybeSingle();

        if (participant && participant.sessions) {
            const sessionCode = participant.sessions.code;
            const sessionId = participant.sessions.id;

            // Participant left
            // For now, we don't delete them from DB (persistence), but we could mark them as inactive
            const { data: participants } = await insforge.database
                .from('participants')
                .select('name, joined_at')
                .eq('session_id', sessionId);

            io.to(sessionCode).emit('participant-left', {
                participantCount: participants.length,
                participants: participants.map(p => ({ name: p.name, joinedAt: p.joined_at }))
            });
        }
    });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║     🚀  LivePoll Server Running!         ║
  ║                                          ║
  ║     Local:  http://localhost:${PORT}        ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
    `);
});
