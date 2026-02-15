'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Play, Pause, Square, LogOut, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { fetchLocationInfo } from '@/services/externalApi';
import type { LocationInfo } from '@/types';
import { LocationCard } from '@/features/dashboard/LocationCard';
import { StatusCard, StartTimeCard, WorkHoursCard } from '@/features/dashboard/DashboardCards';

type SessionStatus = 'active' | 'paused' | 'completed';

interface SessionData {
  id: string;
  status: SessionStatus;
  check_in: string;
  breaks: any[];
  total_minutes?: number;
}

export default function DashboardClient() {
  const supabase = createClient();
  const router = useRouter();
  const isLocationFetching = useRef(false);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; company_id: string | null } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Location state
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, company_id')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Get today's latest session (active, paused, or completed)
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionData } = await supabase
        .from('work_sessions')
        .select('*, breaks(*)')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionData) {
        setSession(sessionData);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  // Fetch location info
  const getLocation = useCallback(
    async (force = false) => {
      if (isLocationFetching.current && !force) return;

      try {
        isLocationFetching.current = true;
        setLocationLoading(true);
        setLocationError(null);

        const data = await fetchLocationInfo();
        setLocation(data);
      } catch (err) {
        console.error('Location fetch error:', err);
        const message = err instanceof Error ? err.message : 'Error desconocido al cargar ubicación';

        if (message.includes('429')) {
          setLocationError('Límite de peticiones alcanzado. Por favor, intenta más tarde.');
        } else {
          setLocationError('No se pudo obtener la ubicación. Verifica tu conexión.');
        }
      } finally {
        setLocationLoading(false);
        isLocationFetching.current = false;
      }
    },
    []
  );

  useEffect(() => {
    fetchData();
    getLocation();
  }, [fetchData, getLocation]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      if (!session || !session.check_in) {
        setElapsedSeconds(0);
        return;
      }

      const start = new Date(session.check_in).getTime();
      const now = new Date().getTime();

      // Calculate break duration
      const totalBreaksMs =
        session.breaks?.reduce((acc: number, b: any) => {
          if (b.break_end && b.break_start) {
            return acc + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime());
          }
          // If currently paused, add current break duration so far to the deduction
          // effectively freezing the "worked" timer
          if (!b.break_end && b.break_start && session.status === 'paused') {
            return acc + (now - new Date(b.break_start).getTime());
          }
          return acc;
        }, 0) || 0;

      setElapsedSeconds(Math.floor((now - start - totalBreaksMs) / 1000));
    };

    if (session?.status === 'active') {
      updateTimer(); // Initial update
      interval = setInterval(updateTimer, 1000);
    } else if (session?.status === 'paused') {
      updateTimer(); // Update once to show correct frozen time
    } else {
      setElapsedSeconds(0);
    }

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartDay = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('work_sessions')
        .insert({
          user_id: user.id,
          company_id: profile?.company_id || 'comp_default', // Use default if profile not loaded
          date: new Date().toISOString().split('T')[0],
          check_in: new Date().toISOString(),
          status: 'active',
        })
        .select('*, breaks(*)')
        .single();

      if (error) {
        console.error('Supabase insert error details:', error);
        throw error;
      }
      setSession(data);
      getLocation(true);
    } catch (error) {
      console.error('Error starting day:', error);
      alert('Error al iniciar jornada. Por favor intente de nuevo.');
    }
  };

  const handlePauseSession = async () => {
    if (!session) return;
    try {
      // 1. Update session status
      const { error: statusError } = await supabase
        .from('work_sessions')
        .update({ status: 'paused' })
        .eq('id', session.id);

      if (statusError) throw statusError;

      // 2. Insert new break record
      const { error: breakError } = await supabase
        .from('breaks')
        .insert({
          work_session_id: session.id,
          break_start: new Date().toISOString(),
        });

      if (breakError) throw breakError;

      // 3. Refresh session data (including breaks)
      const { data, error: refreshError } = await supabase
        .from('work_sessions')
        .select('*, breaks(*)')
        .eq('id', session.id)
        .single();

      if (refreshError) throw refreshError;
      setSession(data);
      setSession(data);
    } catch (error) {
      console.error('Error pausing session:', error);
      alert('Error al pausar sesión.');
    }
  };

  const handleResumeSession = async () => {
    if (!session) return;
    try {
      const breaks = session.breaks || [];
      const lastBreakIndex = breaks.length - 1;

      // 1. Find the active break and update its end time
      // Search for a break with no break_end
      const activeBreak = session.breaks.find((b: any) => !b.break_end);

      if (activeBreak) {
        const { error: breakError } = await supabase
          .from('breaks')
          .update({ break_end: new Date().toISOString() })
          .eq('id', activeBreak.id);

        if (breakError) throw breakError;
      }

      // 2. Update session status back to active
      const { data, error } = await supabase
        .from('work_sessions')
        .update({ status: 'active' })
        .eq('id', session.id)
        .select('*, breaks(*)')
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error) {
      console.error('Error resuming session:', error);
      alert('Error al reanudar sesión.');
    }
  };

  const handleStopSession = async () => {
    if (!session) return;
    try {
      const now = new Date();
      const checkOutTime = now.toISOString();
      let finalTotalMinutes = 0;

      if (session.check_in) {
        const start = new Date(session.check_in).getTime();
        const end = now.getTime();

        let totalBreaksMs = (session.breaks || []).reduce((acc: number, b: any) => {
          if (b.break_end && b.break_start) {
            return acc + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime());
          }
          return acc;
        }, 0);

        if (session.status === 'paused') {
          const lastBreak = session.breaks[session.breaks.length - 1];
          if (lastBreak && lastBreak.break_start && !lastBreak.break_end) {
            totalBreaksMs += (now.getTime() - new Date(lastBreak.break_start).getTime());
          }
        }

        const workedMs = Math.max(0, end - start - totalBreaksMs);
        finalTotalMinutes = Math.floor(workedMs / 1000 / 60);
      }

      const { data, error } = await supabase
        .from('work_sessions')
        .update({
          status: 'completed',
          check_out: checkOutTime,
          total_minutes: finalTotalMinutes
        })
        .eq('id', session.id)
        .select('*, breaks(*)')
        .single();

      if (error) throw error;
      setSession(data);
      setElapsedSeconds(0);
      getLocation(true);
    } catch (error) {
      console.error('Error stopping session:', error);
      alert('Error al finalizar jornada.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex gap-2">
          {!session || session.status === 'completed' ? (
            <Button onClick={handleStartDay} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Jornada
            </Button>
          ) : (
            <>
              {session.status === 'active' ? (
                <Button onClick={handlePauseSession} variant="secondary" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button onClick={handleResumeSession} variant="secondary" className="border-green-200 text-green-700 hover:bg-green-50">
                  <Play className="w-4 h-4 mr-2" />
                  Reanudar
                </Button>
              )}
              <Button onClick={handleStopSession} variant="danger" className="shadow-lg shadow-red-500/20">
                <Square className="w-4 h-4 mr-2" />
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg" className="flex flex-col items-center justify-center min-h-[300px] border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm rounded-xl relative overflow-hidden">
            <div className={`w-72 h-72 rounded-full flex items-center justify-center border-8 transition-colors ${session?.status === 'active' ? 'border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10' :
              session?.status === 'paused' ? 'border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10' :
                'border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50'
              }`}>
              <div className="text-center z-10">
                <span className="text-7xl font-mono font-bold tracking-tighter text-slate-900 dark:text-white block mb-4 filter drop-shadow-sm">
                  {formatTime(elapsedSeconds)}
                </span>
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                  {session?.status === 'active' ? <Clock className="w-5 h-5 animate-pulse text-indigo-500" /> : <Clock className="w-5 h-5" />}
                  <span className="text-base font-medium uppercase tracking-wider">
                    {session?.status === 'active' ? 'En curso' : session?.status === 'paused' ? 'Pausado' : 'Sin actividad'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <LocationCard
            location={location}
            loading={locationLoading}
            error={locationError}
            onRetry={() => getLocation(true)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 content-start">
          <div className="h-40">
            <StatusCard status={session?.status} />
          </div>
          <div className="h-40">
            <StartTimeCard checkInTime={session?.check_in} />
          </div>
          <div className="h-40">
            <WorkHoursCard status={session?.status} totalMinutes={session?.total_minutes || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
