import { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Caught runtime rendering error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-cyan-400 bg-slate-900/90 border border-cyan-500/30 rounded-lg max-w-lg mx-auto my-8">
          <h2 className="text-xl font-bold tracking-wider uppercase mb-2 text-amber-400">
            {this.props.fallbackTitle || 'Subsystem Malfunction'}
          </h2>
          <p className="text-sm text-slate-300 mb-4 text-center">
            A rendering or component fault was isolated. The colony failsafe protocol prevented a crash.
          </p>
          <pre className="text-xs bg-slate-950 p-3 rounded border border-slate-800 text-red-400 overflow-x-auto w-full mb-4">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono tracking-widest uppercase rounded shadow transition"
          >
            Re-engage System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
