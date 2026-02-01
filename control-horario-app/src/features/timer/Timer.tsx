'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { WorkSession } from '@/types';
import { TimeTrackingService } from '@/services/time-tracking.service';
import { createClient } from '@/lib/supabase/client';

interface TimerProps {
    initialSession: WorkSession | null;
    onSessionChange: (session: WorkSession | null) => void;
}

export function Timer({ initialSession, onSessionChange }: TimerProps) {
    const supabase = createClient();
    const [session, setSession] = useState<WorkSession | null>(initialSession);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSession(initialSession);

        if (initialSession) {
            const accumulated = initialSession.accumulated_seconds || 0;

            if (initialSession.status === 'active' && initialSession.check_in) {
                // Active: Accumulated + (Now - CheckIn)
                const startTime = new Date(initialSession.check_in).getTime();
                const now = new Date().getTime();
                const currentDelta = Math.floor((now - startTime) / 1000);
                setElapsedSeconds(accumulated + currentDelta);
            } else {
                // Paused or Completed: Just show accumulated
                setElapsedSeconds(accumulated);
            }
        } else {
            setElapsedSeconds(0);
        }
    }, [initialSession]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (session?.status === 'active') {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else if (session?.status === 'paused') {
            // When paused, we don't increment. 
            // In a real app with backend, we would fetch the accumulated time.
            // For this mock, we rely on the state preserving the last value or calculating from breaks if available.
        }

        return () => clearInterval(interval);
    }, [session?.status]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            h: hours.toString().padStart(2, '0'),
            m: minutes.toString().padStart(2, '0'),
            s: seconds.toString().padStart(2, '0')
        };
    };

    const time = formatTime(elapsedSeconds);

    const handleStart = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para comenzar una jornada.');
                return;
            }
            const newSession = await TimeTrackingService.startSession(user.id);
            setSession(newSession);
            setElapsedSeconds(0);
            onSessionChange(newSession);
        } catch (error: any) {
            console.error('Error detail:', error);
            const errorMsg = error.message || 'Error al iniciar jornada';
            const errorDetails = error.details || error.hint || '';
            alert(`Error: ${errorMsg}\n${errorDetails}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePause = async () => {
        if (!session) return;
        try {
            setLoading(true);
            const updatedSession = await TimeTrackingService.pauseSession(session.id);
            setSession(updatedSession);
            onSessionChange(updatedSession);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleResume = async () => {
        if (!session) return;
        try {
            setLoading(true);
            const updatedSession = await TimeTrackingService.resumeSession(session.id);
            setSession(updatedSession);
            onSessionChange(updatedSession);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        if (!session) return;
        try {
            setLoading(true);
            const completedSession = await TimeTrackingService.stopSession(session.id);
            setSession(null);
            setElapsedSeconds(0);
            onSessionChange(null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col items-center justify-center py-8">
                <div className="text-6xl font-black tracking-tighter tabular-nums mb-8 flex items-baseline gap-1">
                    <span className={parseInt(time.h) > 0 ? "text-blue-600" : "text-slate-400 dark:text-slate-500"}>{time.h}</span>
                    <span className="text-slate-300 dark:text-slate-600 mx-1">:</span>
                    <span className={parseInt(time.m) > 0 ? "text-blue-600" : "text-slate-400 dark:text-slate-500"}>{time.m}</span>
                    <span className="text-slate-300 dark:text-slate-600 mx-1">:</span>
                    <span className="text-blue-600 animate-pulse">{time.s}</span>
                </div>

                <div className="flex items-center gap-4">
                    {!session || session.status === 'completed' ? (
                        <button
                            onClick={handleStart}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3
                            rounded-full font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Iniciar Jornada
                        </button>
                    ) : (
                        <>
                            {session.status === 'active' ? (
                                <button
                                    onClick={handlePause}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3
                                    rounded-full font-bold shadow-lg shadow-amber-900/20 transition-all hover:scale-105"
                                >
                                    <Pause className="w-5 h-5 fill-current" />
                                    Pausar
                                </button>
                            ) : (
                                <button
                                    onClick={handleResume}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3
                                    rounded-full font-bold shadow-lg shadow-green-900/20 transition-all hover:scale-105"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Reanudar
                                </button>
                            )}

                            <button
                                onClick={handleStop}
                                disabled={loading}
                                className="flex items-center gap-2 bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-700
                                px-6 py-3 rounded-full font-bold transition-all"
                            >
                                <Square className="w-5 h-5 fill-current" />
                                Finalizar
                            </button>
                        </>
                    )}
                </div>

                {session && (
                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>
                            Entrada: {new Date(session.check_in).toLocaleTimeString()}
                        </span>
                        {session.status === 'paused' && (
                            <span className="ml-2 text-amber-500 font-medium">
                                (En pausa)
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
