import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AiOutlineDashboard,
    AiOutlineTeam,
    AiOutlineBarChart,
    AiOutlinePlus,
    AiOutlineBell,
    AiOutlineSetting,
    AiOutlineCopy,
    AiOutlineClose
} from 'react-icons/ai';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';
import { socket } from '../lib/socket';

export const DashboardPage: React.FC = () => {
    // Top Level State
    const [view, setView] = useState<'overview' | 'presenter'>('overview');

    // Presenter State
    const [sessionCode, setSessionCode] = useState('');
    const [sessionName, setSessionName] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [currentActivityIndex, setCurrentActivityIndex] = useState(-1);

    // Create Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    // Activity Form
    const [activityType, setActivityType] = useState('poll');
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2']);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);

    // Results
    const [resultsData, setResultsData] = useState<any>(null);

    useEffect(() => {
        socket.on('participant-joined', (data) => {
            if (data.participants) setParticipants(data.participants);
        });

        socket.on('participant-left', (data) => {
            if (data.participants) setParticipants(data.participants);
        });

        socket.on('poll-results', (data) => {
            setResultsData(data);
            updateActivityCount(data.activityId, data.totalVotes);
        });

        socket.on('quiz-results', (data) => {
            setResultsData(data);
            updateActivityCount(data.activityId, data.totalAnswers);
        });

        socket.on('wordcloud-results', (data) => {
            setResultsData(data);
            updateActivityCount(data.activityId, data.totalSubmissions);
        });

        socket.on('qa-results', (data) => {
            setResultsData(data);
            updateActivityCount(data.activityId, data.totalQuestions);
        });

        return () => {
            socket.off('participant-joined');
            socket.off('participant-left');
            socket.off('poll-results');
            socket.off('quiz-results');
            socket.off('wordcloud-results');
            socket.off('qa-results');
        };
    }, []);

    const updateActivityCount = (id: string, count: number) => {
        setActivities(prev => prev.map(a => a.id === id ? { ...a, responseCount: count } : a));
    };

    const handleCreateSession = () => {
        if (!newSessionName.trim()) return;
        socket.emit('create-session', { name: newSessionName }, (res: any) => {
            if (res.success) {
                setSessionCode(res.session.code);
                setSessionName(res.session.name);
                setIsCreateModalOpen(false);
                setNewSessionName('');
                setView('presenter');
            } else {
                alert('Failed to create session');
            }
        });
    };

    const handleAddActivity = () => {
        if (!question.trim()) return;
        const data: any = { code: sessionCode, type: activityType, question };
        if (activityType === 'poll' || activityType === 'quiz') {
            data.options = options;
            if (activityType === 'quiz') data.correctAnswer = correctAnswerIndex;
        }

        socket.emit('add-activity', data, (res: any) => {
            if (res.success) {
                setActivities(res.session.activities);
                setQuestion('');
                setOptions(['Option 1', 'Option 2']);
                setCorrectAnswerIndex(0);
            } else {
                alert(res.error);
            }
        });
    };

    const launchActivity = (index: number) => {
        socket.emit('launch-activity', { code: sessionCode, index }, (res: any) => {
            if (res.success) {
                setCurrentActivityIndex(index);
                setResultsData({ ...res.activity, results: res.activity.options?.map((o: string) => ({ option: o, votes: 0, count: 0 })), totalVotes: 0, totalAnswers: 0, words: [], questions: [] });
            }
        });
    };

    const nextActivity = () => {
        socket.emit('next-activity', { code: sessionCode }, (res: any) => {
            if (res.success) {
                setCurrentActivityIndex(prev => prev + 1);
                setResultsData(null); // Wait for results
                setActivities(res.session.activities);
            }
        });
    };

    const prevActivity = () => {
        socket.emit('prev-activity', { code: sessionCode }, (res: any) => {
            if (res.success) {
                setCurrentActivityIndex(prev => prev - 1);
                setResultsData(null);
                setActivities(res.session.activities);
            }
        });
    };

    const endSession = () => {
        if (confirm("Are you sure you want to end this session?")) {
            socket.emit('end-session', { code: sessionCode }, (res: any) => {
                if (res) {
                    alert("Session ended successfully. Leaderboard available.");
                    setView('overview');
                }
            });
        }
    };

    return (
        <div className="flex min-h-screen bg-background p-4 md:p-8 gap-8">
            <aside className="hidden lg:flex flex-col w-72 clay-card h-[calc(100vh-4rem)] sticky top-8 p-8">
                <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => setView('overview')}>
                    <div className="w-10 h-10 bg-clay-purple rounded-xl shadow-clay-light flex items-center justify-center text-white font-bold">iX</div>
                    <span className="text-xl font-bold tracking-tight">incuXai</span>
                </div>

                <nav className="flex-1 space-y-4">
                    <SidebarLink icon={<AiOutlineDashboard />} label="Overview" active={view === 'overview'} onClick={() => setView('overview')} />
                    {view === 'presenter' && <SidebarLink icon={<AiOutlineBarChart />} label="Live Presenter" active={true} />}
                    <SidebarLink icon={<AiOutlineTeam />} label="Past Sessions" />
                    <SidebarLink icon={<AiOutlineSetting />} label="Settings" />
                </nav>

                <ClayButton variant="purple" className="mt-auto w-full flex items-center justify-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
                    <AiOutlinePlus /> New Session
                </ClayButton>
            </aside>

            <main className="flex-1 space-y-8 overflow-y-auto">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-dark">
                            {view === 'overview' ? 'Dashboard Overview' : sessionName}
                        </h1>
                        <p className="text-text-dark/40">
                            {view === 'overview' ? 'Welcome back, Presenter!' : 'Live Session Active'}
                        </p>
                    </div>
                    {view === 'presenter' && (
                        <div className="flex items-center gap-6">
                            <div className="bg-clay-blue text-white px-6 py-2 rounded-2xl shadow-clay-light font-mono text-2xl tracking-widest cursor-pointer flex items-center gap-3" onClick={() => navigator.clipboard.writeText(sessionCode)}>
                                {sessionCode}
                                <AiOutlineCopy className="text-lg opacity-70 hover:opacity-100" />
                            </div>
                            <div className="flex items-center gap-2 text-clay-pink font-bold text-xl">
                                <AiOutlineTeam /> {participants.length}
                            </div>
                            <div className="w-12 h-12 clay-card flex items-center justify-center text-xl cursor-pointer hover:shadow-clay-medium transition-shadow">
                                <AiOutlineBell />
                            </div>
                        </div>
                    )}
                </header>

                {view === 'overview' ? (
                    <OverviewStats openCreate={() => setIsCreateModalOpen(true)} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT: Activity Builder */}
                        <div className="lg:col-span-1 space-y-6">
                            <ClayCard className="p-6">
                                <h3 className="font-bold mb-4">Add Activity</h3>
                                <div className="flex gap-2 mb-4">
                                    {['poll', 'quiz', 'wordcloud', 'qa'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setActivityType(t)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${activityType === t ? 'bg-clay-blue text-white shadow-clay-inner' : 'bg-background text-text-dark/50 hover:bg-white'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    className="clay-input w-full mb-4"
                                    placeholder="Your Question..."
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                />
                                {(activityType === 'poll' || activityType === 'quiz') && (
                                    <div className="space-y-3 mb-6">
                                        {options.map((opt, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input
                                                    className="clay-input flex-1 py-2 text-sm"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...options];
                                                        newOpts[i] = e.target.value;
                                                        setOptions(newOpts);
                                                    }}
                                                />
                                                {activityType === 'quiz' && (
                                                    <button
                                                        onClick={() => setCorrectAnswerIndex(i)}
                                                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ${correctAnswerIndex === i ? 'bg-clay-mint text-white' : 'bg-gray-200 text-gray-400'}`}
                                                    >
                                                        ✓
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => setOptions([...options, `Option ${options.length + 1}`])} className="text-sm font-bold text-clay-blue hover:underline">
                                            + Add Option
                                        </button>
                                    </div>
                                )}
                                <ClayButton className="w-full py-3" onClick={handleAddActivity}>Add Activity</ClayButton>
                            </ClayCard>

                            <ClayCard className="p-4 bg-clay-purple/5">
                                <h3 className="font-bold mb-4 flex justify-between">
                                    Activities <span className="text-sm text-text-dark/40">{activities.length}</span>
                                </h3>
                                <div className="space-y-3">
                                    {activities.map((act, i) => (
                                        <div
                                            key={i}
                                            onClick={() => launchActivity(i)}
                                            className={`p-4 rounded-xl cursor-pointer transition-all border-2 flex items-center justify-between ${currentActivityIndex === i ? 'bg-white border-clay-blue shadow-clay-medium scale-105 z-10' : 'bg-white/50 border-transparent hover:bg-white'}`}
                                        >
                                            <div className="truncate flex-1">
                                                <span className="text-xs font-bold uppercase tracking-widest text-clay-purple mr-2">{act.type}</span>
                                                <p className="font-semibold text-sm truncate">{act.question}</p>
                                            </div>
                                            <div className="text-xs font-bold text-text-dark/40 bg-background px-2 py-1 rounded-md">
                                                {act.responseCount || 0}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ClayCard>
                        </div>

                        {/* RIGHT: Live Results Area */}
                        <div className="lg:col-span-2">
                            <ClayCard className="h-[600px] p-8 flex flex-col relative w-full">
                                {resultsData ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="text-center mb-10">
                                            <h2 className="text-2xl font-bold">{resultsData.question}</h2>
                                            <p className="text-sm text-text-dark/50 mt-2 font-bold uppercase tracking-wider">
                                                {resultsData.totalVotes || resultsData.totalAnswers || resultsData.totalSubmissions || resultsData.totalQuestions || 0} Responses
                                            </p>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-end gap-6 relative px-8">
                                            {(resultsData.type === 'poll' || resultsData.type === 'quiz') && resultsData.results?.map((r: any, i: number) => {
                                                const maxVal = Math.max(...resultsData.results.map((x: any) => x.votes || x.count || 0), 1);
                                                const val = r.votes || r.count || 0;
                                                const pct = (val / maxVal) * 100;
                                                return (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <div className="flex justify-between text-sm font-bold">
                                                            <span>{r.option} {r.isCorrect ? '✅' : ''}</span>
                                                            <span>{val}</span>
                                                        </div>
                                                        <div className="h-8 bg-clay-blue/10 rounded-xl overflow-hidden shadow-clay-inner">
                                                            <div className={`h-full transition-all duration-1000 ease-out ${r.isCorrect === false ? 'bg-red-400' : 'bg-clay-blue'}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {resultsData.type === 'wordcloud' && (
                                                <div className="flex flex-wrap items-center justify-center gap-4 p-8">
                                                    {resultsData.words?.map((w: any, i: number) => (
                                                        <span key={i} style={{ fontSize: `${1 + w.count * 0.5}rem` }} className="font-bold text-clay-purple transition-all">
                                                            {w.text}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {resultsData.type === 'qa' && (
                                                <div className="space-y-4 overflow-y-auto max-h-[400px]">
                                                    {resultsData.questions?.map((q: any) => (
                                                        <div key={q.id} className="p-4 bg-background rounded-xl flex gap-4 items-center">
                                                            <div className="text-clay-pink font-bold">▲ {q.upvoteCount}</div>
                                                            <div>
                                                                <p className="font-semibold">{q.text}</p>
                                                                <p className="text-xs text-text-dark/50 mt-1">by {q.participantName}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Presenter Controls */}
                                        <div className="flex justify-between items-center mt-12 pt-6 border-t-2 border-clay-blue/10">
                                            <ClayButton variant="secondary" onClick={prevActivity} disabled={currentActivityIndex <= 0}>Previous</ClayButton>
                                            <ClayButton variant="secondary" onClick={nextActivity} disabled={currentActivityIndex >= activities.length - 1}>Next</ClayButton>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-text-dark/30 flex-col gap-4">
                                        <AiOutlineDashboard className="text-6xl" />
                                        <p className="text-xl font-bold">Select an activity to launch</p>
                                    </div>
                                )}
                            </ClayCard>
                        </div>
                    </div>
                )}
            </main>

            {/* Create Session Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-text-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <ClayCard className="w-full max-w-md p-8 relative">
                                <button className="absolute top-4 right-4 text-2xl text-text-dark/40 hover:text-clay-pink transition-colors" onClick={() => setIsCreateModalOpen(false)}>
                                    <AiOutlineClose />
                                </button>
                                <h2 className="text-2xl font-bold mb-6">Create New Session</h2>
                                <input
                                    type="text"
                                    className="clay-input w-full mb-6"
                                    placeholder="Session Name (e.g. Marketing Q1)"
                                    value={newSessionName}
                                    onChange={e => setNewSessionName(e.target.value)}
                                    // eslint-disable-next-line
                                    onKeyDown={e => e.key === 'Enter' && handleCreateSession()}
                                    autoFocus
                                />
                                <ClayButton className="w-full py-4 text-lg" onClick={handleCreateSession}>Launch Session</ClayButton>
                            </ClayCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* End Session Float */}
            {view === 'presenter' && (
                <ClayButton variant="secondary" className="fixed bottom-8 right-8 shadow-clay-medium bg-red-100 text-red-600 hover:bg-red-500 hover:text-white" onClick={endSession}>
                    End Session
                </ClayButton>
            )}
        </div>
    );
};

const SidebarLink = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <div onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-clay-blue text-white shadow-clay-medium' : 'text-text-dark/60 hover:bg-white hover:text-text-dark'}`}>
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold">{label}</span>
    </div>
);

const OverviewStats = ({ openCreate }: { openCreate: () => void }) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Active Sessions', value: '1', icon: <AiOutlineDashboard />, color: 'bg-clay-blue' },
                    { label: 'Total Participants', value: '1,284', icon: <AiOutlineTeam />, color: 'bg-clay-pink' },
                    { label: 'Avg. Engagement', value: '84%', icon: <AiOutlineBarChart />, color: 'bg-clay-mint' },
                ].map((stat, i) => (
                    <ClayCard key={i} className="flex items-center gap-6 group hover:shadow-clay-medium transition-shadow">
                        <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-clay-light group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-dark/40">{stat.label}</p>
                            <p className="text-2xl font-bold text-text-dark">{stat.value}</p>
                        </div>
                    </ClayCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ClayCard className="flex flex-col">
                    <h3 className="text-xl font-bold mb-6">Recent Sessions</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white hover:bg-white transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-clay-mint rounded-lg flex items-center justify-center text-text-dark/60 shadow-clay-inner font-bold">
                                        IX
                                    </div>
                                    <div>
                                        <p className="font-semibold">Sprint Planning #0{42 + i}</p>
                                        <p className="text-xs text-text-dark/40">March 07, 2026 • 24 participants</p>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-clay-blue opacity-0 group-hover:opacity-100 transition-opacity">Full Report</div>
                            </div>
                        ))}
                    </div>
                </ClayCard>

                <ClayCard className="bg-clay-blue/10 border-clay-blue/20">
                    <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={openCreate} className="p-6 rounded-3xl bg-clay-blue bg-opacity-20 border border-white flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-clay-medium transition-all group">
                            <div className="w-12 h-12 bg-clay-blue rounded-xl flex items-center justify-center text-white shadow-clay-light group-hover:scale-110 transition-transform">
                                <AiOutlinePlus />
                            </div>
                            <p className="font-bold text-sm text-center">New Session</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-clay-pink bg-opacity-20 border border-white flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-clay-medium transition-all group">
                            <div className="w-12 h-12 bg-clay-pink rounded-xl flex items-center justify-center text-white shadow-clay-light group-hover:scale-110 transition-transform">
                                <AiOutlineBarChart />
                            </div>
                            <p className="font-bold text-sm text-center">View Reports</p>
                        </div>
                    </div>
                </ClayCard>
            </div>
        </>
    );
};
