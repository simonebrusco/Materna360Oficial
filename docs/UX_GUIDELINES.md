# Materna360 — UX Guidelines (Soft Luxury)

## 1) Style Foundations
- **Colors**: #ff005e (primary), #ffd8e6 (complement), #2f3a56, #545454, #000, #fff
- **Spacing (8px grid)**: 8 / 12 / 16 / 24 / 32
- **Radii**: cards 20–24; pills 999
- **Shadows**: soft (0 8px 28px rgba(47,58,86,0.08))
- **Borders**: 1px #e9ecf2 (white bg) | #ffffff99 (rose bg)
- **Typography**:
  - Page title: 22/28 (28/34 md), semibold
  - Subtitle: 14, #545454
  - Body: 14/20, #2f3a56
  - Micro: 12, #545454

## 2) Core Components (always use)
- PageTemplate, PageHeader, SoftCard (Card), FilterPill, EmptyState, Toast, AppIcon

## 3) Route Patterns
- **/maternar**: 6-card grid; Highlights; Continue where I left off
- **/meu-dia**: day message; planner; mood check-in; "Add item" button
- **/cuidar**: quick logs (chips/inputs); timeline with date badges
- **/descobrir**: pill filters; cards with cover/large icon; "Save for later"
- **/eu360**: 2×2 weekly summary; emotional diary input

## 4) Microinteractions
- Hover/press: light elevation + scale 0.99
- Opacity: 96% → 100% on hover/focus
- Rounded skeletons; 8px gaps; 3–5 lines

## 5) UX Telemetry Rules
- 1 action → 1 event
- Never block navigation
- Short, predictable names (kebab-case)
