'use client';

import { useRouter } from 'next/navigation';
import { Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

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
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-50">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800" padding="lg">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-indigo-500/10 rounded-xl mb-4 text-indigo-400">
                        <Clock className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Bienvenido a TimeMaster</h1>
                    <p className="text-slate-400 mt-2">Inicia sesión para registrar tu jornada</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-3 text-sm animate-in fade-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        type="submit"
                        disabled={loading}
                        fullWidth
                        size="lg"
                    >
                        {loading ? 'Cargando...' : 'Ingresar'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    ¿No tienes cuenta? <Link href="/register" className="text-indigo-400 font-medium cursor-pointer hover:text-indigo-300 hover:underline">Regístrate gratis</Link>
                </div>
            </Card>
        </div>
    );
}
