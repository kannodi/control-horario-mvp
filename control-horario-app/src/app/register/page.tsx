'use client';

import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Pass full_name in metadata - the DB trigger will use it
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (authError) throw authError;

            // Profile is created automatically by the DB trigger (handle_new_user)
            // No need to manually insert into profiles table

            router.push('/login?message=Cuenta creada. Revisa tu email para confirmar.');
        } catch (err: any) {
            setError(err.message || 'Error al crear la cuenta');
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-blue-100 rounded-xl mb-4 text-blue-600">
                        <UserPlus className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Crear Cuenta</h1>
                    <p className="text-slate-500 mt-2">Únete a TimeMaster hoy mismo</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Juan Pérez"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 !bg-white !text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-slate-700 dark:placeholder-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="juan@ejemplo.com"
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
                            'Registrarse'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 font-medium cursor-pointer hover:underline">Inicia sesión</Link>
                </div>
            </div>
        </div>
    );
}
