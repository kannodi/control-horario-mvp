'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Play, Pause, Square, LogOut, Clock, Calendar, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { fetchLocationInfo } from '@/services/externalApi';
import { LocationInfo } from '@/types';
import { MapPin, Globe, Server, Hash, Minimize2 } from 'lucide-react';

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
    const isLocationFetching = useRef(false);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionData | null>(null);
    const [profile, setProfile] = useState<{ full_name: string | null; company_id: string | null } | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Location state
    const [location, setLocation] = useState<LocationInfo | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

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

    // Fetch location info
    const getLocation = useCallback(async (force = false) => {
        if (isLocationFetching.current && !force) return;

        try {
            isLocationFetching.current = true;
            setLocationLoading(true);
            setLocationError(null);
            const data = await fetchLocationInfo();
            setLocation(data);
        } catch (err) {
            console.error('Location fetch error:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar ubicación';

            if (message.includes('429')) {
                setLocationError('Límite de peticiones alcanzado. Por favor, intenta más tarde.');
            } else {
                setLocationError('No se pudo obtener la ubicación. Verifica tu conexión.');
            }
        } finally {
            setLocationLoading(false);
            isLocationFetching.current = false;
        }
    }, []);

    useEffect(() => {
        fetchData();
        getLocation();
    }, [fetchData, getLocation]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const updateTimer = () => {
            if (!session || !session.check_in) {
                setElapsedSeconds(0);
                return;
            }

            const start = new Date(session.check_in).getTime();
            const now = new Date().getTime();

            // Calculate break duration
            const totalBreaksMs = session.breaks?.reduce((acc: number, b: any) => {
                if (b.break_end && b.break_start) {
                    return acc + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime());
                }
                // If currently paused, add current break duration so far to the deduction
                // effectively freezing the "worked" timer
                if (!b.break_end && b.break_start && session.status === 'paused') {
                    return acc + (now - new Date(b.break_start).getTime());
                }
                return acc;
            }, 0) || 0;

            setElapsedSeconds(Math.floor((now - start - totalBreaksMs) / 1000));
        };

        if (session?.status === 'active') {
            updateTimer(); // Initial update
            interval = setInterval(updateTimer, 1000);
        } else if (session?.status === 'paused') {
            updateTimer(); // Update once to show correct frozen time
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

    const handlePause = async () => {
        if (!session) return;

        try {
            // 1. Create break record
            const { error: breakError } = await supabase
                .from('breaks')
                .insert({
                    work_session_id: session.id,
                    break_start: new Date().toISOString()
                });

            if (breakError) throw breakError;

            // 2. Update session status
            const { error: sessionError } = await supabase
                .from('work_sessions')
                .update({ status: 'paused' })
                .eq('id', session.id);

            if (sessionError) throw sessionError;

            // 3. Update local state
            fetchData();

        } catch (error) {
            console.error('Error pausing session:', error);
        }
    };

    const handleResume = async () => {
        if (!session) return;

        try {
            // 1. Find open break
            const { data: openBreak, error: findError } = await supabase
                .from('breaks')
                .select('id')
                .eq('work_session_id', session.id)
                .is('break_end', null)
                .single();

            if (findError) throw findError;

            if (openBreak) {
                // 2. Close break
                const { error: updateBreakError } = await supabase
                    .from('breaks')
                    .update({ break_end: new Date().toISOString() })
                    .eq('id', openBreak.id);

                if (updateBreakError) throw updateBreakError;
            }

            // 3. Update session status
            const { error: sessionError } = await supabase
                .from('work_sessions')
                .update({ status: 'active' })
                .eq('id', session.id);

            if (sessionError) throw sessionError;

            fetchData();

        } catch (error) {
            console.error('Error resuming session:', error);
        }
    };

    const handleEndDay = async () => {
        if (!session) return;

        try {
            const now = new Date();
            const start = new Date(session.check_in).getTime();
            const end = now.getTime();
            const totalBreaksMs = session.breaks?.reduce((acc: number, b: any) => {
                if (b.break_end) return acc + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime());
                if (!b.break_end && b.break_start) return acc + (end - new Date(b.break_start).getTime());
                return acc;
            }, 0) || 0;

            const totalMinutes = Math.floor((end - start - totalBreaksMs) / 60000);

            if (session.status === 'paused') {
                await supabase
                    .from('breaks')
                    .update({ break_end: now.toISOString() })
                    .eq('work_session_id', session.id)
                    .is('break_end', null);
            }

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
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <Clock className="w-10 h-10 mb-4 text-indigo-600 dark:text-indigo-500" />
                    <p>Cargando tu espacio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
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
                <Card className="text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" padding="lg">
                    <div className="mb-6">
                        <h2 className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider mb-2">
                            {session?.status === 'active' ? 'Jornada en Curso' :
                                session?.status === 'paused' ? 'En Pausa' : 'Sin Jornada Activa'}
                        </h2>
                        <div className={`text-6xl font-mono font-bold tabular-nums tracking-tight transition-all duration-500
                    ${session?.status === 'active'
                                ? 'text-indigo-600 dark:text-indigo-400 dark:drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]'
                                : session?.status === 'paused'
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-slate-400 dark:text-slate-600'}
                `}>
                            {formatTime(elapsedSeconds)}
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        {!session && (
                            <Button size="lg" onClick={handleStartDay} className="w-full max-w-xs shadow-indigo-900/20 shadow-xl dark:shadow-indigo-500/20 transition-all hover:scale-105">
                                <Play className="w-5 h-5 mr-2 fill-current" />
                                Iniciar Jornada
                            </Button>
                        )}

                        {session?.status === 'active' && (
                            <>
                                <Button variant="secondary" onClick={handlePause} className="shadow-lg hover:shadow-xl transition-all dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
                                    <Pause className="w-5 h-5 mr-2 fill-current" />
                                    Pausar
                                </Button>
                                <Button variant="danger" onClick={handleEndDay} className="shadow-lg hover:shadow-xl transition-all">
                                    <Square className="w-5 h-5 mr-2 fill-current" />
                                    Terminar
                                </Button>
                            </>
                        )}

                        {session?.status === 'paused' && (
                            <>
                                <Button variant="primary" onClick={handleResume} className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all">
                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                    Reanudar
                                </Button>
                                <Button variant="danger" onClick={handleEndDay} className="shadow-lg hover:shadow-xl transition-all">
                                    <Square className="w-5 h-5 mr-2 fill-current" />
                                    Terminar
                                </Button>
                            </>
                        )}
                    </div>
                </Card>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card padding="md" className="flex flex-col items-center justify-center border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl">
                        <span className="text-slate-500 dark:text-slate-400 text-sm mb-1">Inicio</span>
                        <span className="text-xl font-mono font-medium text-slate-900 dark:text-white">
                            {session?.check_in ? new Date(session.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                    </Card>
                    <Card padding="md" className="flex flex-col items-center justify-center border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl">
                        <span className="text-slate-500 dark:text-slate-400 text-sm mb-1">Estado</span>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${session?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            session?.status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                            {session?.status === 'active' ? 'Trabajando' : session?.status === 'paused' ? 'En Pausa' : 'Inactivo'}
                        </div>
                    </Card>
                </div>

                {/* Location Card */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden" padding="none">
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-semibold text-sm">Ubicación actual</h3>
                    </div>
                    <div className="p-6">
                        {locationLoading ? (
                            <div className="flex items-center justify-center py-4 text-slate-500 gap-2">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Cargando ubicación...</span>
                            </div>
                        ) : locationError ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg flex items-center gap-2">
                                    <span className="flex-1">{locationError}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => getLocation(true)}
                                    className="text-xs text-slate-500 hover:text-indigo-500"
                                >
                                    <RefreshCcw className="w-3 h-3 mr-1" />
                                    Reintentar ahora
                                </Button>
                            </div>
                        ) : location ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                            <Globe className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ciudad / Región</p>
                                            <p className="text-sm font-medium">{location.city}, {location.region}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                            <Server className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">País</p>
                                            <p className="text-sm font-medium">{location.country_name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                            <Hash className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dirección IP</p>
                                            <p className="text-sm font-medium">{location.ip}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                            <Minimize2 className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Zona Horaria</p>
                                            <p className="text-sm font-medium">{location.timezone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Card>
            </main>
        </div>
    );
}
