# **10\. Requerimiento Obligatorio: Diseño Responsive**

La aplicación deberá ser completamente responsive y optimizada para:

- 📱 Dispositivos móviles (Mobile First)

- 📲 Tablets

- 💻 Escritorio

- 🖥 Pantallas grandes

## **Criterios obligatorios**

- Diseño Mobile First.

- Uso de unidades relativas (rem, %, vw, vh).

- Breakpoints definidos (ejemplo):
  - 640px (mobile)

  - 768px (tablet)

  - 1024px (desktop)

  - 1280px+ (wide)

- Componentes adaptativos:
  - Sidebar colapsable en móvil.

  - Botones full-width en móvil.

  - Tablas transformadas en cards en pantallas pequeñas.

  - Gráficos redimensionables automáticamente.

  - Navbar adaptable.

No se aceptará diseño que solo “reduzca tamaño”. Debe reorganizar layout.

---

# **11\. Experiencia de Usuario (UX)**

## **Flujo del Usuario Final**

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

## **Dashboard (Vista Principal)**

Debe incluir:

- Estado actual (Activo / En pausa / Finalizado)

- Temporizador en tiempo real

- Botón dinámico:
  - Iniciar jornada

  - Iniciar pausa

  - Finalizar pausa

  - Finalizar jornada

- Resumen del día:
  - Horas trabajadas

  - Tiempo en pausas

- Gráfico semanal

---

# **12\. Validaciones del Sistema**

## **Validaciones críticas**

- No permitir:
  - Iniciar jornada si ya hay una activa.

  - Finalizar pausa si no está en pausa.

  - Iniciar pausa sin jornada activa.

  - Finalizar jornada sin check-in.

- Manejo de errores claro:
  - Mensajes descriptivos

  - No errores técnicos visibles al usuario

---

# **13\. Reglas de Negocio**

1. Solo una jornada activa por usuario.

2. Las pausas deben pertenecer a una jornada válida.

3. Todos los timestamps en UTC.

4. Cálculos deben realizarse en backend o función segura.

5. No confiar en datos enviados desde frontend para cálculos finales.

---

# **14\. Seguridad (Nivel Comercial)**

- RLS activado en todas las tablas.

- Cada usuario solo puede ver sus registros.

- Admin puede ver registros de usuarios bajo su empresa.

- Validaciones adicionales en Supabase Policies.

- Protección contra manipulación de total_minutes.

---

# **15\. Estrategia Comercial**

## **Modelo de Negocio**

- Plan Free:
  - 1 usuario

  - Reportes básicos

  - Exportación CSV

- Plan Pro:
  - Usuarios ilimitados

  - Panel admin

  - Reportes avanzados

  - Exportación PDF

  - Soporte prioritario

- Plan Empresa:
  - Multiempresa

  - API

  - Integraciones

  - SLA personalizado

---

# **16\. Roadmap Técnico**

## **Fase 1 (MVP Comercial)**

- Autenticación

- Registro de jornada

- Pausas

- Dashboard

- Reportes básicos

- Responsive completo

- Panel admin básico

## **Fase 2**

- Multiempresa

- Facturación

- Roles avanzados

- Exportación PDF

- Notificaciones

- Geolocalización

## **Fase 3**

- App móvil

- API pública

- Integración con nómina

- Firma digital

---

# **17\. Consideraciones Técnicas de Escalabilidad**

- Diseño multi-tenant desde inicio (aunque no se active).

- Tabla companies preparada.

- Campo company_id en:
  - profiles

  - work_sessions

- Índices compuestos (user_id \+ date).

- Preparación para paginación en reportes.

---

# **18\. Tabla Adicional (Preparación Multiempresa)**

## **companies**

- id (uuid)

- name

- plan_type

- created_at

---

# **19\. Métricas del Producto**

- Usuarios activos diarios

- Tiempo promedio de sesión

- Horas registradas por empresa

- Retención mensual

- Tasa de conversión Free → Pro

---

# **20\. Criterios de Aceptación**

El sistema se considerará listo para producción cuando:

- ✔ Registro de jornada sin errores

- ✔ Cálculo correcto en múltiples pausas

- ✔ Responsive funcional en móvil real

- ✔ RLS probado con múltiples usuarios

- ✔ Reportes exportables funcionando

- ✔ Validaciones completas

---

# **21\. Estructura Final de Proyecto (Confirmación Profesional)**

`/control-horario-app`  
`│`  
`├── public/`  
`│   ├── images/`  
`│   ├── icons/`  
`│   └── favicon.ico`  
`│`  
`├── src/`  
`│   ├── app/`  
`│   ├── components/`  
`│   ├── features/`  
`│   ├── lib/`  
`│   ├── hooks/`  
`│   ├── services/`  
`│   ├── types/`  
`│   ├── styles/`  
`│   └── middleware.ts`  
`│`  
`├── .env.local`  
`├── package.json`  
`├── tsconfig.json`  
`└── README.md`

---

# **22\. Conclusión Técnica**

Este sistema:

- Está preparado para ser comercial.

- Es escalable.

- Está pensado como SaaS.

- Tiene base para multiempresa.

- Cumple principios de arquitectura moderna.

- Está preparado para crecimiento.
