import Link from 'next/link'

import { getBabyProfile } from '@/app/lib/profile'
import {
  BABY_STAGE_RECIPES,
  FAMILY_RECIPES_SUGGESTIONS,
  RECIPE_STAGE_INFO,
  RECIPE_STAGE_ORDER,
  type RecipeStageKey,
  type StageRecipe,
} from '@/data/healthyRecipesContent'
import { FamilyRecipesToggle } from '@/components/recipes/FamilyRecipesToggle'
import { StageRecipesClient } from '@/components/recipes/StageRecipesClient'

type RecipesState = 'unknown' | 'lt6' | 'gte6'

type StageMeta = {
  key: RecipeStageKey
  label: string
  tagline: string
  recipes: StageRecipe[]
}

const primaryButtonClasses =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] px-6 py-2.5 text-base font-semibold text-white shadow-glow transition-all duration-300 ease-gentle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 hover:-translate-y-0.5 active:translate-y-0.5'

const secondaryLinkClasses =
  'inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors duration-200 ease-gentle hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60'

const softCardClasses = 'rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur'
const softHighlightClasses = 'rounded-3xl border border-secondary/70 bg-secondary/70/80 p-6 shadow-soft backdrop-blur'

const sanitizeAge = (value: number | null | undefined): number | null => {
  if (!Number.isFinite(Number(value))) {
    return null
  }
  const normalized = Number(value)
  return normalized >= 0 ? normalized : null
}

const mapAgeToStage = (age: number): RecipeStageKey => {
  if (age < 9) {
    return '6-8m'
  }
  if (age < 13) {
    return '9-12m'
  }
  return '12+m'
}

const buildStageMeta = (): StageMeta[] =>
  RECIPE_STAGE_ORDER.map((key) => ({
    key,
    label: RECIPE_STAGE_INFO[key].label,
    tagline: RECIPE_STAGE_INFO[key].tagline,
    recipes: BABY_STAGE_RECIPES[key],
  })).filter((stage) => stage.recipes.length > 0)

const UnknownState = () => (
  <section id="receitas-saudaveis" className={softCardClasses} aria-labelledby="healthy-recipes-title">
    <div className="flex flex-col gap-6">
      <header>
        <h2 id="healthy-recipes-title" className="text-xl font-semibold text-support-1">
          Receitas Saudáveis
        </h2>
        <p className="mt-2 max-w-xl text-sm text-support-2/80">
          Conteúdos personalizados dependem da idade do bebê.
        </p>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/eu360"
          className={primaryButtonClasses}
          aria-label="Atualizar idade do bebê no Eu360"
        >
          <span className="absolute inset-0 -z-10 rounded-full bg-white/0 transition-opacity duration-500 group-hover:bg-white/10" />
          <span className="absolute inset-x-4 top-1.5 -z-0 h-[10px] rounded-full bg-white/40 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative z-10 flex items-center gap-2">Atualizar idade do bebê</span>
        </Link>
        <p className="text-sm text-support-2/70">
          Enquanto isso, explore sugestões leves para a família.
        </p>
      </div>
      <FamilyRecipesToggle recipes={FAMILY_RECIPES_SUGGESTIONS} />
    </div>
  </section>
)

const LtSixState = () => (
  <section id="receitas-saudaveis" className={softHighlightClasses} aria-labelledby="healthy-recipes-title-lt6">
    <div className="flex flex-col gap-4">
      <header className="flex items-start gap-3">
        <span role="img" aria-label="Bebê" className="text-3xl">
          👶
        </span>
        <div>
          <h2 id="healthy-recipes-title-lt6" className="text-xl font-semibold text-support-1">
            Por enquanto, foco na amamentação
          </h2>
          <p className="mt-2 text-sm text-support-2/80">
            Até os 6 meses, o Ministério da Saúde recomenda amamentação exclusiva. Quando chegar a hora, liberaremos receitas seguras para essa nova fase.
          </p>
        </div>
      </header>
      <p className="text-xs font-medium uppercase tracking-tight text-support-2/70">
        Se precisar, converse com o pediatra.
      </p>
      <Link href="/cuidar#autocuidado" className={secondaryLinkClasses} aria-label="Ver ideias de autocuidado no Cuide-se">
        Ver ideias de autocuidado no Cuide-se
      </Link>
    </div>
  </section>
)

const GteSixState = (props: { stages: StageMeta[]; initialStage: RecipeStageKey }) => (
  <section id="receitas-saudaveis" className={softCardClasses} aria-labelledby="healthy-recipes-title-gte6">
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 id="healthy-recipes-title-gte6" className="text-xl font-semibold text-support-1">
          Receitas Saudáveis
        </h2>
        <p className="text-sm text-support-2/80">
          Sugestões pensadas para cada fase da introdução alimentar, com ingredientes simples e orientações seguras.
        </p>
      </header>
      <StageRecipesClient stages={props.stages} initialStage={props.initialStage} />
    </div>
  </section>
)

export default async function HealthyRecipesSection() {
  const profile = await getBabyProfile()
  const age = sanitizeAge(profile?.babyAgeMonths ?? null)
  const state: RecipesState = age === null ? 'unknown' : age < 6 ? 'lt6' : 'gte6'

  if (state === 'unknown') {
    return <UnknownState />
  }

  if (state === 'lt6') {
    return <LtSixState />
  }

  const stages = buildStageMeta()
  const initialStage = ((age ?? 6) >= 6 ? mapAgeToStage(age ?? 6) : '6-8m')

  return <GteSixState stages={stages} initialStage={initialStage} />
}
