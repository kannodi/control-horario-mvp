-- =====================================================
-- LIMPIEZA DE DATOS (RESET)
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para borrar
-- todas las sesiones y pausas corruptas.
-- NO borra los usuarios, solo el historial de trabajo.
-- =====================================================

TRUNCATE TABLE public.breaks CASCADE;
TRUNCATE TABLE public.work_sessions CASCADE;

-- Si también quieres borrar los perfiles de usuario y empezar de cero absoluto:
-- TRUNCATE TABLE public.profiles CASCADE;

-- =====================================================
-- Una vez ejecutado:
-- 1. Vuelve a la aplicación
-- 2. Recarga la página (F5)
-- 3. Intenta iniciar jornada de nuevo
-- =====================================================
