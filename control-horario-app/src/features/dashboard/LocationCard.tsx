'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Globe, Server, Hash, Minimize2, RefreshCcw } from 'lucide-react';
import { LocationInfo } from '@/types';

interface LocationCardProps {
    location: LocationInfo | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

export function LocationCard({ location, loading, error, onRetry }: LocationCardProps) {
    return (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden" padding="none">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm">Ubicación actual</h3>
            </div>
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-4 text-slate-500 gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Cargando ubicación...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg flex items-center gap-2">
                            <span className="flex-1">{error}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            className="text-xs text-slate-500 hover:text-indigo-500"
                        >
                            <RefreshCcw className="w-3 h-3 mr-1" />
                            Reintentar ahora
                        </Button>
                    </div>
                ) : location ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ciudad / Región</p>
                                    <p className="text-sm font-medium">{location.city}, {location.region}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <Server className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">País</p>
                                    <p className="text-sm font-medium">{location.country_name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <Hash className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dirección IP</p>
                                    <p className="text-sm font-medium">{location.ip}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <Minimize2 className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Zona Horaria</p>
                                    <p className="text-sm font-medium">{location.timezone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </Card>
    );
}
