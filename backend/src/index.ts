import { Hono } from 'hono';

interface Env {
    DB: D1Database;
    EXAM_ROOM: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>();

/**
 * REST ENDPOINTS
 */

// Create a new Exam Room
app.post('/api/exams', async (c) => {
    const { name, roomId } = await c.req.json();
    const id = roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    await c.env.DB.prepare('INSERT INTO Exams (id, name, status) VALUES (?, ?, ?)')
        .bind(id, name, 'pending').run();
    return c.json({ id, name, status: 'pending' });
});

// Admin adds questions
app.post('/api/exams/:id/questions', async (c) => {
    const examId = c.req.param('id');
    const questions = await c.req.json(); // Array of questions
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await c.env.DB.prepare(
            'INSERT INTO Questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(examId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, i + 1).run();
    }
    return c.json({ success: true });
});

// Admin fetches Leaderboard
app.get('/api/exams/:id/leaderboard', async (c) => {
    const examId = c.req.param('id');
    const { results } = await c.env.DB.prepare(`
    SELECT name, email, total_score, status 
    FROM Participants 
    WHERE exam_id = ? 
    ORDER BY total_score DESC
  `).bind(examId).all();
    return c.json(results);
});

// WebSocket entrypoint routes through Durable Object
app.get('/api/exams/:id/ws', async (c) => {
    const id = c.req.param('id');
    const upgradeHeader = c.req.header('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
    }
    const idObj = c.env.EXAM_ROOM.idFromName(id);
    const stub = c.env.EXAM_ROOM.get(idObj);
    // Forward request to Durable Object
    return stub.fetch(c.req.raw);
});

export default app;

/**
 * DURABLE OBJECT: EXAM ROOM
 * Manages WebSocket connections, timers, and game logic
 */
export class ExamRoom {
    state: DurableObjectState;
    env: Env;
    sessions: Map<WebSocket, { id: string; role: 'student' | 'admin'; lastHeartbeat: number }> = new Map();

    examId: string | null = null;
    status: 'pending' | 'active' | 'transition' | 'completed' = 'pending';
    questions: any[] = [];
    currentQuestionIndex: number = -1;
    timerInterval: any = null;
    timeLeft: number = 0;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
    }

    async fetch(request: Request) {
        const url = new URL(request.url);
        const [, , , examId,] = url.pathname.split('/');
        this.examId = examId;

        if (request.headers.get('Upgrade') === 'websocket') {
            const pair = new WebSocketPair();
            const [client, server] = Object.values(pair);

            const role = url.searchParams.get('role') || 'student';
            const participantId = url.searchParams.get('participantId') || '';

            await this.handleSession(server, role, participantId);

            return new Response(null, { status: 101, webSocket: client });
        }
        return new Response('Not found', { status: 404 });
    }

    async handleSession(ws: WebSocket, role: string, participantId: string) {
        ws.accept();
        this.sessions.set(ws, { id: participantId, role: role as 'student' | 'admin', lastHeartbeat: Date.now() });

        ws.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data as string);

