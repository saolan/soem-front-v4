# SOEM Front-end

SPA del ERP SOEM: React + TypeScript + Vite, Tailwind CSS v4 y shadcn/ui
(Base UI). Consume la API REST del back-end ubicado en `../soem`.

Las reglas de arquitectura, estructura, contrato del API y seguridad están en
[`AGENTS.md`](AGENTS.md).

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run typecheck    # verificación de tipos
npm run lint         # ESLint
npm run format       # Prettier
npm run build        # build de producción en dist/
```

## Back-end en desarrollo

`npm run dev` reenvía `/api` a WildFly reescribiéndolo a `/soem/api`. El
destino por defecto es `http://localhost:8080`; para cambiarlo, crea
`.env.local` con:

```bash
SOEM_API_DESTINO=http://otro-host:8080
```

## Componentes de shadcn/ui

```bash
npx shadcn@latest add <componente>
```

Se generan en `src/compartido/componentes/ui` (alias de `components.json`) y
se importan como `@/compartido/componentes/ui/<componente>`.
