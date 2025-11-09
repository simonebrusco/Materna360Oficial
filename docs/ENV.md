# Materna360 — ENV & Flags

## Environments
- **Production (Vercel)**: materna360.com.br — P0 stable, P1 incremental.
- **Preview (Vercel)**: PRs/branches — feature flags may differ.

## Variables — Preview
- `FORCE_MATERNAR_SSR=1`
- `NEXT_PUBLIC_FF_MATERNAR_HUB=1`
- `NEXT_PUBLIC_TELEMETRY_DEBUG=0|1` (optional console logs)

## Variables — Production
- `NEXT_PUBLIC_FF_MATERNAR_HUB=1`

## Flag Precedence
1) `FORCE_MATERNAR_SSR`
2) cookie `ff_maternar`
3) `NEXT_PUBLIC_FF_MATERNAR_HUB`
4) environment default

## Dev
- Local: http://localhost:3001
- Commands:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm exec tsc --noEmit`

## Rules
- Flags must NOT block navigation.
- Telemetry must NEVER block UI (fire-and-forget).
