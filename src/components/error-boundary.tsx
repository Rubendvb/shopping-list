'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center gap-3">
            <p className="text-lg font-semibold">Algo deu errado</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Recarregue a página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm underline text-[var(--primary)] hover:no-underline"
            >
              Recarregar
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
