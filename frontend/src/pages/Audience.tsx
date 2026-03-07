import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../lib/socket';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';
import { motion, AnimatePresence } from 'framer-motion';

export const AudiencePage: React.FC = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Default to 'Guest' if state name isn't provided (e.g. direct link)
    const initialName = location.state?.name || 'Guest';

    const [sessionName, setSessionName] = useState('');

    // States: waiting, activity, submitted, feedback, ended
    const [viewState, setViewState] = useState<'waiting' | 'activity' | 'submitted' | 'feedback' | 'ended'>('waiting');
    const [activity, setActivity] = useState<any>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Activity Inputs
    const [wordInput, setWordInput] = useState('');
    const [qaInput, setQaInput] = useState('');
    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        if (!code) {
            navigate('/');
            return;
        }

        socket.emit('join-session', { code, name: initialName }, (res: any) => {
            if (!res.success) {
                alert(res.error || 'Failed to join session');
                navigate('/');
                return;
            }
            setSessionName(res.sessionName);
            if (res.currentActivity) {
                setActivity(res.currentActivity);
                setViewState('activity');
                if (res.currentActivity.type === 'quiz' && res.currentActivity.timeLimit) {
                    setTimeLeft(res.currentActivity.timeLimit);
                }
            }
        });

        const handleLaunch = (act: any) => {
            setActivity(act);
            setViewState('activity');
            if (act.type === 'quiz' && act.timeLimit) {
                setTimeLeft(act.timeLimit);
            }
        };

        const handleClose = () => setViewState('waiting');

        const handleFeedback = (data: any) => {
            setFeedback(data);
            setViewState('feedback');
        };

        const handleEnded = () => setViewState('ended');

        const handleLeaderboard = (data: any) => {
            setLeaderboard(data.leaderboard);
        };

        const handleQA = (data: any) => {
            setQuestions(data.questions);
        };

        socket.on('activity-launched', handleLaunch);
        socket.on('activity-closed', handleClose);
        socket.on('quiz-feedback', handleFeedback);
        socket.on('session-ended', handleEnded);
        socket.on('leaderboard-reveal', handleLeaderboard);
        socket.on('qa-results', handleQA);
        socket.on('presenter-disconnected', () => alert('The presenter has disconnected'));

        return () => {
            socket.off('activity-launched', handleLaunch);
            socket.off('activity-closed', handleClose);
            socket.off('quiz-feedback', handleFeedback);
            socket.off('session-ended', handleEnded);
            socket.off('leaderboard-reveal', handleLeaderboard);
            socket.off('qa-results', handleQA);
        };
    }, [code, initialName, navigate]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && viewState === 'activity') {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && viewState === 'activity') {
            setViewState('submitted');
        }
    }, [timeLeft, viewState]);

    const submitVote = (optionIndex: number) => {
        socket.emit('submit-vote', { code, activityId: activity.id, optionIndex });
        setViewState('submitted');
    };

    const submitAnswer = (optionIndex: number) => {
        socket.emit('submit-answer', {
            code,
            activityId: activity.id,
            optionIndex,
            responseTimeMs: 25000 - (timeLeft || 0) * 1000
        });
        setViewState('submitted');
    };

    const submitWord = () => {
        if (!wordInput.trim()) return;
        socket.emit('submit-word', { code, activityId: activity.id, word: wordInput });
        setWordInput('');
        setViewState('submitted');
    };

    const submitQuestion = () => {
        if (!qaInput.trim()) return;
        socket.emit('submit-question', { code, activityId: activity.id, question: qaInput });
        setQaInput('');
        alert('Question submitted!');
    };

    const upvoteQuestion = (qId: string) => {
        socket.emit('upvote-question', { code, activityId: activity.id, questionId: qId });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 left-4 font-bold text-clay-purple text-2xl flex items-center gap-2 tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-clay-purple text-white flex items-center justify-center shadow-clay-light text-sm">iX</span>
                incuXai
            </div>
            {sessionName && <div className="absolute top-6 right-6 text-sm font-semibold text-text-dark/40">{sessionName}</div>}

            <AnimatePresence mode="wait">
                {viewState === 'waiting' && (
                    <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ClayCard className="max-w-md w-full text-center p-12">
                            <span className="text-6xl mb-6 block animate-bounce">⏳</span>
                            <h2 className="text-2xl font-bold mb-2">Waiting for the presenter</h2>
                            <p className="text-text-dark/60">The next activity will appear here automatically.</p>
                        </ClayCard>
                    </motion.div>
                )}

                {viewState === 'activity' && activity && (
                    <motion.div key="activity" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl">
                        <ClayCard className="p-8">
                            <h2 className="text-3xl font-bold mb-8 text-center">{activity.question}</h2>

                            {timeLeft !== null && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm font-bold text-text-dark/60 mb-2">
                                        <span>Time Remaining</span>
                                        <span className={timeLeft <= 5 ? 'text-red-500' : ''}>{timeLeft}s</span>
                                    </div>
                                    <div className="h-2 w-full bg-clay-blue/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-clay-blue transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 25) * 100}%` }} />
                                    </div>
                                </div>
                            )}

                            {(activity.type === 'poll' || activity.type === 'quiz') && (
                                <div className="flex flex-col gap-4">
                                    {activity.options.map((opt: string, i: number) => (
                                        <ClayButton
                                            key={i}
                                            variant="secondary"
                                            className="text-left px-6 py-4 text-lg hover:bg-clay-blue hover:text-white transition-colors border-2 border-transparent hover:border-clay-blue/30"
                                            onClick={() => activity.type === 'poll' ? submitVote(i) : submitAnswer(i)}
                                        >
                                            {String.fromCharCode(65 + i)}. {opt}
                                        </ClayButton>
                                    ))}
                                </div>
                            )}

                            {activity.type === 'wordcloud' && (
                                <div className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        value={wordInput}
                                        onChange={e => setWordInput(e.target.value)}
                                        className="clay-input text-lg py-4 text-center"
                                        placeholder="Enter a word or phrase..."
                                    />
                                    <ClayButton variant="primary" className="py-4 text-lg" onClick={submitWord}>Submit Word</ClayButton>
                                </div>
                            )}

                            {activity.type === 'qa' && (
                                <div>
                                    <textarea
                                        value={qaInput}
                                        onChange={e => setQaInput(e.target.value)}
                                        className="clay-input resize-none h-32 mb-4"
                                        placeholder="Ask a question..."
                                    />
                                    <ClayButton variant="primary" className="py-3 w-full mb-8" onClick={submitQuestion}>Ask Question</ClayButton>

                                    <div className="space-y-4">
                                        {questions.map((q: any) => (
                                            <div key={q.id} className="flex gap-4 p-4 rounded-2xl bg-white shadow-clay-inner">
                                                <button onClick={() => upvoteQuestion(q.id)} className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-clay-pink/20 text-clay-pink transition-colors">
                                                    ▲ <span className="font-bold">{q.upvoteCount}</span>
                                                </button>
                                                <div>
                                                    <p className="font-medium text-lg">{q.text}</p>
                                                    <p className="text-xs text-text-dark/40 font-bold uppercase tracking-widest mt-1">by {q.participantName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ClayCard>
                    </motion.div>
                )}

                {viewState === 'submitted' && (
                    <motion.div key="submitted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ClayCard className="max-w-md w-full text-center p-12 bg-clay-mint/10 border-clay-mint/30">
                            <span className="text-6xl mb-6 block text-clay-mint">✔</span>
                            <h2 className="text-2xl font-bold mb-2">Response Submitted!</h2>
                            <p className="text-text-dark/60">Waiting for the next activity...</p>
                        </ClayCard>
                    </motion.div>
                )}

                {viewState === 'feedback' && feedback && (
                    <motion.div key="feedback" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <ClayCard className={`max-w-md w-full text-center p-12 ${feedback.isCorrect ? 'bg-clay-mint/20' : 'bg-red-500/10'}`}>
                            <span className="text-6xl mb-6 block">
                                {feedback.isCorrect ? '🎉' : '❌'}
                            </span>
                            <h2 className="text-3xl font-bold mb-4">{feedback.isCorrect ? '+' + feedback.score + ' pts!' : 'Incorrect'}</h2>
                            <p className="text-lg">The correct answer was:</p>
                            <p className="text-2xl font-bold mt-2 text-clay-mint mb-8">{feedback.correctOption}</p>
                            <p className="text-sm text-text-dark/60 font-semibold uppercase tracking-wider">Waiting to continue</p>
                        </ClayCard>
                    </motion.div>
                )}

                {viewState === 'ended' && (
                    <motion.div key="ended" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
                        <ClayCard className="text-center p-10">
                            <span className="text-6xl mb-6 block">🎊</span>
                            <h2 className="text-3xl font-bold mb-4">Session Complete</h2>
                            <p className="text-text-dark/60 mb-8">Thank you for participating!</p>

                            {leaderboard && leaderboard.length > 0 && (
                                <div className="text-left space-y-3 mb-8">
                                    <h3 className="font-bold text-xl mb-4">Final Leaderboard</h3>
                                    {leaderboard.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-clay-inner">
                                            <div className="flex items-center gap-4">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-clay-purple'}`}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-bold">{p.name}</span>
                                            </div>
                                            <span className="font-bold text-clay-purple">{p.totalScore} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <ClayButton variant="primary" className="py-3 px-8" onClick={() => navigate('/')}>Back to Home</ClayButton>
                        </ClayCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
