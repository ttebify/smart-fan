import { Component, type ReactNode } from 'react';

const KEY = 'gl-retries';

/**
 * The browser sometimes refuses a 3D context (GPU busy, or too many reloads in a row).
 * Retry a few times by reloading, then explain instead of leaving a blank page.
 */
export class GLFallback extends Component<{ children: ReactNode }, { failed: boolean; retrying: boolean }> {
  state = { failed: false, retrying: false };

  static getDerivedStateFromError() {
    return { failed: true, retrying: +(sessionStorage.getItem(KEY) ?? 0) < 3 };
  }

  componentDidCatch() {
    const tries = +(sessionStorage.getItem(KEY) ?? 0);
    if (tries < 3) {
      sessionStorage.setItem(KEY, String(tries + 1));
      setTimeout(() => location.reload(), 1200);
    } else sessionStorage.removeItem(KEY);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fatal" role="alert">
        {this.state.retrying ? 'Starting 3D graphics…' : (
          <>
            <b>The 3D scene could not load.</b>
            Close other tabs using 3D, then reload. If that fails, restart the browser.
          </>
        )}
      </div>
    );
  }
}
