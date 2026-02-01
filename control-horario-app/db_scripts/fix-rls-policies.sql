-- =====================================================
-- DIAGNÓSTICO Y SOLUCIÓN DE ERRORES
-- =====================================================
-- Ejecuta estos queries uno por uno en Supabase SQL Editor
-- para diagnosticar y solucionar los problemas
-- =====================================================

-- PASO 1: Verificar si hay usuarios en profiles
-- Ejecuta esto primero para ver si hay datos
SELECT * FROM public.profiles;

-- Si está vacío, ese es el problema principal.
-- Los usuarios se registraron antes de que existiera la tabla.

-- =====================================================
-- PASO 2: Verificar políticas RLS
-- =====================================================

-- Ver políticas actuales de profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Ver políticas actuales de work_sessions
SELECT * FROM pg_policies WHERE tablename = 'work_sessions';

-- Ver políticas actuales de breaks
SELECT * FROM pg_policies WHERE tablename = 'breaks';

-- =====================================================
-- PASO 3: SOLUCIÓN - Crear/Recrear políticas RLS
-- =====================================================

-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can view own breaks" ON public.breaks;
DROP POLICY IF EXISTS "Users can insert own breaks" ON public.breaks;
DROP POLICY IF EXISTS "Users can update own breaks" ON public.breaks;
DROP POLICY IF EXISTS "Users can delete own breaks" ON public.breaks;

-- Asegurar que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- Crear políticas para profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Crear políticas para work_sessions
CREATE POLICY "Users can view own sessions"
    ON public.work_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON public.work_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON public.work_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON public.work_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Crear políticas para breaks
CREATE POLICY "Users can view own breaks"
    ON public.breaks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions
            WHERE work_sessions.id = breaks.work_session_id
            AND work_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own breaks"
    ON public.breaks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.work_sessions
            WHERE work_sessions.id = breaks.work_session_id
            AND work_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own breaks"
    ON public.breaks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions
            WHERE work_sessions.id = breaks.work_session_id
            AND work_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own breaks"
    ON public.breaks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions
            WHERE work_sessions.id = breaks.work_session_id
            AND work_sessions.user_id = auth.uid()
        )
    );

-- =====================================================
-- PASO 4: Verificar que las políticas se crearon
-- =====================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'work_sessions', 'breaks')
ORDER BY tablename, policyname;

-- =====================================================
-- RESULTADO ESPERADO:
-- Deberías ver 11 políticas en total:
-- - 3 para profiles (SELECT, UPDATE, INSERT)
-- - 4 para work_sessions (SELECT, INSERT, UPDATE, DELETE)
-- - 4 para breaks (SELECT, INSERT, UPDATE, DELETE)
-- =====================================================
