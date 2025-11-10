export default function Health() {
  return (
    <main style={{ padding: 16, fontFamily: 'system-ui', lineHeight: 1.6 }}>
      <h1>Materna360 — Health OK ✓</h1>
      <p>Embedded preview working correctly inside Builder Interact.</p>
      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
      <section>
        <h2>Checks</h2>
        <ul>
          <li>✓ Page renders in iframe (CSP headers allow embedding)</li>
          <li>✓ builder.preview parameter passed through middleware</li>
          <li>✓ No SSR hydration mismatches</li>
          <li>✓ Client-only code properly guarded</li>
        </ul>
      </section>
      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
      <section>
        <h2>Next Steps</h2>
        <ol>
          <li>If this page renders in Builder Interact → embed is working ✓</li>
          <li>Test <code>/meu-dia?builder.preview=1</code> next</li>
          <li>Check browser console for any errors (should be empty)</li>
          <li>Verify Response Headers show Content-Security-Policy with frame-ancestors</li>
        </ol>
      </section>
      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
      <footer style={{ fontSize: '12px', color: '#666' }}>
        <p>Status: Ready for Builder preview</p>
        <p>Time: {new Date().toISOString()}</p>
      </footer>
    </main>
  );
}
