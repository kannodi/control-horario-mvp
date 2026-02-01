-- =====================================================
-- CONFIGURACIÓN COMPLETA Y DEFINITIVA (TimeMaster App)
-- =====================================================
-- Este script realiza TODO el trabajo necesario para dejar
-- la base de datos funcionando perfectamente:
-- 1. Crea las tablas si no existen.
-- 2. Configura todas las políticas de seguridad (RLS).
-- 3. Crea un TRIGGER automático para nuevos usuarios.
-- 4. Repara los usuarios existentes que no tienen perfil.
-- =====================================================

-- -----------------------------------------------------
-- 1. TABLAS (Estructura)
-- -----------------------------------------------------

-- Tabla: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    company_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: work_sessions
CREATE TABLE IF NOT EXISTS public.work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    total_minutes INTEGER DEFAULT 0,
    accumulated_seconds INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: breaks
CREATE TABLE IF NOT EXISTS public.breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
    break_start TIMESTAMP WITH TIME ZONE NOT NULL,
    break_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON public.work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON public.work_sessions(date);
CREATE INDEX IF NOT EXISTS idx_breaks_session_id ON public.breaks(work_session_id);

-- -----------------------------------------------------
-- 2. POLÍTICAS DE SEGURIDAD (Row Level Security)
-- -----------------------------------------------------

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas viejas para evitar duplicados
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

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para work_sessions
CREATE POLICY "Users can view own sessions" ON public.work_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.work_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.work_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.work_sessions FOR DELETE USING (auth.uid() = user_id);

-- Políticas para breaks
CREATE POLICY "Users can view own breaks" ON public.breaks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.work_sessions WHERE id = breaks.work_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own breaks" ON public.breaks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.work_sessions WHERE id = breaks.work_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own breaks" ON public.breaks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.work_sessions WHERE id = breaks.work_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own breaks" ON public.breaks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.work_sessions WHERE id = breaks.work_session_id AND user_id = auth.uid())
);

-- -----------------------------------------------------
-- 3. AUTOMATIZACIÓN (Triggers)
-- -----------------------------------------------------
-- Esto asegura que CADA VEZ que alguien se registre,
-- se cree su perfil automáticamente.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, company_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'user',
    'comp_default'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borrar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------
-- 4. REPARACIÓN DE DATOS (Backfill)
-- -----------------------------------------------------
-- Detecta usuarios que ya existen pero no tienen perfil
-- y se los crea ahora mismo.

INSERT INTO public.profiles (id, full_name, role, company_id)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email),
    'user', 
    'comp_default'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
