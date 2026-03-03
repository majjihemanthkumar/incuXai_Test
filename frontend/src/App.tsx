import React, { useState } from 'react';
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

        setRole(isStudent ? 'student' : 'admin');
        const participantId = isStudent ? Math.random().toString(36).substring(7) : 'admin1';
        setExamData(roomCode, participantId);
    };

    if (!role) {
        return (
            <div className="min-h-screen bg-background text-secondary flex flex-col justify-center items-center font-sans p-6">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">INCUXAI Live Exam</h1>
                    <p className="text-sm mt-2 font-medium text-secondary/60 uppercase tracking-wide">Secure Examination Platform</p>
                </div>

                <div className="bg-white border border-border rounded-xl p-8 max-w-md w-full shadow-lg">
                    <h2 className="text-xl font-semibold mb-6 text-center text-primary">Join a Session</h2>
                    <form onSubmit={(e) => handleJoin(e, true)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1.5">Room Code</label>
                            <input
                                required
                                value={roomCode}
                                onChange={e => setRoomCode(e.target.value)}
                                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                placeholder="Enter 6-digit code"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1.5">Full Name</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                placeholder="First Last"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1.5">Email Address</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-secondary text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
                            >
                                Join as Student
                            </button>
                        </div>
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={(e) => handleJoin(e, false)}
                                className="w-full bg-white hover:bg-gray-50 text-secondary font-medium py-2.5 rounded-lg transition-colors border border-border"
                            >
                                Access Admin Dashboard
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
            {role === 'student' ? <StudentView name={name} email={email} /> : <AdminView />}
        </>
    );
};

export default App;
