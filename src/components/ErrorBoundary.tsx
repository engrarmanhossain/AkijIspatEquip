import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EquipGuard ErrorBoundary caught render exception:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    if (window.confirm('Reset local equipment and log storage to nominal defaults?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-white font-sans">
          <div className="max-w-2xl w-full bg-slate-900/90 border border-rose-500/40 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden animate-in fade-in zoom-in-95">
            {/* Top glowing strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600"></div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>EquipGuard Application Error</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Fail-Safe Triggered
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  A client-side component render error occurred. The application was halted safely by the Error Boundary.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 mb-6 space-y-2 overflow-x-auto">
              <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown component crash'}</span>
              </div>
              {this.state.error?.stack && (
                <pre className="text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={this.handleResetStorage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition border border-slate-700"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset Storage & Reload</span>
              </button>
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
