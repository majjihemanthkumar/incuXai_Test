import { create } from 'zustand';

interface ExamState {
    role: 'student' | 'admin' | null;
    participantId: string | null;
    examId: string | null;
    status: 'pending' | 'active' | 'transition' | 'completed' | 'disqualified';
    questions: any[];
    currentQuestion: any | null;
    timeLeft: number;
    answerFeedback: { isCorrect: boolean } | null;
    disqualificationReason: string | null;
    leaderboard: any[];

    setRole: (role: 'student' | 'admin') => void;
    setExamData: (examId: string, participantId: string) => void;
    setStatus: (status: ExamState['status']) => void;
    setQuestion: (q: any) => void;
    setTimeLeft: (time: number) => void;
    setAnswerFeedback: (feedback: { isCorrect: boolean } | null) => void;
    disqualify: (reason: string) => void;
    setLeaderboard: (lb: any[]) => void;
}

export const useExamStore = create<ExamState>((set) => ({
    role: null,
    participantId: null,
    examId: null,
    status: 'pending',
    questions: [],
    currentQuestion: null,
    timeLeft: 0,
    answerFeedback: null,
    disqualificationReason: null,
    leaderboard: [],

    setRole: (role) => set({ role }),
    setExamData: (examId, participantId) => set({ examId, participantId }),
    setStatus: (status) => set({ status, answerFeedback: status === 'active' ? null : undefined }),
    setQuestion: (currentQuestion) => set({ currentQuestion, status: 'active', timeLeft: 25, answerFeedback: null }),
    setTimeLeft: (timeLeft) => set({ timeLeft }),
    setAnswerFeedback: (answerFeedback) => set({ answerFeedback }),
    disqualify: (reason) => set({ status: 'disqualified', disqualificationReason: reason }),
    setLeaderboard: (leaderboard) => set({ leaderboard }),
}));
