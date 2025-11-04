'use client'

import { forwardRef } from 'react'
import type { SVGProps } from 'react'
import {
  Search, SlidersHorizontal, Timer, Lightbulb, MapPin,
  ToyBrick, BookOpen, Heart, Star, Crown, Lock, ChevronRight
} from 'lucide-react'

const map = {
  search: Search,
  filters: SlidersHorizontal,
  time: Timer,
  idea: Lightbulb,
  place: MapPin,
  play: ToyBrick,
  books: BookOpen,
  care: Heart,
  star: Star,
  crown: Crown,
  lock: Lock,
  chevron: ChevronRight,
} as const

type IconName = keyof typeof map
type Props = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  name: IconName
  size?: number
  variant?: 'neutral' | 'brand'
  'aria-label'?: string
}

export const AppIcon = forwardRef<SVGSVGElement, Props>(function AppIcon(
  { name, size = 20, variant = 'neutral', className, ...rest }, ref
) {
  const Cmp = map[name]
  const color = variant === 'brand' ? '#ff005e' : '#2f3a56'
  return (
    <Cmp
      ref={ref}
      width={size}
      height={size}
      stroke={color}
      strokeWidth={1.75}
      aria-hidden={rest['aria-label'] ? undefined : true}
      className={['inline-block align-middle', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
})

export default AppIcon
