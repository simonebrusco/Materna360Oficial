import Link from 'next/link'

type Props = {
  href?: string
  label?: string
  className?: string
}

export default function BackToMaternar({
  href = '/maternar',
  label = 'Voltar para o Maternar',
  className = '',
}: Props) {
  return (
    <div className={className}>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
        aria-label={label}
      >
        <span aria-hidden className="text-base leading-none">
          ←
        </span>
        <span>{label}</span>
      </Link>
    </div>
  )
}
