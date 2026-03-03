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

        socketRef.current.on('PARTICIPANT_JOINED', () => {
            setParticipants(p => p + 1);
        });

        socketRef.current.on('PARTICIPANT_DISQUALIFIED', (data) => {
            setDisqualified(prev => [...prev, data]);
        });

        // We can also poll REST API for initial leaderboard or listen to broadcast
        // In a prod app, we'd fetch leaderboard via REST regularly
        const fetchLb = async () => {
            try {
                // Mock URL for now - in prod use standard Fetch to backend
                const res = await fetch(`/api/exams/${examId}/leaderboard`);
                const data = await res.json();
                setLeaderboard(data);
            } catch (e) {
                console.error(e);
            }
        };

        const interval = setInterval(fetchLb, 5000);
        return () => {
            socketRef.current?.disconnect();
            clearInterval(interval);
        };
    }, [examId]);

    const startExam = () => {
        socketRef.current?.send({ type: 'START_EXAM' });
    };

    const exportCSV = async () => {
        // Generate CSV from leaderboard data
        if (!leaderboard.length) return;
        const headers = ['Rank', 'Name', 'Email', 'Total Score', 'Status'];
        const rows = leaderboard.map((p, i) => [i + 1, p.name, p.email, p.total_score, p.status]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `exam_results_${examId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <div className="flex gap-4">
                        <button onClick={exportCSV} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded font-medium">Export CSV</button>
                        <button onClick={() => window.print()} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded font-medium">Export PDF</button>
                        <button onClick={startExam} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium shadow-md">Start Exam</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Total Participants</h3>
                        <div className="text-4xl font-bold text-blue-600">{participants}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Disqualified</h3>
                        <div className="text-4xl font-bold text-red-600">{disqualified.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Exam Status</h3>
                        <div className="text-2xl font-bold capitalize text-gray-800">{status}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">Live Leaderboard (Invisible to Students)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-sm text-gray-500 bg-white">
                                    <th className="px-6 py-3 font-medium">Rank</th>
                                    <th className="px-6 py-3 font-medium">Student Name</th>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium text-right">Score</th>
                                    <th className="px-6 py-3 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Waiting for data...</td>
                                    </tr>
                                )}
                                {leaderboard.map((student, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">#{idx + 1}</td>
                                        <td className="px-6 py-4">{student.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{student.email}</td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-blue-600">{student.total_score}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${student.status === 'disqualified' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
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
            </div>
        </div>
    );
};
