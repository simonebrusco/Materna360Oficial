'use client'

import * as React from 'react'

const ROUTES = ['/', '/maternar', '/meu-dia', '/cuidar', '/descobrir', '/eu360']

type Result = {
  route: string
  overflow: boolean
  focusVisible: boolean
  lowContrastCount: number
}

function computeLuminance(rgb: string): number {
  // expects rgb like "rgb(47, 58, 86)" or rgba
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return 1
  const [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(fg: string, bg: string) {
  const L1 = computeLuminance(fg)
  const L2 = computeLuminance(bg)
  const [a, b] = L1 >= L2 ? [L1, L2] : [L2, L1]
  return (a + 0.05) / (b + 0.05)
}

async function probeRoute(route: string): Promise<Result> {
  // Load route in an iframe and run checks inside
  return new Promise(resolve => {
    const iframe = document.createElement('iframe')
    iframe.src = route
    iframe.style.width = '390px'
    iframe.style.height = '800px'
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    document.body.appendChild(iframe)

    const timeout = setTimeout(() => {
      try {
        document.body.removeChild(iframe)
      } catch {
        // ignore
      }
      resolve({ route, overflow: false, focusVisible: false, lowContrastCount: 999 })
    }, 5000)

    iframe.onload = () => {
      clearTimeout(timeout)
      try {
        const doc = iframe.contentDocument!
        const win = iframe.contentWindow!
        const overflow = doc.documentElement.scrollWidth > win.innerWidth

        // Focus visibility check: try to focus first button/link
        const firstInteractive = doc.querySelector(
          'a,button,[role="button"],input,select,textarea'
        ) as HTMLElement | null
        let focusVisible = false
        if (firstInteractive) {
          firstInteractive.focus()
          const style = win.getComputedStyle(firstInteractive)
          // Heuristic: ring or outline visible (not perfect, good enough for smoke)
          const outline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px'
          const boxShadow = style.boxShadow && style.boxShadow !== 'none'
          focusVisible = outline || boxShadow
        }

        // Contrast check on headings and body text elements (heuristic)
        const texts = Array.from(doc.querySelectorAll('h1,h2,h3,p,li,span')).slice(0, 200)
        let lowContrastCount = 0
        texts.forEach(el => {
          const cs = win.getComputedStyle(el as Element)
          const ratio = contrastRatio(cs.color, cs.backgroundColor)
          if (ratio < 4.5) lowContrastCount++
        })

        document.body.removeChild(iframe)
        resolve({ route, overflow, focusVisible, lowContrastCount })
      } catch {
        try {
          document.body.removeChild(iframe)
        } catch {
          // ignore
        }
        resolve({ route, overflow: true, focusVisible: false, lowContrastCount: 999 })
      }
    }
  })
}

export default function VisualSmokePage() {
  const [results, setResults] = React.useState<Result[] | null>(null)
  const [running, setRunning] = React.useState(false)

  const run = async () => {
    setRunning(true)
    const out: Result[] = []
    for (const r of ROUTES) {
      // Small delay to avoid thrashing
      // eslint-disable-next-line no-await-in-loop
      out.push(await probeRoute(r))
    }
    setResults(out)
    setRunning(false)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-[18px] font-semibold mb-2">QA — Visual Smoke (mobile 390×800)</h1>
      <p className="text-[12px] text-[#545454] mb-4">
        Checks overflow, basic focus visibility and heuristic contrast on key text elements.
      </p>
      <button
        onClick={run}
        disabled={running}
        className="rounded-xl px-3 py-2 bg-[#ff005e] text-white font-medium hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
      >
        {running ? 'Running…' : 'Run checks'}
      </button>

      {results && (
        <div className="mt-4 space-y-2">
          {results.map(r => (
            <div key={r.route} className="rounded-xl border border-white/60 p-3 bg-white/80">
              <div className="font-medium text-[14px]">{r.route}</div>
              <div className="text-[12px] text-[#545454] mt-1">
                Overflow: <strong>{r.overflow ? 'YES ⚠️' : 'no ✓'}</strong> •
                Focus visible: <strong>{r.focusVisible ? 'YES ✓' : 'no ⚠️'}</strong> •
                Low-contrast (heuristic): <strong>{r.lowContrastCount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
