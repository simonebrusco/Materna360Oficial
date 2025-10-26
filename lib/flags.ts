export interface FeatureFlags {
  enableMeditationFeature: boolean
  enableGamification: boolean
  enableAIRecommendations: boolean
  enableMentoringFeature: boolean
  enableCommunity: boolean
  'discover.recShelf': boolean
}

const defaultFlags: FeatureFlags = {
  enableMeditationFeature: true,
  enableGamification: true,
  enableAIRecommendations: true,
  enableMentoringFeature: true,
  enableCommunity: false,
  'discover.recShelf': false,
}

export const getFeatureFlags = (): FeatureFlags => {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'development'

  if (env === 'production') {
    return {
      ...defaultFlags,
      enableCommunity: true,
    }
  }

  return defaultFlags
}

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags()
  return flags[feature]
}
