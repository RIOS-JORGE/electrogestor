# ElectroGestor

Sistema de gestión integral para electricistas profesionales en Argentina. Multi-tenant con autenticación via Supabase + Google OAuth. Persistencia en la nube con sincronización automática.

![ElectroGestor](src/assets/hero.png)

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Clientes** | ABM completo de clientes con contacto, dirección y notas. Base para cotizaciones y facturación. |
| **Cotizador** | Presupuestos profesionales con cálculo automático de materiales y mano de obra. Estados: borrador, enviado, aceptado, rechazado. |
| **Facturación** | Facturación sincronizada con presupuestos. Generación de PDF programático con jsPDF (texto seleccionable, sin html2canvas). Estados: emitida, pagada, vencida, anulada. |
| **Agenda** | Gestión de turnos con calendario para instalaciones y visitas técnicas. |
| **Inventario** | Control de stock con alertas de bajo stock, ajustes e historial de movimientos (entradas/salidas/ajustes). |
| **Reportes** | Dashboard con gráficos de ingresos, conversión de presupuestos, ranking de clientes, estadísticas de agenda y valor de inventario (lazy-loaded con Recharts). |

Además incluye módulo de **Ajustes** (configuración de empresa, alias de Mercado Pago) y panel de **Admin** para gestión de usuarios y migración de datos.

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React | 19 |
| Lenguaje | TypeScript | 6 |
| Estilos | TailwindCSS | 4 |
| Build | Vite | 8 |
| Backend | Supabase | 2 |
| Auth | Supabase Auth (Google OAuth) | — |
| Estado | Zustand + persist | 5 |
| Formularios | React Hook Form + Zod | 7 / 4 |
| Routing | React Router DOM | 7 |
| Gráficos | Recharts | 3 |
| PDF | jsPDF + jspdf-autotable | 2 / 5 |
| Tests | Vitest + Testing Library | 4 |
| Linting | ESLint + typescript-eslint | 10 |

## Arquitectura

SPA con autenticación multi-tenant y arquitectura **feature-based**: cada módulo es autosuficiente con su store (Zustand), tipos, API layer y componentes específicos. Los datos se persisten en Supabase y se cargan al iniciar sesión.

```
src/
├── features/
│   ├── clients/        # ABM de clientes
│   │   ├── api.ts      # Operaciones contra Supabase
│   │   ├── components/
│   │   ├── store.ts    # Zustand store
│   │   ├── store.test.ts
│   │   └── types.ts
│   ├── quoting/        # Cotizaciones
│   │   ├── api.ts
│   │   ├── components/
│   │   ├── store.ts
│   │   ├── types.ts
│   │   ├── utils.ts    # Cálculos de materiales/mano de obra
│   │   └── utils.test.ts
│   ├── invoicing/      # Facturación
│   │   ├── api.ts
│   │   ├── components/
│   │   ├── store.ts
│   │   ├── store.test.ts
│   │   └── types.ts
│   ├── scheduling/     # Agenda
│   │   ├── api.ts
│   │   ├── components/
│   │   ├── store.ts
│   │   ├── store.test.ts
│   │   └── types.ts
│   ├── inventory/      # Inventario
│   │   ├── api.ts
│   │   ├── components/
│   │   ├── store.ts
│   │   └── types.ts
│   ├── reports/        # Reportes (lazy-loaded)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── page.tsx
│   │   └── types/
│   └── settings/       # Configuración
│       ├── api.ts
│       ├── components/
│       ├── store.ts
│       ├── store.test.ts
│       └── types.ts
├── shared/
│   ├── components/     # UI reutilizable (Badge, Button, Card, Input, Modal, Table, Toast, etc.)
│   ├── hooks/          # useToast, useIdGenerator, useWebShare, useMediaQuery
│   ├── types/          # Tipos compartidos
│   └── utils/          # Generación de PDF (pdf.ts)
├── components/
│   ├── layout/         # Layout principal
│   └── migration/      # MigrationBanner, OfflineIndicator
├── pages/              # Páginas de cada ruta (CRUD por módulo)
├── providers/          # AuthProvider (contexto de autenticación)
├── lib/
│   ├── supabase.ts     # Cliente Supabase + gestión de tenant activo
│   ├── connectivity.ts # Store de conectividad (online/offline)
│   └── types.ts        # Tipos de base de datos (DbClient, DbInvoice, etc.)
├── assets/
│   └── hero.png
└── test/
    └── setup.ts        # Configuración de tests (jsdom)
```

**Patrón de componentes compartidos**: `src/shared/components/` contiene UI genérica (Badge, Button, Card, DropdownMenu, Input, Modal, Select, Skeleton, Table, Toast). Cada feature usa estos componentes y agrega los suyos propios en `features/*/components/`.

**Auth multi-tenant**: cada empresa tiene sus propios datos aislados por `company_id`. Los usuarios se autentican con Google OAuth y se vinculan a una empresa mediante `company_users`. Roles: `admin` y `employee`.

**API layer**: cada feature tiene un `api.ts` que centraliza las operaciones contra Supabase (CRUD), manteniendo los stores limpios de lógica de red.

## Desarrollo

### Prerrequisitos

- Node.js >= 20
- npm
- Proyecto en Supabase con las tablas del schema (`supabase-migration.sql`)

### Variables de entorno

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo (Vite)
npm run build        # Build de producción (tsc + vite build)
npm run preview      # Previsualizar build de producción
npm run test         # Tests unitarios (Vitest)
npm run test:watch   # Tests en modo watch
npm run lint         # Linting (ESLint)
```

## Datos

- **Persistencia en la nube**: todos los datos se almacenan en Supabase, aislados por empresa (`company_id`).
- **Migración desde localStorage**: al iniciar sesión por primera vez, la app carga los datos desde Supabase. Un banner detecta si quedaron datos locales de la versión anterior y permite limpiarlos.
- **Conectividad**: detector de estado online/offline que muestra un indicador visual cuando no hay conexión con Supabase.

## Licencia

MIT
