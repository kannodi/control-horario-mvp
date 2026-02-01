import { WorkSession, SessionStatus, Break } from '@/types';
import { createClient } from '@/lib/supabase/client';

// Helper to get a fresh client with current auth context
function getSupabase() {
    return createClient();
}

export const TimeTrackingService = {
    async getCurrentSession(): Promise<WorkSession | null> {
        const supabase = getSupabase();
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
        const supabase = getSupabase();
        const todayStr = new Date().toISOString().split('T')[0];

        console.log('🚀 startSession called with userId:', userId);

        try {
            // 0. First verify we have auth
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            console.log('📍 Auth check - user:', user?.id, 'error:', authError);

            if (authError || !user) {
                throw new Error('No hay sesión de autenticación activa. Por favor, inicia sesión de nuevo.');
            }

            // 1. Ensure Profile Exists (Self-Healing)
            console.log('📍 Checking if profile exists...');
            const { data: profileData, error: profileCheckError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            console.log('📍 Profile check result:', { profileData, profileCheckError });

            if (profileCheckError) {
                console.error('❌ Error checking profile:', JSON.stringify(profileCheckError, null, 2));
            }

            if (!profileData) {
                console.log('⚠️ Profile missing for user. Attempting to create one...');
                const fallbackName = user?.email?.split('@')[0] || 'Usuario Sin Nombre';

                const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        full_name: fallbackName,
                        role: 'user',
                        company_id: 'comp_default'
                    });

                if (createProfileError) {
                    console.error('❌ Failed to auto-create profile:', JSON.stringify(createProfileError, null, 2));
                    throw new Error(`No se pudo crear el perfil: ${createProfileError.message || createProfileError.code || 'Error RLS'}`);
                }
                console.log('✅ Profile auto-created successfully.');
            }

            // 2. Create Session
            console.log('📍 Creating work session...');
            const newSession = {
                user_id: userId,
                company_id: 'comp_default',
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

            console.log('📍 Insert result:', { data, error: error ? JSON.stringify(error, null, 2) : null });

            if (error) {
                console.error('❌ Supabase Error in startSession:', JSON.stringify(error, null, 2));
                throw new Error(`Error al crear jornada: ${error.message || error.code || 'Error de base de datos'}`);
            }

            console.log('✅ Session created successfully:', data?.id);
            return data as WorkSession;

        } catch (err: any) {
            console.error('🔥 Critical Error in startSession:', err?.message || err);
            // Re-throw with proper message
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Error desconocido al iniciar jornada');
        }
    },

    async pauseSession(sessionId: string): Promise<WorkSession> {
        const supabase = getSupabase();
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
        const supabase = getSupabase();
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
        const supabase = getSupabase();
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
        const supabase = getSupabase();
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
