'use client';

import { Activity, Clock, Coffee, TrendingUp } from 'lucide-react';
import { WorkSession } from '@/types';

interface StatsProps {
    currentSession: WorkSession | null;
    todayMinutes: number;
}

export function DashboardStats({ currentSession, todayMinutes }: StatsProps) {
    const formatMins = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Horas Hoy</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatMins(todayMinutes)}</h3>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                        <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Pausas</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {currentSession?.breaks.length || 0}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Estado</p>
                        <h3 className="text-2xl font-bold text-slate-900 capitalize">
                            {currentSession?.status === 'active' ? 'Trabajando' : currentSession?.status === 'paused' ? 'En Pausa' : 'Inactivo'}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Rendimiento</p>
                        <h3 className="text-2xl font-bold text-slate-900">100%</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
