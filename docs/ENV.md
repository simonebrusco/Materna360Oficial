# ⚙️ Materna360 — Environment & Flags Guide

**Last update:** November 10, 2025  
**Scope:** Variables, feature flags, behavior matrix (Preview/Production), QA overrides, and troubleshooting.

---

## 1) Quick Start

### Local Development
```bash
pnpm install
pnpm exec tsc --noEmit
pnpm run dev
```

### Recommended .env.local (safe defaults for dev/preview)
```ini
# Routing & hub
FORCE_MATERNAR_SSR=1
NEXT_PUBLIC_FF_MATERNAR_HUB=1

# Intelligence & reports
NEXT_PUBLIC_FF_EMOTION_TRENDS=1
NEXT_PUBLIC_FF_COACH_V1=1
NEXT_PUBLIC_FF_EXPORT_PDF=1
NEXT_PUBLIC_FF_PAYWALL_MODAL=1
```

---

## 2) Variables & Flags (Reference)

| Key | Type | Default (Preview) | Default (Prod) | Purpose |
|-----|------|-------------------|----------------|---------|
| `FORCE_MATERNAR_SSR` | server | 1 | 0 | Server-side override to enable Maternar Hub SSR & root redirect testing. |
| `NEXT_PUBLIC_FF_MATERNAR_HUB` | client | 1 | 0 | Feature flag for /maternar hub visibility and / → /maternar redirect. |
| `NEXT_PUBLIC_FF_EMOTION_TRENDS` | client | 1 | 0 | Enables Emotion Trend (SVG chart + drawer) in /meu-dia. |
| `NEXT_PUBLIC_FF_COACH_V1` | client | 1 | 0 | Enables Coach Materno v0.1/v0.2 (suggestions, weekly focus, tone). |
| `NEXT_PUBLIC_FF_EXPORT_PDF` | client | 1 | 0 | Enables /eu360/export (printable report). |
| `NEXT_PUBLIC_FF_PAYWALL_MODAL` | client | 1 | 0 | Intercepts Baixar PDF for non-premium users with a soft paywall modal. |
| `STRICT_EMOJI` | server | (empty) | (empty) | Prebuild guard: 1 = fail build if emojis found; empty/other = warn only. |
| `NEXT_PUBLIC_ALLOW_EMOJI` | client | (empty) | (empty) | If set, UI can allow emoji (we keep unset: Lucide icons only). |
| `NODE_ENV` | both | development | production | Standard Next.js env. |
| `NEXT_PUBLIC_APP_ENV` | client | preview | prod | Optional hint for environment-specific UI copy or telemetry sampling. |

### Premium Simulation (local only)
Set `localStorage.setItem('m360_premium','1')` to unlock print; remove the key to lock again.

---

## 3) Feature Flag Precedence

Materna360 flags follow a clear, safe precedence to avoid surprises:

1. **Server override:** `FORCE_MATERNAR_SSR` (server-only, highest precedence for hub / redirects)
2. **Cookie/QA override:** `ff_*` cookies (set via QA tools or runtime)
3. **Public env:** `NEXT_PUBLIC_FF_*` (deployment-level)
4. **Default (code):** preview defaults enabled, prod defaults disabled

**Rule of thumb:** if SSR routing/redirect is involved, server takes precedence; otherwise, client flags decide.

---

## 4) Behavior Matrix

### A) Root & Hub
| Scenario | Result |
|----------|--------|
| `FORCE_MATERNAR_SSR=1` OR `NEXT_PUBLIC_FF_MATERNAR_HUB=1` | / redirects to /maternar (hub visible in BottomNav) |
| Both disabled | / redirects to /meu-dia (hub guarded) |

