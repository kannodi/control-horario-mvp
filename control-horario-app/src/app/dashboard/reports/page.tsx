'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { ReportsStats } from '@/features/reports/ReportsStats';
import { HoursDonutChart } from '@/features/reports/HoursDonutChart';
import { DailyBarChart } from '@/features/reports/DailyBarChart';
import { MonthlyAreaChart } from '@/features/reports/MonthlyAreaChart';
import { ReportsTable } from '@/features/reports/ReportsTable';
import { TimeTrackingService } from '@/services/time-tracking.service';
import { WorkSession } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const TARGET_HOURS = 8;

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ReportsPage() {
    const [sessions, setSessions] = useState<WorkSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await TimeTrackingService.getHistory(selectedMonth, selectedYear);
                // Filter only completed sessions with at least 1 minute of work
                const completedSessions = data.filter(s => s.status === 'completed' && s.total_minutes >= 1);
                setSessions(completedSessions);
            } catch (err) {
                console.error('Error fetching reports data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedMonth, selectedYear]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalMinutes = sessions.reduce((acc, s) => acc + s.total_minutes, 0);
        const totalHours = totalMinutes / 60;
        const totalBreaks = sessions.reduce((acc, s) => acc + s.breaks.length, 0);
        const workDays = new Set(sessions.map(s => s.date)).size;
        const averageHours = workDays > 0 ? totalHours / workDays : 0;

        return { totalHours, averageHours, totalBreaks, workDays };
    }, [sessions]);

    // Prepare data for donut chart
    const donutData = useMemo(() => {
        const totalBreakMinutes = sessions.reduce((acc, s) =>
            acc + s.breaks.reduce((b, br) => b + br.duration_minutes, 0), 0
        );
        return {
            workedHours: stats.totalHours,
            breakHours: totalBreakMinutes / 60,
            targetHours: stats.workDays * TARGET_HOURS
        };
    }, [sessions, stats]);

    // Prepare daily bar chart data - show LAST complete week (Mon-Sun, but only Mon-Fri has data)
    const dailyChartData = useMemo(() => {
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        // Get LAST week's Monday
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        const lastMondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek + 6;

        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - lastMondayOffset);

        // Generate 7 days (Mon-Sun), only Mon-Fri will have data
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(lastMonday);
            date.setDate(lastMonday.getDate() + i);
            return date;
        });

        return weekDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const session = sessions.find(s => s.date === dateStr);
            return {
                name: dayNames[index],
                hours: session ? session.total_minutes / 60 : 0,
                date: dateStr
            };
        });
    }, [sessions]);

    // Prepare monthly area chart data (weekly totals) - Sem 1, 2, 3, 4
    const monthlyChartData = useMemo(() => {
        // Always return 4 weeks with proper numbering (Sem 1-4)
        const weeks: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

        sessions.forEach(session => {
            const date = parseISO(session.date);
            // Get which week of the MONTH this date falls in (1-4)
            const dayOfMonth = date.getDate();
            const weekOfMonth = Math.ceil(dayOfMonth / 7);
            const clampedWeek = Math.min(weekOfMonth, 4);
            weeks[clampedWeek] = (weeks[clampedWeek] || 0) + session.total_minutes / 60;
        });

        return [
            { week: 'Sem 1', hours: parseFloat(weeks[1].toFixed(1)) },
            { week: 'Sem 2', hours: parseFloat(weeks[2].toFixed(1)) },
            { week: 'Sem 3', hours: parseFloat(weeks[3].toFixed(1)) },
            { week: 'Sem 4', hours: parseFloat(weeks[4].toFixed(1)) },
        ];
    }, [sessions]);

    // Export to CSV
    const exportToCSV = () => {
        if (sessions.length === 0) return;

        const headers = ['Fecha', 'Día', 'Hora Entrada', 'Hora Salida', 'Horas Trabajadas', 'Pausas', 'Rendimiento'];
        const rows = sessions.map(session => {
            const hours = session.total_minutes / 60;
            const performance = hours >= TARGET_HOURS ? 'Excelente' : hours >= TARGET_HOURS * 0.8 ? 'Bueno' : 'Regular';
            return [
                session.date,
                format(parseISO(session.date), 'EEEE', { locale: es }),
                session.check_in ? format(parseISO(session.check_in), 'HH:mm') : '',
                session.check_out ? format(parseISO(session.check_out), 'HH:mm') : '',
                hours.toFixed(2),
                session.breaks.length,
                performance
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_${MONTHS[selectedMonth]}_${selectedYear}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Cargando reportes...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Reportes 📊
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
                        Analiza tu rendimiento y productividad laboral.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Month/Year Selector */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer"
                        >
                            {MONTHS.map((month, index) => (
                                <option key={month} value={index} className="dark:bg-slate-800">{month}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year} className="dark:bg-slate-800">{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={exportToCSV}
                        disabled={sessions.length === 0}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                        <FileSpreadsheet className="w-4 h-4 sm:hidden" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <ReportsStats
                totalHours={stats.totalHours}
                averageHours={stats.averageHours}
                totalBreaks={stats.totalBreaks}
                workDays={stats.workDays}
                targetHours={TARGET_HOURS}
            />

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Donut Chart */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Distribución de Tiempo
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Horas trabajadas vs pausas del período
                    </p>
                    <div className="h-[280px]">
                        <HoursDonutChart
                            workedHours={donutData.workedHours}
                            breakHours={donutData.breakHours}
                            targetHours={donutData.targetHours}
                        />
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Horas por Día
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Semana actual - Meta: {TARGET_HOURS}h diarias
                    </p>
                    <div className="h-[280px]">
                        <DailyBarChart data={dailyChartData} targetHours={TARGET_HOURS} />
                    </div>
                </div>
            </div>

            {/* Area Chart - Monthly Trend */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Tendencia Mensual
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Total de horas trabajadas por semana en {MONTHS[selectedMonth]}
                </p>
                <div className="h-[300px]">
                    <MonthlyAreaChart data={monthlyChartData} />
                </div>
            </div>

            {/* Table */}
            <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Detalle de Jornadas
                </h2>
                <ReportsTable sessions={sessions} targetHours={TARGET_HOURS} />
            </div>
        </div>
    );
}
