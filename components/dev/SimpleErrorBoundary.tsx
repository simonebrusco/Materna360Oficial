'use client';
import React from 'react';

export default class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.error('[Discover] crashed:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm">
          <p>We had a hiccup loading this section.</p>
          <button onClick={() => location.reload()} className="mt-2 rounded border px-2 py-1">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}
