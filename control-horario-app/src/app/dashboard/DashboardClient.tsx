'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Play, Pause, Square, LogOut, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SessionStatus = 'active' | 'paused' | 'completed';

interface SessionData {
    id: string;
    status: SessionStatus;
    check_in: string;
    breaks: any[];
}

export default function DashboardClient() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionData | null>(null);
    const [profile, setProfile] = useState<{ full_name: string | null; company_id: string | null } | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Fetch initial data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Get profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, company_id')
                .eq('id', user.id)
                .single();

            setProfile(profileData);

            // Get today's active/paused session
            const today = new Date().toISOString().split('T')[0];
            const { data: sessionData } = await supabase
                .from('work_sessions')
                .select('*, breaks(*)')
                .eq('user_id', user.id)
                .eq('date', today)
                .neq('status', 'completed') // Only active or paused
                .maybeSingle();

            if (sessionData) {
                setSession(sessionData);
            } else {
                setSession(null);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (session?.status === 'active' && session.check_in) {
            interval = setInterval(() => {
                const start = new Date(session.check_in).getTime();
                const now = new Date().getTime();
                // Calculate break duration
                const totalBreaksMs = session.breaks?.reduce((acc: number, b: any) => {
                    if (b.break_end && b.break_start) {
                        return acc + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime());
                    }
                    return acc;
                }, 0) || 0;

                setElapsedSeconds(Math.floor((now - start - totalBreaksMs) / 1000));
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }

        return () => clearInterval(interval);
    }, [session]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartDay = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('work_sessions')
                .insert({
                    user_id: user.id,
                    company_id: profile?.company_id || '', // Required by DB
                    date: new Date().toISOString().split('T')[0],
                    check_in: new Date().toISOString(),
                    status: 'active' as const,
                    total_minutes: 0,
                    accumulated_seconds: 0
                })
                .select('*, breaks(*)')
                .single();

            if (error) throw error;
            setSession(data);
        } catch (error) {
            console.error('Error starting day:', error);
        }
    };

    const handleEndDay = async () => {
        if (!session) return;

        try {
            const now = new Date();
            // Calculate final total minutes
            // Simple calc for MVP
            const start = new Date(session.check_in).getTime();
            const end = now.getTime();
            const totalBreaksMs = session.breaks?.reduce((acc: number, b: any) => {
                // Logic for ended breaks
                if (b.break_end) return acc + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime());
                return acc;
            }, 0) || 0;

            const totalMinutes = Math.floor((end - start - totalBreaksMs) / 60000);

            const { error } = await supabase
                .from('work_sessions')
                .update({
                    check_out: now.toISOString(),
                    status: 'completed' as const,
                    total_minutes: totalMinutes
                })
                .eq('id', session.id);

            if (error) throw error;
            setSession(null);
            setElapsedSeconds(0);
        } catch (error) {
            console.error('Error ending day:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <Clock className="w-10 h-10 mb-4 text-indigo-500" />
                    <p>Cargando tu espacio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}</h1>
                    <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                    <LogOut className="w-5 h-5 mr-2" />
                    Salir
                </Button>
            </header>

            <main className="max-w-xl mx-auto space-y-8">
                {/* Main Timer Card */}
                <Card className="text-center bg-slate-800 border-slate-700" padding="lg">
                    <div className="mb-6">
                        <h2 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-2">
                            {session?.status === 'active' ? 'Jornada en Curso' :
                                session?.status === 'paused' ? 'En Pausa' : 'Sin Jornada Activa'}
                        </h2>
                        <div className={`text-6xl font-mono font-bold tabular-nums tracking-tight
                    ${session?.status === 'active' ? 'text-indigo-400' :
                                session?.status === 'paused' ? 'text-yellow-400' : 'text-slate-600'}
                `}>
                            {formatTime(elapsedSeconds)}
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        {!session && (
                            <Button size="lg" onClick={handleStartDay} className="w-full max-w-xs shadow-indigo-900/20 shadow-xl">
                                <Play className="w-5 h-5 mr-2 fill-current" />
                                Iniciar Jornada
                            </Button>
                        )}

                        {session?.status === 'active' && (
                            <>
                                <Button variant="secondary" onClick={() => {/* Pause logic to be implemented */ }} disabled>
                                    <Pause className="w-5 h-5 mr-2 fill-current" />
                                    Pausar
                                </Button>
                                <Button variant="danger" onClick={handleEndDay}>
                                    <Square className="w-5 h-5 mr-2 fill-current" />
                                    Terminar
                                </Button>
                            </>
                        )}
                    </div>
                </Card>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card padding="md" className="flex flex-col items-center justify-center border-slate-700/50 bg-slate-800/50">
                        <span className="text-slate-400 text-sm mb-1">Inicio</span>
                        <span className="text-xl font-mono font-medium">
                            {session?.check_in ? new Date(session.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                    </Card>
                    <Card padding="md" className="flex flex-col items-center justify-center border-slate-700/50 bg-slate-800/50">
                        <span className="text-slate-400 text-sm mb-1">Estado</span>
                        <span className="text-xl font-medium capitalize text-slate-200">
                            {session?.status === 'active' ? 'Trabajando' : 'Descanso'}
                        </span>
                    </Card>
                </div>
            </main>
        </div>
    );
}
