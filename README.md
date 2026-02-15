# Control Horario App - TimeMaster

Aplicación de control de jornada laboral construida con Next.js, React, Tailwind CSS y Supabase.

## 🚀 Getting Started

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase configurada

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🎨 Skills de Desarrollo

Este proyecto utiliza **Skills** (estándares de desarrollo) ubicadas en `.agent/skills/` para mantener consistencia y calidad en el código. A continuación se describen las skills disponibles:

### 📦 rpsfot-ui

**Ubicación:** `.agent/skills/rpsfot-ui/SKILL.md`

Estándares de desarrollo UI para el proyecto usando React y Tailwind CSS.

| Categoría | Directrices |
|-----------|-------------|
| **Stack** | React (solo componentes funcionales y Hooks), Tailwind CSS |
| **Colores Base** | Escala Slate/Zinc para fondos, Indigo/Violet como acentos |
| **Componentes** | Bordes redondeados (`rounded-lg`), estados hover/active/focus definidos |
| **Responsive** | Mobile First, uso de breakpoints `sm:`, `md:`, `lg:` |
| **Accesibilidad** | Elementos accesibles por teclado, contraste adecuado, HTML semántico |

**Tema Antigravity:**
- Fondo Principal: `bg-slate-900`
- Paneles/Tarjetas: `bg-slate-800`
- Texto Principal: `text-slate-50`
- Texto Secundario: `text-slate-400`

---

### ⚛️ rpsoft-react

**Ubicación:** `.agent/skills/rpsoft-react/SKILL.md`

Reglas y buenas prácticas obligatorias para desarrollo en React.

| Categoría | Reglas |
|-----------|--------|
| **Componentes** | Solo funcionales, una responsabilidad, pequeños y reutilizables |
| **Hooks** | No en condicionales ni loops, declarar al inicio del componente |
| **Estado** | No abusar de useState, preferir estado derivado, extraer lógica a hooks custom |
| **Renderizado** | Evitar renders innecesarios, no usar `index` como key en listas dinámicas |
| **Estructura** | `components/`, `hooks/`, `contexts/`, `services/`, `utils/` |

**Ejemplo de componente:**
```jsx
export function UserCard({ user }) {
  return <div>{user.name}</div>
}
```

---

### 🗄️ rpsoft-supabase

**Ubicación:** `.agent/skills/rpsoft-supabase/SKILL.md`

Estándar RPSoft para trabajar con Supabase (Auth + Database + RLS).

| Categoría | Estándar |
|-----------|----------|
| **Auth** | Supabase Auth integrado |
| **Database** | PostgreSQL con Supabase |
| **Seguridad** | Row Level Security (RLS) obligatoria |
| **Políticas** | Políticas por usuario para evitar filtración de datos |
| **Cliente** | Ubicar siempre en `src/lib/supabaseClient.ts` |

**Configuración del cliente:**
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## 📁 Estructura del Proyecto

```
control-horario-app/
├── .agent/skills/       # Skills de desarrollo
├── docs/                # Documentación técnica
├── db_scripts/          # Scripts de base de datos
├── public/              # Assets estáticos
├── src/
│   ├── app/             # Rutas Next.js App Router
│   ├── components/      # Componentes de UI
│   ├── features/        # Módulos por funcionalidad
│   ├── lib/             # Librerías y configuración
│   ├── services/        # Servicios de datos
│   └── types/           # Tipos TypeScript
└── middleware.ts        # Middleware de autenticación
```

---

## 📚 Documentación Adicional

- [Estándares de Base de Datos](docs/db-standards.md)
- [Registro de Debugging](docs/debug-log.md)

---

## 🔗 Links Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

