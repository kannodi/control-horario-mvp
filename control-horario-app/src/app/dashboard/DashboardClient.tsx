'use client';

import { useEffect, useState } from 'react';
import { Timer } from '@/features/timer/Timer';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { WeeklyChart } from '@/features/dashboard/WeeklyChart';
import { WorkSession } from '@/types';
import { TimeTrackingService } from '@/services/time-tracking.service';
import { MOCK_USER } from '@/lib/mock-data';

export default function DashboardClient() {
    const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial fetch
        const fetchSession = async () => {
            try {
                const session = await TimeTrackingService.getCurrentSession();
                setCurrentSession(session);
            } catch (err) {
                console.error("Failed to load session", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, []);

    const todayMinutes = 0; // In real app, calculate from session history + current session

    if (loading) {
        return <div className="flex h-96 items-center justify-center text-slate-400">Cargando dashboard...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Hola, {MOCK_USER.full_name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Aquí tienes el resumen de tu jornada laboral.
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <DashboardStats currentSession={currentSession} todayMinutes={todayMinutes} />

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Actividad Semanal</h2>
                    <div className="h-80">
                        <WeeklyChart />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Control de Jornada</h2>
                    <div className="flex-1 flex items-center justify-center">
                        <Timer initialSession={currentSession} onSessionChange={setCurrentSession} />
                    </div>
                </div>
            </div>
        </div>
    );
}
