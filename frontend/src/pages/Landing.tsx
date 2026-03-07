import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClayNavbar } from '../components/ClayNavbar';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';
import { insforge } from '../lib/insforge';
import {
    AiOutlineRocket,
    AiOutlineTeam,
    AiOutlineLock,
    AiOutlineGlobal
} from 'react-icons/ai';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');
    const [joinName, setJoinName] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showJoinForm, setShowJoinForm] = useState(false);

    const handleJoin = async () => {
        if (joinCode.length !== 6) {
            setErrorMsg('Code must be 6 digits.');
            return;
        }
        if (!joinName.trim()) {
            setErrorMsg('Please enter your name.');
            return;
        }
        setIsJoining(true);
        setErrorMsg('');

        try {
            const { data: session, error } = await insforge.database
                .from('sessions')
                .select('code, is_active')
                .eq('code', joinCode)
                .maybeSingle();

            if (error) throw error;

            if (session) {
                if (!session.is_active) {
                    setErrorMsg('This session has already ended.');
                } else {
                    navigate(`/session/${joinCode}`, { state: { name: joinName } });
                }
            } else {
                setErrorMsg('Session not found.');
            }
        } catch (err) {
            setErrorMsg('Connection error.');
        } finally {
            setIsJoining(false);
        }
    };

    const features = [
        {
            icon: <AiOutlineRocket className="text-3xl" />,
            title: "Real-time Polls",
            desc: "Instantly capture and display audience responses with zero latency.",
            color: "bg-clay-blue"
        },
        {
            icon: <AiOutlineTeam className="text-3xl" />,
            title: "Active Engagement",
            desc: "Connect with thousands of participants simultaneously.",
            color: "bg-clay-pink"
        },
        {
            icon: <AiOutlineLock className="text-3xl" />,
            title: "Secure Exams",
            desc: "Advanced anti-cheat measures for high-stakes examinations.",
            color: "bg-clay-purple"
        },
        {
            icon: <AiOutlineGlobal className="text-3xl" />,
            title: "Global Reach",
            desc: "Accessible from any device, anywhere in the world.",
            color: "bg-clay-mint"
        }
    ];

    return (
        <div className="min-h-screen pb-20">
            <ClayNavbar />

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 pt-20 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4 py-2 border-2 border-clay-blue rounded-full text-sm font-semibold text-clay-blue mb-8 shadow-clay-light"
                >
                    🚀 Reimagining Live Engagement
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl md:text-8xl font-bold text-text-dark mb-8 leading-[1.1]"
                >
                    Present with <br />
                    <span className="text-clay-blue">Confidence.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-2xl text-text-dark/60 max-w-2xl mb-12"
                >
                    The all-in-one platform for interactive presentations, live polls,
                    and secure examinations—designed for the modern startup.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-6 mb-24 relative"
                >
                    <AnimatePresence mode="wait">
                        {!showJoinForm ? (
                            <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-4">
                                <ClayButton variant="primary" className="text-lg px-8" onClick={() => setShowJoinForm(true)}>Join a Session</ClayButton>
                                <ClayButton variant="secondary" className="text-lg px-8" onClick={() => navigate('/dashboard')}>Go to Dashboard</ClayButton>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col gap-4 items-center">
                                <ClayCard className="p-6 flex flex-col gap-4 shadow-clay-medium w-[340px]">
                                    <h3 className="text-xl font-bold">Join Session</h3>
                                    {errorMsg && <p className="text-red-500 text-sm font-semibold">{errorMsg}</p>}
                                    <input
                                        type="text"
                                        placeholder="6-Digit Code"
                                        className="clay-input text-center text-lg tracking-widest font-mono"
                                        maxLength={6}
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        className="clay-input text-center text-lg"
                                        value={joinName}
                                        onChange={(e) => setJoinName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                    />
                                    <div className="flex gap-2 w-full mt-2">
                                        <ClayButton variant="secondary" className="flex-1" onClick={() => { setShowJoinForm(false); setErrorMsg(''); }}>Back</ClayButton>
                                        <ClayButton variant="primary" className="flex-1" onClick={handleJoin} disabled={isJoining}>
                                            {isJoining ? 'Joining...' : 'Join'}
                                        </ClayButton>
                                    </div>
                                </ClayCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Floating Clay Illustrations Placeholder */}
                <div className="relative w-full max-w-4xl h-[400px]">
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-10 left-10 w-32 h-32 bg-clay-pink rounded-[40px] shadow-clay-medium animate-float rotate-12"
                    />
                    <motion.div
                        animate={{ y: [0, 25, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-10 right-10 w-48 h-48 bg-clay-purple rounded-[60px] shadow-clay-medium animate-float -rotate-6"
                    />
                    <motion.div
                        animate={{ x: [0, 15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 right-20 w-36 h-36 bg-clay-mint rounded-[40px] shadow-clay-light"
                    />

                    <ClayCard className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl h-80 bg-white shadow-clay-medium flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-background rounded-2xl shadow-clay-inner mx-auto mb-4 flex items-center justify-center">
                                <AiOutlineRocket className="text-clay-blue text-3xl" />
                            </div>
                            <p className="text-text-dark/40 font-medium">Platform Dashboard Preview</p>
                        </div>
                    </ClayCard>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 mt-40">
                <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, i) => (
                        <ClayCard key={i} className="flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                            <div className={`w-16 h-16 ${feature.color} rounded-2xl mb-6 shadow-clay-light flex items-center justify-center text-white`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-text-dark/60 text-sm leading-relaxed">{feature.desc}</p>
                        </ClayCard>
                    ))}
                </div>
            </section>
        </div>
    );
};
