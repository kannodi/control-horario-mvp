'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DayData {
    name: string;
    hours: number;
    date: string;
}

interface DailyBarChartProps {
    data: DayData[];
    targetHours?: number;
}

export function DailyBarChart({ data, targetHours = 8 }: DailyBarChartProps) {
    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                        domain={[0, 12]}
                        width={35}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '13px'
                        }}
                        formatter={(value: any) => [`${Number(value).toFixed(1)}h`, 'Horas']}
                        labelFormatter={(label) => `${label}`}
                    />
                    <ReferenceLine
                        y={targetHours}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{
                            value: `Meta ${targetHours}h`,
                            position: 'right',
                            fill: '#10b981',
                            fontSize: 11
                        }}
                    />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.hours >= targetHours ? '#3b82f6' : entry.hours > 0 ? '#93c5fd' : '#e2e8f0'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
