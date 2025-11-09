# Materna360 — QA Checklist (Mobile-first)

## 1) Visual (375 / 414 / 768)
- [ ] No horizontal overflow
- [ ] `PageTemplate` present (soft bg + pb-24 for BottomNav)
- [ ] Typography per tokens
- [ ] Cards radius 20–24 and soft shadow consistent

## 2) Accessibility
- [ ] Visible focus on all interactive elements
- [ ] AA contrast
- [ ] `aria-current` on active tab/item
- [ ] Semantic heading order (H1/H2)

## 3) Functional (main routes)
- [ ] `/maternar` opens and navigates to 5 destinations
- [ ] `/meu-dia` create/edit/remove item; mood check-in; local reminders
- [ ] `/cuidar` add vaccine/appointment; ordered timeline
- [ ] `/descobrir` reactive filters < 100ms; persistent "Save for later"
- [ ] `/eu360` weekly summary renders with skeleton + insight

## 4) Performance
- [ ] Key interactions < 100ms
- [ ] Minimal CLS
- [ ] `next/image` usage

## 5) Telemetry (sample)
- [ ] `nav.click` on route change
- [ ] `mood.checkin`
- [ ] `todos.add|edit|remove` in /meu-dia
- [ ] `care.appointment_add` in /cuidar
- [ ] `eu360.summary_view` on summary open

## 6) Copy & Content
- [ ] No emojis; Lucide icons only
- [ ] Standard CTAs: "Add item", "Save", "Access →"
- [ ] Warm tone in empty-states

## 7) Build & Deploy
- [ ] TS=0
- [ ] Preview build green
- [ ] No critical runtime warnings in production
