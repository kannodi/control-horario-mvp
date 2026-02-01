-- =====================================================
-- REPARACIÓN DE PERFILES FALTANTES
-- =====================================================
-- Este script busca todos los usuarios registrados en Authentication
-- que NO tienen un perfil en la tabla 'profiles' y se lo crea automáticamente.
-- =====================================================

INSERT INTO public.profiles (id, full_name, role, company_id)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name, -- Usa el nombre o el email
    'user' as role, 
    'comp_default' as company_id
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Confirmación del resultado
SELECT count(*) as perfiles_creados FROM public.profiles;

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecuta esto en Supabase SQL Editor
-- 2. Vuelve a la app y prueba "Iniciar Jornada"
-- =====================================================
