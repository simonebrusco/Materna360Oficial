'use client'

import React from 'react'

interface SectionBoundaryProps {
  children: React.ReactNode
  title?: string
}

interface SectionBoundaryState {
  error?: Error
}

export default class SectionBoundary extends React.Component<SectionBoundaryProps, SectionBoundaryState> {
  constructor(props: SectionBoundaryProps) {
    super(props)
    this.state = { error: undefined }
  }

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SectionBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h3 className="font-semibold text-rose-700">Falha ao carregar {this.props.title ?? 'seção'}.</h3>
          <p className="mt-1 text-sm text-rose-800/80">Verifique sua conexão ou tente novamente mais tarde.</p>
        </div>
      )
    }

    return <>{this.props.children}</>
  }
}
