'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@supabase/supabase-js'
import { X } from 'lucide-react'

const FOCUSABLE_ELEMENT_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const STORAGE_KEY = 'm360_mindfulness_listened_renove_sua_energia'

const PREFIX_CANDIDATES = [
  'audio/mindfulness/renove-sua-energia/',
  'audio/mindfulness/renove/',
  'public/audio/mindfulness/renove-sua-energia/',
]

const FALLBACK_PUBLIC_PATH = '/audio/mindfulness/renove-sua-energia/'

const AUDIO_EXTENSIONS = /\.(mp3|m4a)$/i

interface TrackItem {
  title: string
  slug: string
  url: string | null
  missing: boolean
}

interface StoredTrack {
  name: string
}

interface RenoveSuaEnergiaModalTriggerProps {
  ariaLabel: string
}

type ManifestEntry = {
  title?: string
  file: string
}

function formatTitleFromFilename(filename: string) {
  return filename
    .replace(AUDIO_EXTENSIONS, '')
    .replace(/_/g, '-')
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export default function RenoveSuaEnergiaModalTrigger({ ariaLabel }: RenoveSuaEnergiaModalTriggerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [listenedSlugs, setListenedSlugs] = useState<string[]>([])
  const hasLoadedTracks = useRef(false)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setListenedSlugs(parsed.filter((value) => typeof value === 'string'))
      }
    } catch (error) {
      console.error('Failed to read Renove sua Energia progress from localStorage', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listenedSlugs))
    } catch (error) {
      console.error('Failed to persist Renove sua Energia progress to localStorage', error)
    }
  }, [listenedSlugs])

  const loadTracks = useCallback(async () => {
    if (hasLoadedTracks.current) {
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setTracks([])
      hasLoadedTracks.current = true
      return
    }

    setIsLoading(true)

    const resolvedPrefixes = new Set<string>()

    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const storage = supabase.storage.from('public')

      let usedPrefix = ''
      let audioFiles: StoredTrack[] = []

      for (const prefix of PREFIX_CANDIDATES) {
        try {
          const { data, error } = await storage.list(prefix, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' },
          })

          if (!error && data && data.length) {
            const filtered = data.filter((file) => AUDIO_EXTENSIONS.test(file.name))
            if (filtered.length) {
              audioFiles = filtered
              usedPrefix = prefix
              break
            }
          }
        } catch (error) {
          console.error('Failed to inspect Supabase prefix', prefix, error)
        }
      }

      const validateUrl = async (url: string | null) => {
        if (!url) {
          return { available: false, url: null }
        }

        try {
          const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
          if (!response.ok) {
            return { available: false, url: null }
          }

          return { available: true, url }
        } catch (error) {
          console.error('Failed to validate mindfulness audio availability', error)
          return { available: false, url: null }
        }
      }

      const buildTrackFromSupabase = async (fileName: string, prefix: string): Promise<TrackItem> => {
        const slug = fileName.replace(AUDIO_EXTENSIONS, '')
        const title = formatTitleFromFilename(fileName)
        const path = `${prefix}${fileName}`

        try {
          const { data } = storage.getPublicUrl(path)
          const publicUrl = data?.publicUrl ?? null
          const { available, url } = await validateUrl(publicUrl)

          if (available && url) {
            resolvedPrefixes.add(prefix)
            return { title, slug, url, missing: false }
          }
        } catch (error) {
          console.error('Failed to generate mindfulness audio URL', error)
        }

        return { title, slug, url: null, missing: true }
      }

      const loadFromManifest = async (): Promise<TrackItem[]> => {
        try {
          const manifestModule = await import('../../data/mindfulness/renove.json')
          const manifest = (manifestModule.default || []) as ManifestEntry[]

          if (!manifest.length) {
            return []
          }

          const tracksFromManifest = await Promise.all(
            manifest.map(async ({ title, file }) => {
              const slug = file.replace(AUDIO_EXTENSIONS, '')
              const displayTitle = title ?? formatTitleFromFilename(file)

              for (const prefix of PREFIX_CANDIDATES) {
                try {
                  const { data } = storage.getPublicUrl(`${prefix}${file}`)
                  const publicUrl = data?.publicUrl ?? null
                  const { available, url } = await validateUrl(publicUrl)

                  if (available && url) {
                    resolvedPrefixes.add(prefix)
                    return { title: displayTitle, slug, url, missing: false }
                  }
                } catch (error) {
                  console.error('Failed to build URL from manifest prefix', prefix, error)
                }
              }

              const fallbackUrl = `${FALLBACK_PUBLIC_PATH}${file}`
              const { available } = await validateUrl(fallbackUrl)

              if (available) {
                resolvedPrefixes.add(FALLBACK_PUBLIC_PATH)
                return { title: displayTitle, slug, url: fallbackUrl, missing: false }
              }

              return { title: displayTitle, slug, url: null, missing: true }
            })
          )

          return tracksFromManifest
        } catch (error) {
          console.error('Failed to load Renove manifest', error)
          return []
        }
      }

      let resolvedTracks: TrackItem[] = []

      if (audioFiles.length && usedPrefix) {
        resolvedTracks = await Promise.all(audioFiles.map((file) => buildTrackFromSupabase(file.name, usedPrefix)))
      } else {
        resolvedTracks = await loadFromManifest()
      }

      console.warn(
        '[RenoveSuaEnergiaModal] prefix:',
        usedPrefix || (resolvedPrefixes.size ? Array.from(resolvedPrefixes).join(', ') : '(fallback)'),
        'files:',
        resolvedTracks.length
      )

      setTracks(resolvedTracks)
    } finally {
      hasLoadedTracks.current = true
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    loadTracks()
    previousActiveElementRef.current = document.activeElement as HTMLElement | null
    const modalElement = modalContentRef.current

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        return
      }

      if (event.key !== 'Tab' || !modalElement) {
        return
      }

      const focusableElements = modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
      if (!focusableElements.length) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => {
      const focusableElements = modalElement?.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
      const target = focusableElements && focusableElements.length ? focusableElements[0] : modalElement
      target?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousActiveElementRef.current?.focus?.()
    }
  }, [isOpen, loadTracks])

  const listenedLookup = useMemo(() => new Set(listenedSlugs), [listenedSlugs])

  const handleToggleListened = (slug: string) => {
    setListenedSlugs((previous) => {
      if (previous.includes(slug)) {
        return previous.filter((value) => value !== slug)
      }
      return [...previous, slug]
    })
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
  }

  const renderTracks = () => {
    if (!tracks.length) {
      return (
        <p className="mt-6 text-base text-support-3">Nenhum áudio disponível no momento.</p>
      )
    }

    return (
      <ul className="mt-6 space-y-4">
        {tracks.map((track) => {
          const isListened = listenedLookup.has(track.slug)
          const isDisabled = track.missing || !track.url

          return (
            <li
              key={track.slug}
              className={`rounded-2xl bg-white/80 px-5 py-4 shadow-soft ring-1 ring-white/60 backdrop-blur-sm transition md:px-6 md:py-5 ${
                isDisabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-support-1 md:text-xl">{track.title}</p>
                  {isDisabled && (
                    <p className="text-sm text-support-3">Áudio indisponível</p>
                  )}
                </div>

                {track.url && !isDisabled ? (
                  <audio
                    controls
                    preload="none"
                    controlsList="nodownload"
                    className="h-11 w-full max-w-xs rounded-full bg-white/90 shadow-inner"
                    src={track.url}
                  />
                ) : null}
              </div>

              <label
                className={`mt-4 inline-flex items-center gap-3 text-base font-medium text-support-1 ${
                  isDisabled ? 'cursor-not-allowed' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isListened}
                  onChange={() => handleToggleListened(track.slug)}
                  disabled={isDisabled}
                  className="h-5 w-5 rounded border-2 border-primary/40 text-primary focus:ring-primary/40"
                />
                Já ouvi
              </label>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF3E79] to-[#FF6B9A] px-6 py-3 text-[18px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,62,121,0.35)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-primary/30 md:px-7 md:py-3.5 md:text-[19px]"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ▶︎
        </span>
        <span>Ouvir</span>
      </button>

      {isMounted && isOpen &&
        createPortal(
          <>
            <div className="modal-overlay" onClick={handleClose} />
            <div className="modal-container" onClick={handleClose}>
              <div
                ref={modalContentRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="renove-modal-title"
                aria-describedby="renove-modal-description"
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                className="relative mx-auto w-full max-w-3xl rounded-[32px] bg-gradient-to-b from-white/95 to-white/85 p-6 shadow-[0_28px_72px_rgba(0,0,0,0.14)] ring-1 ring-white/60 backdrop-blur-md md:p-8"
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-support-1 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col gap-4 pr-4 md:flex-row md:items-center md:justify-between md:pr-8">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">
                      🌞
                    </span>
                    <h2 id="renove-modal-title" className="text-2xl font-extrabold text-support-1 md:text-3xl">
                      Renove sua Energia
                    </h2>
                  </div>
                </div>
                <p id="renove-modal-description" className="mt-4 text-lg leading-relaxed text-support-2 md:text-xl">
                  Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma.
                </p>

                {isLoading ? <p className="mt-6 text-base text-support-3">Carregando áudios...</p> : renderTracks()}

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-support-1 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
