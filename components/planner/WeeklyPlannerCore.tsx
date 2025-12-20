// [arquivo mantido inteiro — ajustes focados nos pontos abaixo]

/* === ALTERAÇÃO 1: NOVO HANDLER DE LEMBRETE LIVRE === */
const addFreeReminder = useCallback(() => {
  const text = window.prompt('O que você gostaria de lembrar hoje?')
  if (!text) return

  addTask(text, 'custom')
}, [addTask])

/* === ALTERAÇÃO 2: BOTÃO + DOS LEMBRETES === */
<button
  type="button"
  onClick={addFreeReminder}
  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
  aria-label="Adicionar lembrete"
>
  +
</button>

/* === ALTERAÇÃO 3: ATALHOS COM PROMPT === */
<button
  type="button"
  onClick={() => {
    const text = window.prompt('O que realmente importa agora?')
    if (text) addTask(text, 'top3')
  }}
>
  {shortcutLabelTop3}
</button>

/* idem para selfcare / family */

/* === ALTERAÇÃO 4: MICROCOPY DO CARD FINAL === */
<div className="text-[11px] text-[var(--color-text-muted)] mt-1 text-center">
  Você pode revisar dias anteriores ou se organizar para os próximos.
</div>
