# 📄 Especificación de Requerimientos

## Aplicación Web Comercial de Control y Gestión de Horarios Laborales

---

# 1. Introducción

## 1.1 Propósito

Este documento define los requerimientos funcionales, no funcionales y técnicos para el desarrollo de una aplicación web moderna de control horario orientada a uso comercial.

El sistema permitirá registrar jornadas laborales, gestionar pausas, calcular horas trabajadas y generar reportes visuales.

## 1.2 Alcance

La aplicación será un sistema SaaS (Software as a Service) accesible vía navegador web que permitirá:

- Registro de entrada y salida
- Gestión de pausas
- Cálculo automático de horas trabajadas
- Visualización de reportes
- Administración de usuarios
- Escalabilidad para múltiples empresas

## 1.3 Definiciones

- **Jornada:** Periodo entre check-in y check-out.
- **Pausa:** Intervalo dentro de una jornada que no cuenta como tiempo trabajado.
- **MVP:** Producto mínimo viable.
- **Multi-tenant:** Arquitectura que soporta múltiples empresas aisladas.

---

# 2. Visión del Producto

Aplicación SaaS dirigida a:

- Empresas pequeñas y medianas
- Equipos remotos
- Freelancers
- Startups

### Modelo comercial

- Plan gratuito limitado
- Plan Pro por usuario
- Plan Empresa

---

# 3. Arquitectura General

## 3.1 Frontend

- Next.js
- TypeScript obligatorio
- TailwindCSS
- Librería de gráficos (Recharts o Chart.js)

## 3.2 Backend

- Supabase
  - PostgreSQL
  - Supabase Auth
  - Row Level Security
- Edge Functions (fase 2)

## 3.3 Arquitectura

- SPA con App Router
- Separación por features
- Servicios desacoplados
- Cálculos críticos protegidos

---

# 4. Tipos de Usuario

## 4.1 Usuario estándar

- Registra jornadas
- Gestiona pausas
- Visualiza reportes propios

## 4.2 Administrador

- Visualiza usuarios
- Consulta jornadas
- Exporta datos
- Suspende cuentas

---

# 5. Requerimientos Funcionales

## RF-01 Autenticación

- Registro con email y contraseña
- Verificación de correo
- Recuperación de contraseña
- Cierre de sesión
- Gestión de perfil

## RF-02 Registro de Jornada

El sistema permitirá:

- Iniciar jornada (check-in)
- Finalizar jornada (check-out)
- Visualizar estado actual
- Temporizador en tiempo real

**Restricción:**  
Solo una jornada activa por usuario.

## RF-03 Gestión de Pausas

- Iniciar pausa
- Finalizar pausa
- Múltiples pausas por jornada
- Indicador visual de estado

## RF-04 Cálculo Automático

**Fórmula:**

`Horas trabajadas = (Salida - Entrada) - Total pausas`

- Precisión en minutos
- Manejo de múltiples pausas
- Soporte para jornadas cruzando medianoche

## RF-05 Historial

- Vista diaria
- Vista semanal
- Vista mensual
- Filtro por rango de fechas

## RF-06 Reportes

- Total horas trabajadas
- Promedio diario
- Total pausas
- Gráficos visuales
- Exportación CSV (MVP)
- Exportación PDF (fase 2)

## RF-07 Panel Administrativo

- Gestión de usuarios
- Filtro por fechas
- Visualización de jornadas
- Exportación de datos

---

# 6. Requerimientos No Funcionales

## RNF-01 Rendimiento

- Respuesta menor a 2 segundos
- Cálculos en tiempo real

## RNF-02 Seguridad

- RLS obligatorio
- HTTPS
- Validaciones backend
- Protección contra manipulación de datos

## RNF-03 Usabilidad

- Interfaz moderna
- Diseño intuitivo
- Feedback visual inmediato

## RNF-04 Escalabilidad

- Índices optimizados
- Preparado para miles de usuarios
- Preparado para multiempresa

## RNF-05 Disponibilidad

- Servicio 24/7
- Infraestructura dependiente de Supabase

---

# 7. Modelo de Datos

## Tabla: profiles

- id (uuid PK)
- full_name
- role (user/admin)
- company_id
- created_at

## Tabla: work_sessions

- id (uuid PK)
- user_id (uuid FK)
- company_id
- date (date)
- check_in (timestamp)
- check_out (timestamp)
- total_minutes (integer)
- status (active | paused | completed)
- created_at

**Índices:**

- user_id
- date
- user_id + date

## Tabla: breaks

- id (uuid PK)
- work_session_id (uuid FK)
- break_start (timestamp)
- break_end (timestamp)
- duration_minutes (integer)

---

# 8. Estados del Sistema

Una jornada puede estar en:

- ACTIVE
- PAUSED
- COMPLETED

No se permitirán estados inválidos.

---

# 9. Definición del MVP Comercial

Incluye:

- Autenticación
- Registro jornada
- Gestión pausas
- Dashboard
- Reportes básicos
- Exportación CSV
- Responsive completo
- Panel admin básico

---

# 10. Requerimiento Obligatorio: Diseño Responsive

La aplicación deberá ser completamente responsive y optimizada para:

