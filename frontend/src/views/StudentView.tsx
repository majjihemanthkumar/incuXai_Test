import React, { useEffect, useRef, useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { SponsorScroll } from '../components/SponsorScroll';
import { SocketClient } from '../lib/socket';
import { toast } from 'react-toastify';

export const StudentView: React.FC<{ name: string; email: string }> = ({ name, email }) => {
    const { examId, participantId, status, currentQuestion, timeLeft, answerFeedback, disqualificationReason, setStatus, setQuestion, setTimeLeft, setAnswerFeedback, disqualify } = useExamStore();
    const socketRef = useRef<SocketClient | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const answerTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!examId || !participantId) return;
        socketRef.current = new SocketClient();
        socketRef.current.connect(examId, 'student', participantId);

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

    useEffect(() => {
        let interval: any;
        if (status === 'active' || status === 'transition') {
            interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // Anti-Cheating
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
            socketRef.current?.send({ type: 'SUBMIT_ANSWER', answer: '', timeTaken: 25 });
        }
    };

    const handleAnswer = (option: string) => {
        if (selectedAnswer || status !== 'active') return;
        setSelectedAnswer(option);
        const timeTaken = (Date.now() - answerTimeRef.current) / 1000;
        socketRef.current?.send({ type: 'SUBMIT_ANSWER', answer: option, timeTaken });
    };

    if (status === 'pending') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl text-primary font-semibold mb-6">Waiting for Exam to Start...</h2>
                <div className="animate-pulse w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <div className="mt-8 bg-white border border-border p-6 rounded-xl shadow-sm max-w-md w-full text-center">
                    <p className="text-sm text-secondary font-medium uppercase tracking-widest mb-2 text-warning">Important Rules</p>
                    <p className="text-secondary text-sm">
                        Switching tabs, changing apps, losing focus, or exiting fullscreen will automatically disqualify you once the exam begins.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'disqualified') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center border-t-8 border-error">
                <h1 className="text-5xl text-primary font-bold mb-4 tracking-tight">Disqualified</h1>
                <p className="text-lg text-secondary">{disqualificationReason}</p>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-10 rounded-2xl shadow-md border border-border max-w-lg w-full">
                    <h1 className="text-3xl text-primary font-semibold mb-3">Exam Completed</h1>
                    <p className="text-secondary">Your answers have been recorded securely. You may close this window.</p>
                </div>
            </div>
        );
    }

    if (status === 'transition') {
        return (
            <div className="min-h-screen bg-primary relative overflow-hidden flex flex-col items-center justify-center">
                <div className="z-10 text-center">
                    <h2 className="text-3xl text-white/90 font-light mb-6">Next Question Starting...</h2>
                    <div className="text-7xl font-semibold text-white">{Math.max(0, timeLeft)}</div>
                </div>
                <SponsorScroll />
            </div>
        );
    }

    // Active status
    const progressPercent = Math.max(0, (timeLeft / 25) * 100);
    const timerColor = timeLeft <= 5 ? 'bg-error' : (timeLeft <= 10 ? 'bg-warning' : 'bg-accent');

    return (
        <div className="min-h-screen bg-background text-primary p-4 md:p-8 flex flex-col items-center font-sans">
            {/* Header Info */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-6">
                <div className="text-secondary font-medium bg-white px-4 py-1.5 rounded-full shadow-sm border border-border text-sm">
                    Question {currentQuestion?.id}
                </div>
                <div className="text-secondary text-sm font-medium">{name}</div>
            </div>

            {/* Main Question Card */}
            <div className="w-full max-w-3xl bg-white border border-border rounded-xl shadow-md overflow-hidden mb-6 flex flex-col">
                {/* Timer Bar */}
                <div className="h-1.5 w-full bg-gray-100 relative">
                    <div
                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${timerColor}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <div className="p-8 md:p-10">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-2xl font-semibold leading-relaxed text-primary">{currentQuestion?.question_text}</h2>
                        <div className={`text-2xl font-bold font-mono ml-4 ${timeLeft <= 5 ? 'text-error' : 'text-primary'}`}>
                            00:{Math.max(0, timeLeft).toString().padStart(2, '0')}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                            const optKey = `option_${opt.toLowerCase()}` as keyof typeof currentQuestion;

                            const isSelected = selectedAnswer === opt;
                            const answered = selectedAnswer !== null;

                            return (
                                <button
                                    key={opt}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={answered}
                                    className={`p-5 rounded-lg border-2 text-left text-base font-medium transition-all flex items-center ${isSelected
                                            ? 'bg-accent/10 border-accent text-primary shadow-sm'
                                            : answered
                                                ? 'bg-gray-50 border-border text-secondary/50 cursor-not-allowed'
                                                : 'bg-white border-border hover:border-secondary hover:bg-gray-50 text-secondary'
                                        }`}
                                >
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded shrink-0 mr-4 border text-sm font-bold ${isSelected ? 'bg-accent text-white border-accent' : 'bg-gray-100 border-border text-secondary'
                                        }`}>
                                        {opt}
                                    </span>
                                    {currentQuestion?.[optKey]}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {answerFeedback && (
                <div className="w-full max-w-3xl mt-2 fade-in">
                    <div className={`text-center p-5 rounded-xl border-l-4 shadow-sm bg-white font-semibold text-lg tracking-wide ${answerFeedback.isCorrect
                            ? 'border-success text-success'
                            : 'border-error text-error'
                        }`}>
                        {answerFeedback.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                </div>
            )}
        </div>
    );
};
