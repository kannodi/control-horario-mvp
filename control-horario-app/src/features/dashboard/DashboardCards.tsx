'use client';

import { Card } from '@/components/ui/Card';

interface StatusCardProps {
    status: 'active' | 'paused' | 'completed' | undefined;
}

export function StatusCard({ status }: StatusCardProps) {
    return (
        <Card padding="md" className="flex flex-col items-center justify-center border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl h-full">
            <span className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">Estado</span>
            <div className={`px-4 py-2 rounded-full text-base font-bold ${status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                {status === 'active' ? 'Trabajando' : status === 'paused' ? 'En Pausa' : 'Inactivo'}
            </div>
        </Card>
    );
}

interface StartTimeCardProps {
    checkInTime: string | undefined | null;
}

export function StartTimeCard({ checkInTime }: StartTimeCardProps) {
    return (
        <Card padding="md" className="flex flex-col items-center justify-center border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl h-full">
            <span className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">Inicio</span>
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {checkInTime ? new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
        </Card>
    );
}

interface WorkHoursCardProps {
    status: 'active' | 'paused' | 'completed' | undefined;
    totalMinutes: number;
}

export function WorkHoursCard({ status, totalMinutes }: WorkHoursCardProps) {
    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return (
        <Card padding="md" className="flex flex-col items-center justify-center border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl h-full">
            <span className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">Horas Trabajadas</span>
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {status === 'completed' ? formatTime(totalMinutes) : '--:--'}
            </span>
        </Card>
    );
}
