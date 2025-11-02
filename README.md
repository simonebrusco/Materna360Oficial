You are updating the project’s “Custom information” reference. 
Do NOT modify source code, configs, routes, envs or repository settings. 
Only replace the Custom information text with the block below, exactly as provided.

---
Tech & tooling
- Framework: Next.js 14 (App Router, `app/`).
- Language: TypeScript.
- Styling: Tailwind CSS.
- Icons: lucide-react.
- Animations: (opcional) Framer Motion sutil.
- Package manager: pnpm (10.19.0). In CI/Builder use: `pnpm install --frozen-lockfile` (ou, se preciso, `--no-frozen-lockfile`).
- Node: 20.x (igual à Vercel).

Structure & paths
- App Router em `app/`.
- Páginas: `app/(tabs)/{meu-dia,cuidar,descobrir,eu360}`.
- Componentes compartilhados em `components/` (UI em `components/ui`).
- Alias de import: `@/*` (NÃO alterar). Não mover páginas para fora de `app/`.

Dev server & scripts
- Dev: http://localhost:3001.
- Script de dev: `next dev -p 3001`.
- Para instalar deps no Builder: `pnpm install --frozen-lockfile` (se o lock divergir, permitir `--no-frozen-lockfile` e commitar o lock atualizado).

Branching & PRs
- Branch padrão de trabalho: `main`.
- Abrir PRs de `main` (ou `builder/*`) para `main`.
- Marcar PRs como Draft por padrão.
- Usar Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Não criar ou renomear repositórios.

Design guidelines
- Premium/soft: sombras suaves, cantos arredondados, micro-interações.
- Paleta: Primária #ff005e; Secundária #ffd8e6.
- Mobile-first + A11y: foco visível, contraste legível.

What NOT to change
- Não renomear pacotes arbitrariamente.
- Não alterar o alias `@/*` nem portas (manter 3001).
- Não hardcodear secrets; use env `NEXT_PUBLIC_*` quando necessário.
- Não introduzir breaking changes em rotas de API ou `next.config.mjs`.

Current production
- Production branch: `main` (Vercel apontando para `main`).
---
Apenas substituir o texto do Custom information. Quando terminar, responda “Custom information updated. No code changes.” 
