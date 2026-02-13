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
          company_id: profile?.company_id || '', // Required by DB
          date: new D
