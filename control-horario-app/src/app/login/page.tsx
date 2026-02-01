'use client';

import { useRouter } from 'next/navigation';
import { Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            router.push('/dashboard');
            router.refresh(); // Refrescar para que el middleware actualice cookies
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
            setLoading(false);
        }
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

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 !bg-white !text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-slate-700 dark:placeholder-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 !bg-white !text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-slate-700 dark:placeholder-slate-400"
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
                    ¿No tienes cuenta? <Link href="/register" className="text-blue-600 font-medium cursor-pointer hover:underline">Regístrate gratis</Link>
                </div>
            </div>
        </div>
    );
}
