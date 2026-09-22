import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] flex items-center justify-center px-4 py-8">
          <div className="travel-card max-w-lg w-full p-8 text-center bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
            <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-[#B94A48]/10 dark:bg-[#B94A48]/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-[#B94A48]" />
            </div>
            <h2 className="font-['Manrope',sans-serif] text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-[#66736F] dark:text-[#A3B0AB] mb-6 text-sm leading-relaxed">
              An unexpected error occurred. This has been logged for debugging.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-4 text-xs text-[#B94A48] dark:text-[#D9534F] overflow-auto max-h-40 font-mono">
                <summary className="cursor-pointer text-[#66736F] dark:text-[#A3B0AB] font-medium mb-2 hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors select-none">
                  Error Details
                </summary>
                <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap mt-2 text-[#66736F] dark:text-[#A3B0AB]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={this.handleReset}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#D96C4F] hover:bg-[#C75D43] text-white font-semibold text-sm transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#263238] dark:text-[#F7F5EF] font-medium text-sm transition-colors shadow-sm"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
