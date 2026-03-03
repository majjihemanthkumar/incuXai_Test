import React, { useEffect, useRef, useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { SocketClient } from '../lib/socket';

export const AdminView: React.FC = () => {
    const { examId, participantId, status, leaderboard, setLeaderboard } = useExamStore();
    const socketRef = useRef<SocketClient | null>(null);
    const [participants, setParticipants] = useState(0);
    const [disqualified, setDisqualified] = useState<any[]>([]);

    useEffect(() => {
        if (!examId) return;
        socketRef.current = new SocketClient();
        socketRef.current.connect(examId, 'admin', participantId || 'admin1');

        socketRef.current.on('PARTICIPANT_JOINED', () => setParticipants(p => p + 1));
        socketRef.current.on('PARTICIPANT_DISQUALIFIED', (data) => setDisqualified(prev => [...prev, data]));

        const fetchLb = async () => {
            try {
                const res = await fetch(`/api/exams/${examId}/leaderboard`);
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data);
                }
            } catch (e) { }
        };

        const interval = setInterval(fetchLb, 5000);
        return () => {
            socketRef.current?.disconnect();
            clearInterval(interval);
        };
    }, [examId]);

    const startExam = () => socketRef.current?.send({ type: 'START_EXAM' });

    const exportCSV = async () => {
        if (!leaderboard.length) return;
        const headers = ['Rank', 'Name', 'Email', 'Total Score', 'Status'];
        const rows = leaderboard.map((p, i) => [i + 1, p.name, p.email, p.total_score, p.status]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `exam_results_${examId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="min-h-screen bg-background flex font-sans text-secondary">
            {/* Dark Sidebar */}
            <aside className="w-64 bg-primary text-white p-6 flex flex-col shrink-0">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold tracking-tight">INCUXAI</h1>
                    <p className="text-secondary/60 text-xs uppercase tracking-widest mt-1">Admin Portal</p>
                </div>

                <nav className="flex-1 space-y-2">
                    <a href="#" className="block px-4 py-2 bg-white/10 rounded-md font-medium">Live Dashboard</a>
                    <a href="#" className="block px-4 py-2 text-white/50 hover:bg-white/5 rounded-md font-medium transition-colors">Questions</a>
                    <a href="#" className="block px-4 py-2 text-white/50 hover:bg-white/5 rounded-md font-medium transition-colors">Settings</a>
                </nav>

                <div className="pt-6 border-t border-white/10">
                    <div className="text-sm text-white/50 mb-1 font-medium">Room Code</div>
                    <div className="text-xl font-mono font-bold tracking-wider">{examId}</div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-semibold text-primary">Live Dashboard</h2>
                        <p className="text-secondary mt-1">Monitor participant performance and metrics</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={exportCSV} className="bg-white border border-border hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">Export CSV</button>
                        <button onClick={() => window.print()} className="bg-white border border-border hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">Export PDF</button>
                        <button onClick={startExam} disabled={status !== 'pending'} className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm text-white ${status === 'pending' ? 'bg-accent hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                            {status === 'pending' ? 'Start Exam' : 'Exam in Progress'}
                        </button>
                    </div>
                </header>

                {/* Muted Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="text-secondary/70 text-xs font-semibold uppercase tracking-wider mb-2">Total Participants</h3>
                        <div className="text-4xl font-light text-primary">{participants}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="text-secondary/70 text-xs font-semibold uppercase tracking-wider mb-2">Disqualified</h3>
                        <div className="text-4xl font-light text-error">{disqualified.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="text-secondary/70 text-xs font-semibold uppercase tracking-wider mb-2">Exam Status</h3>
                        <div className="text-2xl font-medium capitalize text-secondary flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-3 ${status === 'active' ? 'bg-success animate-pulse' : (status === 'transition' ? 'bg-warning' : 'bg-gray-300')}`}></span>
                            {status}
                        </div>
                    </div>
                </div>

                {/* Professional Table */}
                <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-5 border-b border-border bg-white flex justify-between items-center">
                        <h2 className="text-lg font-medium text-primary">Real-time Leaderboard</h2>
                        <span className="text-xs text-secondary bg-gray-100 px-2 py-1 rounded bg-background border border-border">Invisible to students</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border text-secondary/70 bg-gray-50/50">
                                    <th className="px-6 py-3 font-medium uppercase tracking-wide text-xs">Rank</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wide text-xs">Student Name</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wide text-xs">Email</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wide text-xs text-right">Score</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wide text-xs text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-secondary/50">Awaiting data aggregation...</td>
                                    </tr>
                                )}
                                {leaderboard.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">#{idx + 1}</td>
                                        <td className="px-6 py-4 font-medium text-primary">{student.name}</td>
                                        <td className="px-6 py-4 text-secondary/70">{student.email}</td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-primary">{student.total_score}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 text-[11px] rounded-full font-semibold uppercase tracking-wider ${student.status === 'disqualified' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
