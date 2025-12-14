'use client'

import React from 'react'
import WeeklyPlannerCore from './WeeklyPlannerCore'

/**
 * WeeklyPlannerShell
 * -------------------
 * Camada de orquestração do planner.
 *
 * ❗ Regras importantes:
 * - NÃO conter lógica de estado
 * - NÃO conter hooks
 * - NÃO duplicar responsabilidades do Core
 * - Serve apenas como ponto estável de montagem
 *
 * Isso garante:
 * - Estabilidade arquitetural
 * - Facilidade de refatoração futura
 * - Zero regressão no Meu Dia
 */
export default function WeeklyPlannerShell() {
  return <WeeklyPlannerCore />
}
