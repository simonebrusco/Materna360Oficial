## [v0.3.2] - 2025-11-22

### Added
- Centralized emotional and routine AI endpoints:
  - `POST /api/ai/emocional`
  - `POST /api/ai/rotina`
- Weekly emotional insight card in `/eu360`, with gentle copy and safe fallbacks.
- Weekly emotional overview in `/meu-dia/como-estou-hoje`, connected to mood & energy logs.
- Daily emotional “Insight do Dia” in `/meu-dia/como-estou-hoje`, with one-click save to Planner.

### Changed
- Refined `/meu-dia/rotina-leve` layout to a premium 3-block structure:
  - Receitas Inteligentes (hero)
  - Ideias Rápidas
  - Inspirações do Dia
- Connected Rotina Leve and Como Estou Hoje to `usePlannerSavedContents`, using consistent `origin` and `type` patterns.

### Fixed
- Ensured all new IA flows have editorial fallbacks when the AI endpoint fails.
- Kept navigation, layout shell and brand styles untouched to avoid regressions in the main app structure.
