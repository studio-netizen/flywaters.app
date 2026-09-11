import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#f5f0e8' }}>
          <div className="max-w-md text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">Flywaters</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#242242] mb-4">
              Qualcosa è andato storto
            </h1>
            <p className="text-[#8c8c7a] mb-8 leading-relaxed">
              Ricarica la pagina o torna alla home per continuare a navigare.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-full text-sm font-semibold bg-[#242242] text-white hover:opacity-85 transition-opacity"
              >
                Ricarica
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 rounded-full text-sm font-semibold border border-[#242242]/20 text-[#242242] hover:bg-[#242242]/5 transition-colors"
              >
                Torna alla home
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
