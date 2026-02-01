-- =====================================================
-- DIAGNÓSTICO DE PERFIL DE USUARIO
-- =====================================================
-- Ejecuta este script para ver si tu usuario actual tiene
-- un perfil creado en la tabla 'profiles'.
-- Si el resultado es 0 filas, ese es el problema.
-- =====================================================

SELECT * FROM public.profiles 
WHERE id = auth.uid();

-- Si esto no devuelve nada, significa que el registro falló
-- o que el usuario se creó antes de que existiera la tabla.

-- SOLUCIÓN:
-- Si no hay perfil, ejecuta esto reemplazando 'TU_EMAIL'
-- y 'TU_NOMBRE' con tus datos reales.
-- (Pero primero intenta cerrar sesión y volver a registrarte en la app)
