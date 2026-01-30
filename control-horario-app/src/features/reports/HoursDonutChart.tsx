'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface HoursDonutChartProps {
    workedHours: number;
    breakHours: number;
    targetHours: number;
}

export function HoursDonutChart({ workedHours, breakHours, targetHours }: HoursDonutChartProps) {
    const total = workedHours + breakHours;
    const effectiveTarget = Math.max(targetHours, total, 1);
    const remainingHours = Math.max(0, effectiveTarget - total);

    const data = [
        { name: 'Horas Trabajadas', value: workedHours, color: '#3b82f6' },
        { name: 'Tiempo en Pausas', value: breakHours, color: '#f59e0b' },
        { name: 'Tiempo Restante', value: remainingHours, color: '#e2e8f0' },
    ].filter(item => item.value > 0);

    const formatValue = (value: number) => {
        const h = Math.floor(value);
        const m = Math.round((value - h) * 60);
        return `${h}h ${m}m`;
    };

    const getPercentage = (value: number) => {
        const pct = effectiveTarget > 0 ? (value / effectiveTarget) * 100 : 0;
        return Math.round(pct);
    };

    // Calculate main percentage for center
    const mainPercentage = getPercentage(workedHours);

    return (
        <div className="flex flex-col h-[300px] w-full min-h-[300px]">
             {/* Chart container */}
             <div className="relative flex-1 min-h-[250px]">
                 {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{mainPercentage}%</p>
                        <p className="text-xs text-slate-500">del objetivo</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any, name: any) => [
                                `${formatValue(value)} (${getPercentage(value)}%)`,
                                name
                            ]}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '14px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom legend inside the component */}
            <div className="flex flex-wrap justify-center gap-4 mt-2 pb-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-slate-500">
                            {item.name} <span className="font-semibold">({getPercentage(item.value)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
