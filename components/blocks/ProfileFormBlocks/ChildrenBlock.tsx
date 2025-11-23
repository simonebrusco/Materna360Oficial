'use client'

import { FormErrors, ProfileFormState, ChildProfile } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  babyBirthdate: string
  todayISO: string
  onBirthdateChange: (value: string) => void
  onUpdateChild: (id: string, key: keyof ChildProfile, value: string | number | string[]) => void
  onAddChild: () => void
  onRemoveChild: (id: string) => void
}

export function ChildrenBlock({
  form,
  errors,
  babyBirthdate,
  todayISO,
  onBirthdateChange,
  onUpdateChild,
  onAddChild,
  onRemoveChild,
}: Props) {
  return (
    <div className="space-y-4">

      {form.filhos.map((child, index) => (
        <div key={child.id} className="border-t border-gray-200 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-800">Filho {index + 1}</h3>
            {form.filhos.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveChild(child.id)}
                className="text-[11px] text-primary-600 hover:text-primary-700 font-medium"
              >
                Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`child-name-${index}`} className="text-xs font-medium text-gray-800">
                Nome ou apelido
              </label>
              <input
                id={`child-name-${index}`}
                type="text"
                value={child.nome}
                onChange={(event) => onUpdateChild(child.id, 'nome', event.target.value)}
                placeholder="Opcional"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={`child-gender-${index}`} className="text-xs font-medium text-gray-800">
                Gênero
              </label>
              <select
                id={`child-gender-${index}`}
                value={child.genero}
                onChange={(event) => onUpdateChild(child.id, 'genero', event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
              >
                <option value="menino">Menino</option>
                <option value="menina">Menina</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor={`child-age-${index}`} className="text-xs font-medium text-gray-800">
                Idade (meses)
              </label>
              <input
                id={`child-age-${index}`}
                type="number"
                min={0}
                inputMode="numeric"
                value={child.idadeMeses}
                onChange={(event) => onUpdateChild(child.id, 'idadeMeses', event.target.value)}
                className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 ${
                  errors.filhos?.[child.id] ? 'border-primary-400 ring-1 ring-primary-300' : ''
                }`}
              />
              {errors.filhos?.[child.id] && (
                <p className="text-[11px] text-primary-600 font-medium">{errors.filhos[child.id]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor={`child-age-range-${index}`} className="text-xs font-medium text-gray-800">
                Faixa etária
              </label>
              <select
                id={`child-age-range-${index}`}
                value={child.ageRange || ''}
                onChange={(event) => onUpdateChild(child.id, 'ageRange', event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
              >
                <option value="">Selecione...</option>
                <option value="0-1">0–1 ano</option>
                <option value="1-3">1–3 anos</option>
                <option value="3-6">3–6 anos</option>
                <option value="6-8">6–8 anos</option>
                <option value="8+">8+ anos</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor={`child-phase-${index}`} className="text-xs font-medium text-gray-800">
                Qual fase mais desafia vocês?
              </label>
              <select
                id={`child-phase-${index}`}
                value={child.currentPhase || ''}
                onChange={(event) => onUpdateChild(child.id, 'currentPhase', event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
              >
                <option value="">Selecione...</option>
                <option value="sono">Sono</option>
                <option value="birras">Birras / emoções intensas</option>
                <option value="escolar">Rotina escolar</option>
                <option value="socializacao">Socialização / amizade</option>
                <option value="alimentacao">Alimentação</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor={`child-notes-${index}`} className="text-xs font-medium text-gray-800">
                Algo importante que você acha que eu deveria saber?
              </label>
              <textarea
                id={`child-notes-${index}`}
                value={child.notes || ''}
                onChange={(event) => onUpdateChild(child.id, 'notes', event.target.value)}
                placeholder="Escreva algo que nos ajude a entender melhor..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 resize-none"
                rows={3}
              />
              <p className="text-[11px] text-gray-500">Opcional, mas muito valioso para personalizar.</p>
            </div>

            {index === 0 && (
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="baby-birthdate" className="text-xs font-medium text-gray-800">
                  Data de nascimento do bebê
                </label>
                <input
                  id="baby-birthdate"
                  type="date"
                  value={babyBirthdate}
                  onChange={(event) => onBirthdateChange(event.target.value)}
                  max={todayISO}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
                <p className="text-[11px] text-gray-500">Opcional, mas ajuda a personalizar receitas e conteúdos.</p>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label htmlFor={`child-allergies-${index}`} className="text-xs font-medium text-gray-800">
                Alergias (separe por vírgula)
              </label>
              <input
                id={`child-allergies-${index}`}
                type="text"
                value={child.alergias.join(', ')}
                onChange={(event) => onUpdateChild(child.id, 'alergias', event.target.value)}
                placeholder="Ex.: leite, ovo, amendoim"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
              />
            </div>
          </div>
        </div>
      ))}

      {errors.general && <p className="text-[11px] text-primary-600 font-medium">{errors.general}</p>}

      <button
        type="button"
        onClick={onAddChild}
        className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
      >
        + Adicionar outro filho
      </button>
    </div>
  )
}