- 📱 Dispositivos móviles (Mobile First)  
- 📲 Tablets  
- 💻 Escritorio  
- 🖥 Pantallas grandes  

## 10.1 Criterios obligatorios

- Diseño **Mobile First**.
- Uso de unidades relativas (`rem`, `%`, `vw`, `vh`).
- Breakpoints definidos:

  - `640px` (mobile)  
  - `768px` (tablet)  
  - `1024px` (desktop)  
  - `1280px+` (wide)  

- Componentes adaptativos:

  - Sidebar colapsable en móvil.
  - Botones full-width en móvil.
  - Tablas transformadas en cards en pantallas pequeñas.
  - Gráficos redimensionables automáticamente.
  - Navbar adaptable.

**No se aceptará diseño que solo reduzca tamaño. Debe reorganizar layout.**

---

# 11. Experiencia de Usuario (UX)

## 11.1 Flujo del Usuario Final

1. Login  
2. Dashboard  
3. Botón principal: “Iniciar Jornada”  
4. Estado visible en tiempo real  
5. Gestión de pausas  
6. Finalización  
7. Vista de reporte  

El flujo debe ser:

- Directo  
- Sin fricción  
- Máximo 2 clics para acciones principales  

---

## 11.2 Dashboard (Vista Principal)

Debe incluir:

- Estado actual (Activo / En pausa / Finalizado)
- Temporizador en tiempo real
- Botón dinámico que cambie según estado:

  - Iniciar jornada  
  - Iniciar pausa  
  - Finalizar pausa  
  - Finalizar jornada  

- Resumen del día:

  - Horas trabajadas  
  - Tiempo en pausas  

- Gráfico semanal

---

# 12. Validaciones del Sistema

## 12.1 Validaciones críticas

No permitir:

- Iniciar jornada si ya hay una activa.
- Finalizar pausa si no está en pausa.
- Iniciar pausa sin jornada activa.
- Finalizar jornada sin check-in.

## 12.2 Manejo de errores

- Mensajes descriptivos.
- No mostrar errores técnicos al usuario.
- Feedback visual inmediato.

---

# 13. Reglas de Negocio

1. Solo una jornada activa por usuario.
2. Las pausas deben pertenecer a una jornada válida.
3. Todos los timestamps deberán almacenarse en UTC.
4. Los cálculos deben realizarse en backend o función segura.
5. No confiar en datos enviados desde frontend para cálculos finales.

---

# 14. Seguridad (Nivel Comercial)

- RLS activado en todas las tablas.
- Cada usuario solo puede ver sus registros.
- El administrador puede ver registros de usuarios bajo su empresa.
- Validaciones adicionales en Supabase Policies.
- Protección contra manipulación de `total_minutes`.

---

# 15. Estrategia Comercial

## 15.1 Modelo de Negocio

### Plan Free
- 1 usuario
- Reportes básicos
- Exportación CSV

### Plan Pro
- Usuarios ilimitados
- Panel admin
- Reportes avanzados
- Exportación PDF
- Soporte prioritario

### Plan Empresa
- Multiempresa
- API
- Integraciones
- SLA personalizado

---

# 16. Roadmap Técnico

## Fase 1 (MVP Comercial)

- Autenticación
- Registro de jornada
- Gestión de pausas
- Dashboard
- Reportes básicos
- Responsive completo
- Panel admin básico

## Fase 2

- Multiempresa
- Facturación
- Roles avanzados
- Exportación PDF
- Notificaciones
- Geolocalización

## Fase 3

- App móvil
- API pública
- Integración con nómina
- Firma digital

---

# 17. Consideraciones Técnicas de Escalabilidad

- Diseño multi-tenant desde el inicio (aunque no se active).
- Tabla `companies` preparada.
- Campo `company_id` en:

  - `profiles`
  - `work_sessions`

- Índices compuestos (`user_id + date`).
- Preparación para paginación en reportes.

---

# 18. Tabla Adicional (Preparación Multiempresa)

## companies

- `id` (uuid)
- `name`
- `plan_type`
- `created_at`

---

# 19. Métricas del Producto

- Usuarios activos diarios
- Tiempo promedio de sesión
- Horas registradas por empresa
- Retención mensual
- Tasa de conversión Free → Pro

---

# 20. Criterios de Aceptación

El sistema se considerará listo para producción cuando:

- ✔ Registro de jornada sin errores
- ✔ Cálculo correcto con múltiples pausas
- ✔ Responsive funcional en móvil real
- ✔ RLS probado con múltiples usuarios
- ✔ Reportes exportables funcionando
- ✔ Validaciones completas

---

# 21. Estructura Final del Proyecto

/control-horario-app
│
├── public/
│ ├── images/
│ ├── icons/
│ └── favicon.ico
│
├── src/
│ ├── app/
│ ├── components/
│ ├── features/
│ ├── lib/
│ ├── hooks/
│ ├── services/
│ ├── types/
│ ├── styles/
│ └── middleware.ts
│
├── .env.local
├── package.json
├── tsconfig.json
└── README.md


---

# 22. Conclusión Técnica

Este sistema:

- Está preparado para ser comercial.
- Es escalable.
- Está pensado como SaaS.
- Tiene base para multiempresa.
- Cumple principios de arquitectura moderna.
- Está preparado para crecimiento.
