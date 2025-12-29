// app/lib/premium/index.ts
export { PREMIUM_CAPABILITIES, type PremiumCapability, isPremiumCapability } from './capabilities'
export { PREMIUM_FLAGS } from './flags'
export {
  DEFAULT_ENTITLEMENTS,
  type PremiumEntitlements,
  type PremiumTier,
  hasCapability,
  getEntitlements,
} from './entitlements'
