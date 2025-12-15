export type FormErrors = {
  // Step 1 — Você
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string
  userEnergyPeakTime?: string

  // Step 2 — Filhos
  filhos?: Record<string, string | undefined>

  // Step 3 — Rotina
  routineChaosMoments?: string

  // Step 4 — Preferências
  userContentPreferences?: string
  userNotificationsPreferences?: string

  // Reserva para mensagens gerais do form
  _form?: string
}
