# 🕐 Proyecto Colaborativo - Control Horario (TimeMaster)

Aplicación de control de jornada laboral desarrollada como proyecto colaborativo utilizando herramientas de IA (Antigravity/Gemini CLI).

## 📋 Descripción

**TimeMaster** es una aplicación web que permite a los empleados registrar su jornada laboral:
- ✅ Inicio y fin de jornada
- ✅ Pausas y descansos
- ✅ Historial de registros
- ✅ Reportes y estadísticas
- ✅ Panel de administración

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| **Next.js 14** | Framework React con App Router |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos y diseño |
| **Supabase** | Backend (Auth + PostgreSQL + RLS) |

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Supabase (para la base de datos)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/RensoAbraham/proyecto-colaborativo-antigravity.git
cd proyecto-colaborativo-antigravity

# 2. Ir a la carpeta de la aplicación
cd control-horario-app

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env.local
```

### Configurar Supabase

Edita `.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build de Producción

```bash
npm run build
npm start
```

---

## 📁 Estructura del Proyecto

```
proyecto-colaborativo-antigravity/
├── README.md                      # Este archivo
├── control-horario-app/           # Aplicación principal
│   ├── src/
│   │   ├── app/                   # Rutas (Next.js App Router)
│   │   ├── components/            # Componentes de UI
│   │   ├── features/              # Módulos por funcionalidad
│   │   ├── lib/                   # Configuración y utilidades
│   │   ├── services/              # Servicios de datos
│   │   └── types/                 # Tipos TypeScript
│   ├── docs/                      # Documentación técnica
│   ├── db_scripts/                # Scripts SQL para Supabase
│   └── README.md                  # Documentación de la app
├── evidence/                      # Capturas de evidencia de IA
├── .agent/skills/                 # Skills de desarrollo para IA
└── *.md                           # Documentación adicional
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Doc-Especificaciones.md](Doc-Especificaciones.md) | Especificaciones del proyecto |
| [Senior-Code-Review.md](Senior-Code-Review.md) | Revisión de código |
| [Auditoria-Profunda.md](Auditoria-Profunda.md) | Auditoría del sistema |
| [control-horario-app/docs/](control-horario-app/docs/) | Documentación técnica |

---

## 👥 Equipo

Proyecto desarrollado colaborativamente utilizando herramientas de IA:
- **Antigravity** (Gemini CLI)
- **GitHub Copilot**
---

## 📝 Licencia

Este proyecto es parte de un ejercicio académico/colaborativo.
