const { insforge } = require('../utils/insforge');
const { generateCode } = require('../utils/codeGenerator');

class DbSession {
    static async create(name) {
        // 1. Get existing codes to ensure uniqueness
        const { data: existingCodes } = await insforge.database
            .from('sessions')
            .select('code');

        const code = generateCode(new Set((existingCodes || []).map(s => s.code)));

        // 2. Create the session
        const { data, error } = await insforge.database
            .from('sessions')
            .insert([{ name: name || 'Untitled Session', code }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
 
    static async getByCode(code) {
        const { data, error } = await insforge.database
            .from('sessions')
            .select('*, activities(*)')
            .eq('code', code)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
        return data;
    }

    static async addParticipant(sessionId, name, socketId) {
        const { data, error } = await insforge.database
            .from('participants')
            .insert([{
                session_id: sessionId,
                name: name || 'Anonymous',
                socket_id: socketId
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async addActivity(sessionId, activity) {
        // Get current max index
        const { data: maxIdx } = await insforge.database
            .from('activities')
            .select('index')
            .eq('session_id', sessionId)
            .order('index', { ascending: false })
            .limit(1)
            .maybeSingle();

        const index = maxIdx ? maxIdx.index + 1 : 0;

        const { data, error } = await insforge.database
            .from('activities')
            .insert([{
                session_id: sessionId,
                type: activity.type,
                question: activity.question,
                options: activity.options || [],
                correct_answer: activity.correctAnswer ?? null,
                index
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async launchActivity(activityId) {
        // Set all other activities in this session to closed (is_open = false)
        const { data: activity } = await insforge.database
            .from('activities')
            .select('session_id')
            .eq('id', activityId)
            .single();

        if (activity) {
            await insforge.database
                .from('activities')
                .update({ is_open: false })
                .eq('session_id', activity.session_id);
        }

        // Open the target activity
        const { data, error } = await insforge.database
            .from('activities')
            .update({ is_open: true })
            .eq('id', activityId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getParticipantBySocket(sessionId, socketId) {
        const { data, error } = await insforge.database
            .from('participants')
            .select('*')
            .eq('session_id', sessionId)
            .eq('socket_id', socketId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    static async submitResponse(activityId, participantId, payload, responseTimeMs = null) {
        const { data, error } = await insforge.database
            .from('responses')
            .insert([{
                activity_id: activityId,
                participant_id: participantId,
                payload,
                response_time_ms: responseTimeMs
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async endSession(code) {
        const { data, error } = await insforge.database
            .from('sessions')
            .update({ is_active: false, ended_at: new Date() })
            .eq('code', code)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getResults(activityId, type) {
        const { data: activity, error: actErr } = await insforge.database
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .single();

        if (actErr) throw actErr;

        const { data: responses, error: respErr } = await insforge.database
            .from('responses')
            .select('*, participants(name)')
            .eq('activity_id', activityId);

        if (respErr) throw respErr;

        //Logic to aggregate results based on type
        if (type === 'poll') {
            const results = activity.options.map((opt, i) => {
                const voters = responses.filter(r => r.payload.optionIndex === i);
                return {
                    option: opt,
                    votes: voters.length,
                    voterNames: voters.map(v => v.participants.name)
                };
            });
            return { activityId, type, question: activity.question, results, totalVotes: responses.length };
        }

        if (type === 'quiz') {
            const results = activity.options.map((opt, i) => ({
                option: opt,
                count: responses.filter(r => r.payload.optionIndex === i).length,
                isCorrect: i === activity.correct_answer
            }));

            const leaderboard = responses.map(r => {
                const isCorrect = r.payload.optionIndex === activity.correct_answer;
                return {
                    name: r.participants.name,
                    isCorrect,
                    score: r.payload.score || 0,
                    responseTime: r.response_time_ms ? (r.response_time_ms / 1000).toFixed(1) + 's' : '?',
                    answeredOption: activity.options[r.payload.optionIndex] || '?',
                    correctOption: activity.options[activity.correct_answer] || '?',
                    answeredAt: r.created_at
                };
            }).sort((a, b) => b.score - a.score);

            return {
                activityId, type, question: activity.question,
                results, totalAnswers: responses.length,
                correctCount: responses.filter(r => r.payload.optionIndex === activity.correct_answer).length,
                correctAnswer: activity.correct_answer,
                correctOption: activity.options[activity.correct_answer] || '?',
                leaderboard
            };
        }

        if (type === 'wordcloud') {
            const wordMap = {};
            responses.forEach(r => {
                const word = (r.payload.word || '').trim().toLowerCase();
                if (word) wordMap[word] = (wordMap[word] || 0) + 1;
            });
            const words = Object.entries(wordMap).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
            return { activityId, type, question: activity.question, words, totalSubmissions: responses.length };
        }

        if (type === 'qa') {
            const questions = responses.map(r => ({
                id: r.id,
                text: r.payload.question,
                participantName: r.participants.name,
                upvoteCount: r.payload.upvoteCount || 0,
                time: r.created_at
            })).sort((a, b) => b.upvoteCount - a.upvoteCount);
            return { activityId, type, question: activity.question, questions, totalQuestions: responses.length };
        }

        return null;
    }

    static async getOverallLeaderboard(sessionId) {
        // Collect all quiz activities for this session
        const { data: activities, error: actErr } = await insforge.database
            .from('activities')
            .select('id, correct_answer')
            .eq('session_id', sessionId)
            .eq('type', 'quiz');

        if (actErr) throw actErr;
        if (!activities.length) return [];

        const activityIds = activities.map(a => a.id);

        // Collect all responses for these activities
        const { data: responses, error: respErr } = await insforge.database
            .from('responses')
            .select('*, participants(name)')
            .in('activity_id', activityIds);

        if (respErr) throw respErr;

        const scoreMap = {};
        responses.forEach(r => {
            const name = r.participants.name;
            const activity = activities.find(a => a.id === r.activity_id);
            const isCorrect = r.payload.optionIndex === activity.correct_answer;
            const score = r.payload.score || 0;

            if (!scoreMap[name]) {
                scoreMap[name] = { correct: 0, total: 0, totalScore: 0 };
            }
            scoreMap[name].total++;
            scoreMap[name].totalScore += score;
            if (isCorrect) scoreMap[name].correct++;
        });

        const leaderboard = Object.entries(scoreMap).map(([name, data]) => ({
            name,
            correct: data.correct,
            total: data.total,
            totalScore: data.totalScore,
            accuracy: data.total > 0 ? Math.round(data.correct / data.total * 100) : 0
        }));

        leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.correct - a.correct);
        return leaderboard;
    }
}

module.exports = { DbSession };
