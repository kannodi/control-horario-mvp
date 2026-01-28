import { WorkSession, SessionStatus } from '@/types';
import { MOCK_SESSIONS, MOCK_CURRENT_SESSION } from '@/lib/mock-data';

// Simulating database state in memory for the session
let currentSession: WorkSession | null = MOCK_CURRENT_SESSION;
let sessions: WorkSession[] = [...MOCK_SESSIONS];

export const TimeTrackingService = {
    async getCurrentSession(): Promise<WorkSession | null> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return currentSession;
    },

    async startSession(userId: string): Promise<WorkSession> {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (currentSession) {
            throw new Error('Session already active');
        }

        const newSession: WorkSession = {
            id: `sess_${Date.now()}`,
            user_id: userId,
            company_id: 'comp_123',
            date: new Date().toISOString().split('T')[0],
            check_in: new Date().toISOString(),
            status: 'active',
            total_minutes: 0,
            breaks: [],
        };

        currentSession = newSession;
        return newSession;
    },

    async pauseSession(sessionId: string): Promise<WorkSession> {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!currentSession || currentSession.id !== sessionId) {
            throw new Error('Session not found or mismatch');
        }

        // In a real app we would add a break record here
        currentSession = {
            ...currentSession,
            status: 'paused',
        };

        return currentSession;
    },

    async resumeSession(sessionId: string): Promise<WorkSession> {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!currentSession || currentSession.id !== sessionId) {
            throw new Error('Session not found or mismatch');
        }

        currentSession = {
            ...currentSession,
            status: 'active',
        };

        return currentSession;
    },

    async stopSession(sessionId: string): Promise<WorkSession> {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!currentSession || currentSession.id !== sessionId) {
            throw new Error('Session not found or mismatch');
        }

        const completedSession = {
            ...currentSession,
            check_out: new Date().toISOString(),
            status: 'completed' as SessionStatus,
        };

        sessions = [completedSession, ...sessions];
        currentSession = null;

        return completedSession;
    },

    async getHistory(): Promise<WorkSession[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return sessions;
    }
};
