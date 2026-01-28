'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate login delay
        setTimeout(() => {
            router.push('/dashboard');
        }, 800);
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-blue-100 rounded-xl mb-4 text-blue-600">
                        <Clock className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Bienvenido a TimeMaster</h1>
                    <p className="text-slate-500 mt-2">Inicia sesión para registrar tu jornada</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            defaultValue="alex@techsolutions.com"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            defaultValue="password"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-70 flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Ingresar'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    ¿No tienes cuenta? <span className="text-blue-600 font-medium cursor-pointer">Regístrate gratis</span>
                </div>
            </div>
        </div>
    );
}