                switch (data.type) {
                    case 'HEARTBEAT':
                        const session = this.sessions.get(ws);
                        if (session) {
                            session.lastHeartbeat = Date.now();
                        }
                        break;

                    case 'JOIN':
                        // Verify student in DB
                        this.broadcastToAdmin({ type: 'PARTICIPANT_JOINED', participantId });
                        break;

                    case 'START_EXAM':
                        if (role === 'admin') await this.startExam();
                        break;

                    case 'SUBMIT_ANSWER':
                        if (role === 'student') await this.handleAnswer(participantId, data.answer, data.timeTaken);
                        break;

                    case 'CHEAT_DETECTED':
                        if (role === 'student') await this.disqualifyParticipant(participantId, data.reason);
                        break;
                }
            } catch (err) { }
        });

        ws.addEventListener('close', () => {
            this.sessions.delete(ws);
        });
    }

    async startExam() {
        // Load questions from DB
        const { results } = await this.env.DB.prepare('SELECT * FROM Questions WHERE exam_id = ? ORDER BY order_index ASC').bind(this.examId).all();
        this.questions = results;
        this.status = 'active';
        this.currentQuestionIndex = 0;

        // Start Heartbeat Monitor
        if (!this.timerInterval) {
            this.timerInterval = setInterval(() => this.checkHeartbeatsAndTimer(), 1000);
        }

        this.startQuestion();
    }

    startQuestion() {
        this.status = 'active';
        this.timeLeft = 25; // 25 seconds server authoritative timer
        const q = this.questions[this.currentQuestionIndex];

        // Broadcast question to students without correct_option
        const qPayload = {
            id: q.id,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            time: 25
        };

        this.broadcast({ type: 'NEW_QUESTION', question: qPayload });
    }

    async handleAnswer(participantId: string, answer: string, timeTaken: number) {
        if (this.status !== 'active') return;
        const q = this.questions[this.currentQuestionIndex];
        const isCorrect = q.correct_option === answer;

        // speed based scoring
        let score = 0;
        if (isCorrect && timeTaken <= 25) {
            score = Math.round(1000 * (1 - (timeTaken / 25)));
        }

        await this.env.DB.prepare('INSERT INTO Scores (participant_id, question_id, time_taken, score, is_correct) VALUES (?, ?, ?, ?, ?)')
            .bind(participantId, q.id, timeTaken, score, isCorrect ? 1 : 0).run();

        // Update participant total score
        await this.env.DB.prepare('UPDATE Participants SET total_score = total_score + ? WHERE id = ?')
            .bind(score, participantId).run();

        // Send single localized response
        for (const [ws, session] of this.sessions.entries()) {
            if (session.id === participantId) {
                ws.send(JSON.stringify({ type: 'ANSWER_FEEDBACK', isCorrect })); // Do not reveal correct option
            }
        }
    }

    async disqualifyParticipant(participantId: string, reason: string) {
        await this.env.DB.prepare("UPDATE Participants SET status = 'disqualified' WHERE id = ?").bind(participantId).run();
        await this.env.DB.prepare("INSERT INTO Disqualifications (participant_id, reason) VALUES (?, ?)").bind(participantId, reason).run();

        for (const [ws, session] of this.sessions.entries()) {
            if (session.id === participantId) {
                ws.send(JSON.stringify({ type: 'DISQUALIFIED', reason }));
                ws.close();
                this.sessions.delete(ws);
            }
        }
        this.broadcastToAdmin({ type: 'PARTICIPANT_DISQUALIFIED', participantId, reason });
    }

    async checkHeartbeatsAndTimer() {
        // 1. Kick missing heartbeats
        const now = Date.now();
        for (const [ws, session] of this.sessions.entries()) {
            if (session.role === 'student' && now - session.lastHeartbeat > 3000) {
                await this.disqualifyParticipant(session.id, 'heartbeat_timeout');
            }
        }

        // 2. Manage Timer
        if (this.status === 'active') {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.status = 'transition';
                this.timeLeft = 5;
                this.broadcast({ type: 'TRANSITION_START' });
            }
        } else if (this.status === 'transition') {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= this.questions.length) {
                    this.status = 'completed';
                    this.broadcast({ type: 'EXAM_COMPLETED' });
                    if (this.timerInterval) {
                        clearInterval(this.timerInterval);
                        this.timerInterval = null;
                    }
                } else {
                    this.startQuestion();
                }
            }
        }
    }

    broadcast(msg: any) {
        const str = JSON.stringify(msg);
        for (const ws of this.sessions.keys()) {
            ws.send(str);
        }
    }

    broadcastToAdmin(msg: any) {
        const str = JSON.stringify(msg);
        for (const [ws, session] of this.sessions.entries()) {
            if (session.role === 'admin') {
                ws.send(str);
            }
        }
    }
}
