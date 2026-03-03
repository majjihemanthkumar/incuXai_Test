import React, { useEffect, useState } from 'react';
import { useExamStore } from './store/useExamStore';
import { StudentView } from './views/StudentView';
import { AdminView } from './views/AdminView';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
    const { role, setRole, setExamData } = useExamStore();
    const [roomCode, setRoomCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleJoin = (e: React.FormEvent, isStudent: boolean) => {
        e.preventDefault();
        if (!roomCode) return;

        // Set basic info before jumping in
        setRole(isStudent ? 'student' : 'admin');

        // Generate simple UUID or use API
        const participantId = isStudent ? Math.random().toString(36).substring(7) : 'admin1';
        setExamData(roomCode, participantId);
    };

    if (!role) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col justify-center items-center font-sans p-4">
                <h1 className="text-4xl font-bold mb-8 text-white tracking-widest uppercase">INCUXAI Live Exam</h1>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
                    <h2 className="text-xl font-semibold mb-6 text-center text-gray-400">Join a Session</h2>
                    <form onSubmit={(e) => handleJoin(e, true)} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Room Code</label>
                            <input
                                required
                                value={roomCode}
                                onChange={e => setRoomCode(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter 6-digit code"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="john@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg mt-4 transition-colors"
                        >
                            Join as Student
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleJoin(e, false)}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors border border-gray-700"
                        >
                            Enter as Admin
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer theme="dark" position="top-right" />
            {role === 'student' ? <StudentView name={name} email={email} /> : <AdminView />}
        </>
    );
};

export default App;
