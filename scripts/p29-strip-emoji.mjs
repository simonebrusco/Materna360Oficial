import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

// Arquivos apontados pelo warning
const files = [
  'app/(tabs)/cuidar/autocuidado-inteligente/page.tsx',
  'app/(tabs)/eu360/Client.tsx',
  'app/(tabs)/eu360/components/PdfPremium.tsx',
  'app/(tabs)/eu360/minha-jornada/page.tsx',
  'app/(tabs)/maternar/meu-filho/Client.tsx',
  'app/(tabs)/meu-dia/Client.tsx',
  'app/admin/insights/page.tsx',
  'app/qa/visual-smoke/page.tsx',
  'components/blocks/HealthyRecipes.tsx',
  'components/blocks/MindfulnessCollections.tsx',
  'components/blocks/MindfulnessForMoms.tsx',
  'components/blocks/ProfileForm.tsx',
  'components/blocks/ProfileFormBlocks/RoutineBlock.tsx',
  'components/common/LegalFooter.tsx',
  'components/dev/BuilderErrorBoundary.tsx',
  'components/features/OrgTips/OrgTipsGrid.tsx',
  'components/features/OrganizationTips/OrganizationTipsClient.tsx',
  'components/ideas/IdeasPanel.tsx',
  'components/insights/WeeklyInsights.tsx',
  'components/maternar/CardHub.tsx',
  'components/pdf/ExportButton.tsx',
  'components/planner/AcoesDoDiaSection.tsx',
  'components/planner/CuidarDoMeuFilhoSection.tsx',
  'components/planner/MeuDiaPremium.tsx',
  'components/planner/WeeklyPlannerCore.tsx',
  // 'components/planner/WeeklyPlannerShell.tsx', // PROTEGIDO — NÃO TOCAR
  'components/ui/EmotionTrendDrawer.tsx',
  'components/ui/Header.tsx',
]

// Remove caracteres “emoji-like” mantendo o texto intacto.
// Extended_Pictographic cobre a maioria dos emojis.
// Também removemos variation selectors e ZWJ que costumam acompanhar emojis.
const EMOJI_RE = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu

let changed = 0

for (const rel of files) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) continue

  const before = fs.readFileSync(abs, 'utf8')
  const after = before.replace(EMOJI_RE, '')

  if (after !== before) {
    fs.writeFileSync(abs, after, 'utf8')
    changed++
    console.log(`✓ cleaned: ${rel}`)
  } else {
    console.log(`- no emoji: ${rel}`)
  }
}

console.log(`\nDone. Files changed: ${changed}`)
