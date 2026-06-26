import { Component } from 'react';

/**
 * Catches render/runtime errors in its subtree so one failing component
 * (e.g. the WebGL scene) can never blank the whole page. Renders `fallback`
 * instead (defaults to nothing).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
