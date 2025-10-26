import { fnv1a } from '@/app/lib/hash'
import type { QuickIdeasAgeBucket, QuickIdeasLocation } from '@/app/types/quickIdeas'
import type { RecProduct, RecProductKind } from '@/app/types/recProducts'

const UTM_PARAMS = {
  utm_source: 'materna360',
  utm_medium: 'app',
  utm_campaign: 'discover_rec',
} as const

export type RecShelfInput = {
  products: RecProduct[]
  targetBuckets: QuickIdeasAgeBucket[]
  location: QuickIdeasLocation
  dateKey: string
}

export type RecShelfItem = RecProduct & {
  matchedBuckets: QuickIdeasAgeBucket[]
  primaryBucket: QuickIdeasAgeBucket
  trackedAffiliateUrl: string
}

export type RecShelfGroup = {
  kind: RecProductKind
  items: RecShelfItem[]
}

const SHELF_KINDS: RecProductKind[] = ['book', 'toy', 'course', 'printable']

const sortProducts = (products: RecProduct[]): RecProduct[] => {
  return [...products].sort((a, b) => {
    const weightA = a.sortWeight ?? 0
    const weightB = b.sortWeight ?? 0
    if (weightA !== weightB) {
      return weightB - weightA
    }
    return a.title.localeCompare(b.title, 'pt-BR')
  })
}

const appendUtmParams = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl)
    Object.entries(UTM_PARAMS).forEach(([key, value]) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value)
      }
    })
    return url.toString()
  } catch {
    return rawUrl
  }
}

const rotateByDate = <T>(items: T[], key: string): T[] => {
  if (items.length === 0) {
    return items
  }
  const offset = fnv1a(key) % items.length
  if (offset === 0) {
    return items
  }
  return [...items.slice(offset), ...items.slice(0, offset)]
}

const filterByKind = (
  products: RecProduct[],
  kind: RecProductKind,
  targetBuckets: QuickIdeasAgeBucket[],
  location: QuickIdeasLocation
): RecProduct[] => {
  const active = products.filter((product) => product.kind === kind && product.active)
  if (active.length === 0) {
    return []
  }

  const matchesAge = active.filter((product) =>
    product.ageBuckets.some((bucket) => targetBuckets.includes(bucket))
  )

  if (matchesAge.length === 0) {
    return active
  }

  const matchesLocale = matchesAge.filter((product) => {
    if (!product.localeFit || product.localeFit.length === 0) {
      return true
    }
    return product.localeFit.includes(location)
  })

  if (matchesLocale.length > 0) {
    return matchesLocale
  }

  return matchesAge
}

const decorateItems = (
  products: RecProduct[],
  targetBuckets: QuickIdeasAgeBucket[],
  rotationKey: string
): RecShelfItem[] => {
  if (products.length === 0) {
    return []
  }

  const sorted = sortProducts(products)
  const rotated = rotateByDate(sorted, rotationKey)

  return rotated.map((product) => {
    const matchedBuckets = product.ageBuckets.filter((bucket) =>
      targetBuckets.includes(bucket)
    )
    const primaryBucket = matchedBuckets[0] ?? product.ageBuckets[0]
    return {
      ...product,
      matchedBuckets: matchedBuckets.length > 0 ? matchedBuckets : [product.ageBuckets[0]],
      primaryBucket,
      trackedAffiliateUrl: appendUtmParams(product.affiliateUrl),
    }
  })
}

export const buildRecShelves = ({
  products,
  targetBuckets,
  location,
  dateKey,
}: RecShelfInput): RecShelfGroup[] => {
  const uniqueBuckets = Array.from(new Set(targetBuckets))

  return SHELF_KINDS.map((kind) => {
    const filtered = filterByKind(products, kind, uniqueBuckets, location)
    const items = decorateItems(filtered, uniqueBuckets, `${dateKey}:${kind}`)
    return {
      kind,
      items,
    }
  }).filter((group) => group.items.length > 0)
}
