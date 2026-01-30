import { WorkSession, SessionStatus, Break } from '@/types';
import { supabase } from '@/lib/supabase';

export const TimeTrackingService = {
    async getCurrentSession(): Promise<WorkSession | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Fetch session without breaks join first to isolate schema issues
            const { data: session, error: sessionError } = await supabase
                .from('work_sessions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'paused'])
                .maybeSingle();

            if (sessionError) {
                console.error('CRITICAL: Error fetching work_session from Supabase:', sessionError);
                throw new Error(`Database error querying work_sessions: ${sessionError.message}`);
            }

            if (!session) return null;

            // Fetch breaks separately
            const { data: breaks, error: breaksError } = await supabase
                .from('breaks')
                .select('*')
                .eq('work_session_id', session.id);

            if (breaksError) {
                console.error('Error fetching breaks from Supabase:', breaksError);
                // We don't throw here, just return session with empty breaks or what we have
                return { ...session, breaks: [] } as WorkSession;
            }

            return { ...session, breaks: breaks || [] } as WorkSession;
        } catch (err: any) {
            console.error('Caught error in getCurrentSession:', err);
            throw err;
        }
    },

    async startSession(userId: string): Promise<WorkSession> {
        const todayStr = new Date().toISOString().split('T')[0];

        // Check if there's already a session for today
        const { data: existingSession, error: checkError } = await supabase
            .from('work_sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('date', todayStr)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existingSession) {
            throw new Error('Ya has registrado una jornada el día de hoy. Inténtalo mañana.');
        }

        const newSession = {
            user_id: userId,
            company_id: 'comp_123', // This should come from profile in a real app
            date: todayStr,
            check_in: new Date().toISOString(),
            status: 'active',
            total_minutes: 0,
            accumulated_seconds: 0,
        };

        const { data, error } = await supabase
            .from('work_sessions')
            .insert(newSession)
            .select(`
                *,
                breaks (*)
            `)
            .single();

        if (error) throw error;
        return data as WorkSession;
    },

    async pauseSession(sessionId: string): Promise<WorkSession> {
        const now = new Date();
        const currentSession = await this.getCurrentSession();
        
        if (!currentSession || currentSession.id !== sessionId) {
            throw new Error('Session not found or mismatch');
        }

        // Calculate time since last check_in
        const lastStart = new Date(currentSession.check_in);
        const secondsSinceStart = Math.floor((now.getTime() - lastStart.getTime()) / 1000);
        const newAccumulated = (currentSession.accumulated_seconds || 0) + secondsSinceStart;

        // Start a break
        const { error: breakError } = await supabase
            .from('breaks')
            .insert({
                work_session_id: sessionId,
                break_start: now.toISOString(),
            });

        if (breakError) throw breakError;

        // Update session
        const { data, error } = await supabase
            .from('work_sessions')
            .update({
                status: 'paused',
                accumulated_seconds: newAccumulated,
                total_minutes: Math.floor(newAccumulated / 60)
            })
            .eq('id', sessionId)
            .select(`
                *,
                breaks (*)
            `)
            .single();

        if (error) throw error;
        return data as WorkSession;
    },

    async resumeSession(sessionId: string): Promise<WorkSession> {
        const now = new Date().toISOString();
        
        // End the active break
        const { data: activeBreak, error: breakFetchError } = await supabase
            .from('breaks')
            .select('id, break_start')
            .eq('work_session_id', sessionId)
            .is('break_end', null)
            .maybeSingle();

        if (breakFetchError) throw breakFetchError;

        if (activeBreak) {
            const startStr = activeBreak.break_start;
            const duration = Math.floor((new Date().getTime() - new Date(startStr).getTime()) / 60000);
            
            await supabase
                .from('breaks')
                .update({ 
                    break_end: now,
                    duration_minutes: duration
                })
                .eq('id', activeBreak.id);
        }

        // Update session check_in to now for calculating next delta
        const { data, error } = await supabase
            .from('work_sessions')
            .update({
                status: 'active',
                check_in: now
            })
            .eq('id', sessionId)
            .select(`
                *,
                breaks (*)
            `)
            .single();

        if (error) throw error;
        return data as WorkSession;
    },

    async stopSession(sessionId: string): Promise<WorkSession> {
        const now = new Date();
        const currentSession = await this.getCurrentSession();
        
        if (!currentSession || currentSession.id !== sessionId) {
            throw new Error('Session not found or mismatch');
        }

        let finalAccumulated = currentSession.accumulated_seconds || 0;

        if (currentSession.status === 'active') {
            const lastStart = new Date(currentSession.check_in);
            const secondsSinceStart = Math.floor((now.getTime() - lastStart.getTime()) / 1000);
            finalAccumulated += secondsSinceStart;
        } else if (currentSession.status === 'paused') {
            // End the break if stopping while paused
            await this.resumeSession(sessionId);
        }

        const { data, error } = await supabase
            .from('work_sessions')
            .update({
                check_out: now.toISOString(),
                status: 'completed',
                accumulated_seconds: finalAccumulated,
                total_minutes: Math.floor(finalAccumulated / 60)
            })
            .eq('id', sessionId)
            .select(`
                *,
                breaks (*)
            `)
            .single();

        if (error) throw error;
        return data as WorkSession;
    },

    async getHistory(month?: number, year?: number): Promise<WorkSession[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            let query = supabase
                .from('work_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('date', { ascending: false });

            if (month !== undefined && year !== undefined) {
                const startDate = new Date(year, month, 1).toISOString().split('T')[0];
                const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
                query = query.gte('date', startDate).lte('date', endDate);
            }

            const { data: sessions, error } = await query;
            if (error) {
                console.error('Error fetching history from Supabase:', error);
                throw new Error(`Database error querying history: ${error.message}`);
            }

            // For history, we don't necessarily need the breaks for all sessions in the list
            // but we add them as empty arrays to match the type if needed.
            // Or we could fetch them, but for performance let's keep it simple.
            return (sessions || []).map(s => ({ ...s, breaks: [] })) as WorkSession[];
        } catch (err: any) {
            console.error('Caught error in getHistory:', err);
            return [];
        }
    }
};
