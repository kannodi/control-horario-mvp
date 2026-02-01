"use client";

import { useEffect, useState, useMemo } from 'react';
import { Timer } from '@/features/timer/Timer';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { WeeklyChart } from '@/features/dashboard/WeeklyChart';
import { WorkSession } from '@/types';
import { TimeTrackingService } from '@/services/time-tracking.service';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
    full_name: string;
}

export default function DashboardClient() {
    const supabase = createClient();
    const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
    const [todayStats, setTodayStats] = useState({ minutes: 0, breaks: 0 });
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<WorkSession[]>([]);

    const fetchData = async () => {
        try {
            // Fetch User Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .maybeSingle();
                setUserProfile(profile);
            }

            const session = await TimeTrackingService.getCurrentSession();
            setCurrentSession(session);

            const now = new Date();
            const historyData = await TimeTrackingService.getHistory(now.getMonth(), now.getFullYear());
            setHistory(historyData);

            const todayStr = now.toISOString().split('T')[0];
            const todaySessions = historyData.filter(s => s.date === todayStr && s.status === 'completed');

            let totalMinutes = todaySessions.reduce((acc, curr) => acc + curr.total_minutes, 0);
            let totalBreaks = todaySessions.reduce((acc, curr) => acc + curr.breaks.length, 0);

            if (session && session.date === todayStr) {
                totalBreaks += session.breaks.length;
            }

            setTodayStats({ minutes: totalMinutes, breaks: totalBreaks });

        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Prepare chart data from history
    const chartData = useMemo(() => {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const now = new Date();
        const results = [];

        // Get last 7 days including today
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = dayNames[d.getDay()];

            const daySessions = history.filter(s => s.date === dateStr);
            const totalHours = daySessions.reduce((acc, s) => acc + (s.total_minutes / 60), 0);

            results.push({
                name: dayName,
                hours: parseFloat(totalHours.toFixed(1))
            });
        }

        return results;
    }, [history]);

    const handleSessionChange = (session: WorkSession | null) => {
        setCurrentSession(session);
        fetchData();
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center text-slate-400">Cargando dashboard...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Hola, {userProfile?.full_name?.split(' ')[0] || 'Usuario'} 👋
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Aquí tienes el resumen de tu jornada laboral.
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <DashboardStats
                currentSession={currentSession}
                todayMinutes={todayStats.minutes}
                todayBreaks={todayStats.breaks}
            />

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Actividad Semanal</h2>
                    <div className="h-80">
                        <WeeklyChart data={chartData} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Control de Jornada</h2>
                    <div className="flex-1 flex items-center justify-center">
                        <Timer initialSession={currentSession} onSessionChange={handleSessionChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}
