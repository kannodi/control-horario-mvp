'use client';

import { WorkSession } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryTableProps {
    sessions: WorkSession[];
}

export function HistoryTable({ sessions }: HistoryTableProps) {
    // Helper to capitalize first letter
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div className="w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 max-h-[600px]">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">DÍA</th>
                        <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">FECHA</th>
                        <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">ESTADO</th>
                        <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Hra. INGRESO</th>
                        <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Hra. SALIDA</th>
                        <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Total Horas</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {sessions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                                No hay registros para este mes.
                            </td>
                        </tr>
                    ) : (
                        sessions.map((session) => {
                            const dateObj = parseISO(session.date); // Use the date field (YYYY-MM-DD)
                            const checkIn = session.check_in ? parseISO(session.check_in) : null;
                            const checkOut = session.check_out ? parseISO(session.check_out) : null;

                            // Logic for status based on check-in time
                            let statusText = 'Pendiente';
                            let statusColor = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';

                            if (checkIn) {
                                const hour = checkIn.getHours();
                                const minute = checkIn.getMinutes();
                                const timeInMinutes = hour * 60 + minute;
                                const eightAM = 8 * 60; // 480 minutes

                                // 8:00 AM (480) to 8:10 AM (490) -> Asistencia
                                // But also allowing earlier starts as Asistencia
                                switch (true) {
                                    case timeInMinutes <= eightAM + 10:
                                        statusText = 'Asistencia';
                                        statusColor = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500/20 dark:ring-green-400/20';
                                        break;
                                    default:
                                        statusText = 'Tardanza';
                                        statusColor = 'text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-yellow-500/20 dark:ring-yellow-400/20';
                                        break;
                                }
                            }

                            // Calculate total hours text with seconds
                            const totalSeconds = session.accumulated_seconds || 0;
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            const totalTimeText = totalSeconds > 0
                                ? `${hours}h ${minutes}m ${seconds}s`
                                : '--';

                            return (
                                <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 border-r border-slate-100 dark:border-slate-700/50">
                                        {capitalize(format(dateObj, 'EEEE', { locale: es }))}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700/50">
                                        {format(dateObj, 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-100 dark:border-slate-700/50">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700/50">
                                        {checkIn ? format(checkIn, 'HH:mm:ss') : '--:--:--'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700/50">
                                        {checkOut ? format(checkOut, 'HH:mm:ss') : '--:--:--'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">
                                        {totalTimeText}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    {/* Fill with empty rows if needed to look like the design, but scroll is sufficient */}
                </tbody>
            </table>
        </div>
    );
}
