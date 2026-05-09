import { Component } from 'react';

// Catches render-time crashes inside the tree so a busted dataset / component bug
// shows a fallback UI instead of a blank iframe inside Tableau. Logs to console for
// easier remote debugging when running on GitHub Pages.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[BreweryTankMonitor] crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="h-full w-full flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <div className="text-temp-critical font-semibold mb-2">Something went wrong rendering the tanks.</div>
            <pre className="text-xs text-slate-500 whitespace-pre-wrap break-words">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-3 py-1.5 text-xs rounded bg-slate-700 text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
