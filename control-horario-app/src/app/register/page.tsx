'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

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

            router.push('/login?message=Cuenta creada. Revisa tu email para confirmar.');
        } catch (err: any) {
            setError(err.message || 'Error al crear la cuenta');
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-50">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800" padding="lg">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-indigo-500/10 rounded-xl mb-4 text-indigo-400">
                        <UserPlus className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Crear Cuenta</h1>
                    <p className="text-slate-400 mt-2">Únete a TimeMaster hoy mismo</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-3 text-sm animate-in fade-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <Input
                        label="Nombre Completo"
                        type="text"
                        placeholder="Juan Pérez"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
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
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    ¿Ya tienes cuenta? <Link href="/login" className="text-indigo-400 font-medium cursor-pointer hover:text-indigo-300 hover:underline">Inicia sesión</Link>
                </div>
            </Card>
        </div>
    );
}