### B) Intelligence & Reports
| Flag | Affects | Behavior |
|------|---------|----------|
| `NEXT_PUBLIC_FF_EMOTION_TRENDS` | /meu-dia | Shows "Ver tendência" → drawer with SVG chart (7d/28d). |
| `NEXT_PUBLIC_FF_COACH_V1` | /meu-dia & /eu360 | Shows Coach Materno card (v0.1/v0.2 with tone + focus). |
| `NEXT_PUBLIC_FF_EXPORT_PDF` | /eu360 | Shows Exportar Relatório + routes to /eu360/export. |
| `NEXT_PUBLIC_FF_PAYWALL_MODAL` | /eu360/export | Intercepts Baixar PDF if user not premium (soft modal + CTA). |

---

## 5) QA Overrides (Runtime)

We support runtime overrides for QA without redeploying.

### A) Cookie-based (recommended)
- Set a cookie `ff_<NAME>` to "1" or "0" (e.g., `ff_maternar=1`)
- Higher precedence than public env

### B) LocalStorage helpers (client-only)

**Premium simulation:**
```javascript
localStorage.setItem('m360_premium','1')   // unlock export
localStorage.removeItem('m360_premium')    // lock export
```

(If your build includes a querystring dev hook, keep it restricted to preview environments.)

---

## 6) Telemetry Conventions

Event names are snake-like dotted, with minimal payload:

- **Navigation:** `nav.click`, `page.view`
- **Planner:** `planner.item_add`, `planner.item_done`
- **Mood:** `mood.checkin`, `trend.view`
- **Coach:** `coach.card_view`, `coach.suggestion_apply`, `coach.save_for_later`, `coach.why_seen_open`, `coach.tone_change`
- **Paywall/PDF:** `paywall.view`, `paywall.block_trigger`, `paywall.upgrade_click`, `paywall.dismiss`, `pdf.export_open`

**Payload common keys:**
```javascript
{ tab?: 'meu-dia'|'eu360'|'cuidar'|'descobrir'|'maternar', id?: string, range?: 'weekly'|'monthly' }
```

All telemetry must be non-blocking and console-silent.

---

## 7) Deployment Profiles

### Preview (Vercel)
```ini
FORCE_MATERNAR_SSR=1
NEXT_PUBLIC_FF_MATERNAR_HUB=1
NEXT_PUBLIC_FF_EMOTION_TRENDS=1
NEXT_PUBLIC_FF_COACH_V1=1
NEXT_PUBLIC_FF_EXPORT_PDF=1
NEXT_PUBLIC_FF_PAYWALL_MODAL=1
NEXT_PUBLIC_APP_ENV=preview
```

### Production
```ini
# Toggle gradually as features mature
FORCE_MATERNAR_SSR=0
NEXT_PUBLIC_FF_MATERNAR_HUB=0
NEXT_PUBLIC_FF_EMOTION_TRENDS=0
NEXT_PUBLIC_FF_COACH_V1=0
NEXT_PUBLIC_FF_EXPORT_PDF=0
NEXT_PUBLIC_FF_PAYWALL_MODAL=0
NEXT_PUBLIC_APP_ENV=prod
```

**Rollout tip:** enable one feature at a time; confirm logs and telemetry before moving to the next.

---

## 8) Troubleshooting

### Build fails with emoji error
Set `STRICT_EMOJI=1` only when you're ready; in preview keep it empty (warn mode).
Run the checker output and replace emojis with Lucide icons.

### Redirect loop or wrong landing
Confirm `FORCE_MATERNAR_SSR` and `NEXT_PUBLIC_FF_MATERNAR_HUB`.
Root redirect logic lives in `app/page.tsx` and hub guard in `app/(tabs)/maternar/page.tsx`.

### Paywall not blocking print
Check `NEXT_PUBLIC_FF_PAYWALL_MODAL=1` and ensure `localStorage.m360_premium` is not "1".

### Chart not rendering
Ensure `NEXT_PUBLIC_FF_EMOTION_TRENDS=1` and the mood store is seeded (dev/preview auto-seed enabled).

---

## 9) Security & Privacy Notes

- No PII is persisted by default. Local state lives in localStorage only.
- All premium gating in preview is client-side and suitable for UX validation.
- For production, wire a server-verified entitlement layer before enabling premium features globally.
