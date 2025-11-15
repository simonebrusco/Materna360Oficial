'use client';
import * as React from 'react';

type Props = { children: React.ReactNode; title?: string };
type State = { err?: Error; info?: any };

export default class BuilderErrorBoundary extends React.Component<Props, State> {
  state: State = { err: undefined, info: undefined };

  componentDidCatch(err: Error, info: any) {
    this.setState({ err, info });
    // Expose to iframe console for debugging
    if (typeof window !== 'undefined') {
      (window as any).__BUILDER_LAST_ERROR__ = { err, info };
    }
    console.error('[BuilderErrorBoundary]', err, info);
  }

  render() {
    if (!this.state.err) return this.props.children;

    const messageText = String(this.state.err?.message || this.state.err);
    const stackText = String(this.state.info?.componentStack || '');

    return (
      <main
        style={{
          padding: '16px',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          color: '#111',
          background: 'transparent',
        }}
      >
        <h1 style={{ margin: '8px 0', fontSize: '20px', fontWeight: 'bold' }}>
          ⚠️ Builder Preview Error
        </h1>
        <p style={{ margin: '12px 0', fontSize: '14px', lineHeight: 1.5 }}>
          We caught a rendering error to keep the preview alive. See details below.
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            maxHeight: '300px',
            overflow: 'auto',
            fontSize: '12px',
            lineHeight: 1.4,
            margin: '12px 0',
          }}
        >
          {messageText}
        </pre>
        <details style={{ margin: '12px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
            Component Stack
          </summary>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: 1.4,
              maxHeight: '300px',
              overflow: 'auto',
              marginTop: '8px',
            }}
          >
            {stackText}
          </pre>
        </details>
      </main>
    );
  }
}
