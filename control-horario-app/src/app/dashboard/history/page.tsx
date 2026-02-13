'use client';

import { useEffect, useState } from 'react';
import { HistoryTable } from '@/features/history/HistoryTable';
import { MonthSelector } from '@/features/history/MonthSelector';
import { TimeTrackingService } from '@/services/time-tracking.service';
import { WorkSession } from '@/types';

export default function HistoryPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState<WorkSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const data = await TimeTrackingService.getHistory(
                    currentDate.getMonth(),
                    currentDate.getFullYear()
                );
                setSessions(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [currentDate]);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 p-10 rounded-xl">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                        Asistencia Semanal
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Historial de jornadas y asistencias.
                    </p>
                </div>

                <div className="flex flex-col">
                    <MonthSelector
                        currentDate={currentDate}
                        onMonthChange={setCurrentDate}
                    />

                    {loading ? (
                        <div className="w-full h-64 flex items-center justify-center text-slate-400">
                            Cargando historial...
                        </div>
                    ) : (
                        <HistoryTable sessions={sessions} />
                    )}
                </div>
            </div>
        </div>
    );
}
