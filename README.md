# ElectroGestor

Sistema de gestión integral para electricistas profesionales en Argentina. SPA offline-first con persistencia en localStorage — sin backend, ideal para trabajo en obra con conectividad limitada.

![ElectroGestor](src/assets/hero.png)

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Clientes** | ABM completo de clientes con contacto, dirección y notas. Base para cotizaciones y facturación. |
| **Cotizador** | Presupuestos profesionales con cálculo automático de materiales y mano de obra. Estados: borrador, enviado, aceptado, rechazado. |
| **Facturación** | Facturación sincronizada con presupuestos. Generación de PDF con jsPDF + html2canvas. |
| **Agenda** | Gestión de turnos y calendario para installaciones y visitas técnicas. |
| **Inventario** | Control de stock con alertas de bajo stock y historial de movimientos (entradas/salidas). |
| **Reportes** | Dashboard con gráficos de ventas, presupuestos y métricas de negocio (lazy-loaded con Recharts). |

Además incluye un módulo de **Ajustes** para configuración general de la aplicación.

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React | 19 |
| Lenguaje | TypeScript | 6 |
| Estilos | TailwindCSS | 4 |
| Build | Vite | 8 |
| Estado | Zustand + persist | 5 |
| Formularios | React Hook Form + Zod | 7 / 4 |
| Routing | React Router DOM | 7 |
| Gráficos | Recharts | 3 |
| PDF | jsPDF + html2canvas | — |
| Tests | Vitest + Testing Library | 4 |
| Linting | ESLint + typescript-eslint | 10 |

## Arquitectura

SPA con arquitectura **feature-based**: cada módulo es autosuficiente con su store (Zod), tipos, utilidades y componentes específicos.

```
src/
├── features/
│   ├── clients/        # ABM de clientes
│   │   ├── components/
│   │   ├── store.ts    # Zustand store + persist
│   │   ├── store.test.ts
│   │   └── types.ts
│   ├── quoting/        # Cotizaciones
│   │   ├── components/
│   │   ├── store.ts
│   │   ├── types.ts
│   │   ├── utils.ts    # Cálculos de materiales/mano de obra
│   │   └── utils.test.ts
│   ├── invoicing/      # Facturación
│   │   ├── components/
│   │   ├── store.ts
│   │   ├── store.test.ts
│   │   └── types.ts
│   ├── scheduling/     # Agenda
│   │   ├── components/
│   │   ├── store.ts
│   │   ├── store.test.ts
│   │   └── types.ts
│   ├── inventory/      # Inventario
│   │   ├── components/
│   │   ├── store.ts
│   │   └── types.ts
│   ├── reports/        # Reportes (lazy-loaded)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── page.tsx
│   │   └── types/
│   └── settings/       # Configuración
│       ├── components/
│       ├── store.ts
│       ├── store.test.ts
│       └── types.ts
├── shared/
│   ├── components/     # UI reutilizable (Button, Card, Modal, Table, Toast, etc.)
│   ├── hooks/          # useToast, useIdGenerator, useWebShare
│   ├── types/          # Tipos compartidos
│   └── utils/          # Generación de PDF, export/import de datos
├── components/
│   └── layout/         # Layout principal, Sidebar
├── pages/              # Páginas de cada ruta (CRUD por módulo)
├── assets/
│   └── hero.png
└── test/
    └── setup.ts        # Configuración de tests (jsdom)
```

**Patrón de componentes compartidos**: `src/shared/components/` contiene UI genérica (Badge, Button, Card, DropdownMenu, Input, Modal, Select, Skeleton, Table, Toast). Cada feature usa estos componentes y agrega los suyos propios en `features/*/components/`.

## Desarrollo

### Prerrequisitos

- Node.js >= 20
- npm

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

- **Offline-first**: toda la información se almacena en `localStorage` del navegador. Sin dependencia de servidores.
- **Backup/Restore**: exportación e importación de datos en JSON validado con Zod. Los backups incluyen versionado (`version: 1`) y merge inteligente al importar (actualiza existentes, agrega nuevos).
- **Formato de backup**: `electrogestor-backup-YYYY-MM-DD.json`

## Licencia

MIT
