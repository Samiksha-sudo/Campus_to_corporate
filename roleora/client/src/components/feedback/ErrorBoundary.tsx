import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui'

interface Props   { children: ReactNode }
interface State   { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6 text-sm">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
            <Button
              variant="primary"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            >
              Go to home
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
