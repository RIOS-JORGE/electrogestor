# ElectroGestor

Sistema de gestión integral para electricistas. MVP con 4 módulos core:

- **Cotizador + Clientes** — Presupuestos profesionales con cálculo de materiales y mano de obra
- **Facturación Simple** — Facturación sincronizada con presupuestos
- **Agenda Inteligente** — Gestión de turnos y calendario
- **Inventario Básico** — Control de stock, alertas de bajo stock, historial de movimientos

### Stack

- **Frontend:** React 19 + TypeScript 6 + TailwindCSS 4
- **Build:** Vite 8
- **Estado:** Zustand + persist (localStorage)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router 7

### Desarrollo

```bash
npm run dev      # Levantar servidor de desarrollo
npm run build    # Build de producción
npm run test     # Tests unitarios (Vitest)
npm run test:watch  # Tests en modo watch
```

### Arquitectura

SPA 100% offline-first con almacenamiento local. Sin backend — ideal para profesionales que trabajan en obra con conectividad limitada.
