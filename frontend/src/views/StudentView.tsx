import React, { useEffect, useRef, useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { SponsorScroll } from '../components/SponsorScroll';
import { SocketClient } from '../lib/socket';
import { toast } from 'react-toastify';

export const StudentView: React.FC<{ name: string; email: string }> = ({ name, email }) => {
    const { examId, participantId, status, currentQuestion, timeLeft, answerFeedback, disqualificationReason, setStatus, setQuestion, setTimeLeft, setAnswerFeedback, disqualify } = useExamStore();
    const socketRef = useRef<SocketClient | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const answerTimeRef = useRef<number>(0); // Record when the question started

    useEffect(() => {
        if (!examId || !participantId) return;
        socketRef.current = new SocketClient();
        socketRef.current.connect(examId, 'student', participantId);

        // Event Listeners
        socketRef.current.on('NEW_QUESTION', (data) => {
            setSelectedAnswer(null);
            setAnswerFeedback(null);
            setQuestion(data.question);
            answerTimeRef.current = Date.now();
        });

        socketRef.current.on('TRANSITION_START', () => {
            setStatus('transition');
            setTimeLeft(5);
        });

        socketRef.current.on('EXAM_COMPLETED', () => {
            setStatus('completed');
        });

        socketRef.current.on('ANSWER_FEEDBACK', (data) => {
            setAnswerFeedback(data);
        });

        socketRef.current.on('DISQUALIFIED', (data) => {
            disqualify(data.reason);
            toast.error(`Disqualified: ${data.reason}`, { autoClose: false });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [examId, participantId]);

    // Client-side timer
    useEffect(() => {
        let interval: any;
        if (status === 'active' || status === 'transition') {
            interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // Anti-Cheating Implementation (Frontend)
    useEffect(() => {
        if (status !== 'active' && status !== 'transition') return;

        const handleVisibilityChange = () => {
            if (document.hidden) reportCheat('Tab switched or minimized');
        };

        const handleBlur = () => {
            reportCheat('Window lost focus');
        };

        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleCopy = (e: ClipboardEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) {
                e.preventDefault();
                toast.warning('Keyboard shortcuts disabled.');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [status]);

    // Enforce Fullscreen on start
    useEffect(() => {
        const enterFullscreen = () => {
            if (!document.fullscreenElement && status === 'active') {
                document.documentElement.requestFullscreen().catch(() => {
                    toast.error("Please enable fullscreen to continue.");
                });
            }
        };
        document.addEventListener('click', enterFullscreen, { once: true });

        const checkFullscreen = () => {
            if (!document.fullscreenElement && (status === 'active' || status === 'transition')) {
                reportCheat('Exited fullscreen');
            }
        };
        document.addEventListener('fullscreenchange', checkFullscreen);
        return () => document.removeEventListener('fullscreenchange', checkFullscreen);
    }, [status]);

    const reportCheat = (reason: string) => {
        socketRef.current?.send({ type: 'CHEAT_DETECTED', reason });
        if (status === 'active' && selectedAnswer === null) {
            // auto submit if unanswered but disqualified
            socketRef.current?.send({ type: 'SUBMIT_ANSWER', answer: '', timeTaken: 25 });
        }
    };

    const handleAnswer = (option: string) => {
        if (selectedAnswer || status !== 'active') return;
        setSelectedAnswer(option);

        // Calculate time taken client-side (Server enforces max 25s limit anyway)
        const timeTaken = (Date.now() - answerTimeRef.current) / 1000;
        socketRef.current?.send({ type: 'SUBMIT_ANSWER', answer: option, timeTaken });
    };

    if (status === 'pending') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h2 className="text-3xl text-white font-semibold mb-6">Waiting for Exam to Start...</h2>
                <div className="animate-pulse w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-8 text-red-400 max-w-md text-center">
                    Warning: Switching tabs, apps, losing focus, or minimizing will automatically disqualify you once the exam begins.
                </p>
            </div>
        );
    }

    if (status === 'disqualified') {
        return (
            <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-5xl text-white font-bold mb-4">DISQUALIFIED</h1>
                <p className="text-xl text-red-200">{disqualificationReason}</p>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl text-white font-bold mb-4">Exam Completed!</h1>
                <p className="text-gray-400">Your results have been recorded. You may close this window.</p>
            </div>
        );
    }

    if (status === 'transition') {
        return (
            <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex flex-col items-center justify-center">
                {/* Dark Academic Pattern Background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="z-10 text-center">
                    <h2 className="text-5xl text-white font-light tracking-wide mb-8">Next Question Starting...</h2>
                    <div className="text-8xl font-bold text-blue-500">{Math.max(0, timeLeft)}</div>
                </div>

                <SponsorScroll />
            </div>
        );
    }

    // Active status
    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 pt-12 flex flex-col items-center">
            {/* Top Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-12">
                <div className="text-gray-400 font-mono">Q. {currentQuestion?.id} / ?</div>
                <div className="text-center">
                    <div className={`text-4xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-500' : 'text-white'}`}>
                        00:{Math.max(0, timeLeft).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Time Remaining</div>
                </div>
                <div className="text-gray-400 text-sm">{name}</div>
            </div>

            <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl p-10 mb-8 shadow-2xl">
                <h2 className="text-3xl font-medium leading-relaxed mb-10">{currentQuestion?.question_text}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                        const optKey = `option_${opt.toLowerCase()}` as keyof typeof currentQuestion;
                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                disabled={selectedAnswer !== null}
                                className={`p-6 rounded-xl border-2 text-left text-lg font-medium transition-all ${selectedAnswer === opt
                                        ? 'bg-blue-900/40 border-blue-500 text-white'
                                        : selectedAnswer
                                            ? 'bg-gray-900 border-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
                                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                    }`}
                            >
                                <span className="inline-block bg-gray-950 rounded px-3 py-1 mr-4 border border-gray-800 text-sm text-gray-400">{opt}</span>
                                {currentQuestion?.[optKey]}
                            </button>
                        )
                    })}
                </div>
            </div>

            {answerFeedback && (
                <div className="w-full max-w-4xl mt-4">
                    <div className={`text-center p-6 rounded-xl border shadow-lg text-2xl font-bold tracking-wider uppercase ${answerFeedback.isCorrect
                            ? 'bg-green-950/30 border-green-500/50 text-green-400'
                            : 'bg-red-950/30 border-red-500/50 text-red-400'
                        }`}>
                        {answerFeedback.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                </div>
            )}
        </div>
    );
};
