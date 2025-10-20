export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Materna360</h1>
      <p>App de pé. Conectado ao Builder em breve.</p>
      <p style={{ marginTop: 16 }}>
        Builder Key: <code>{process.env.NEXT_PUBLIC_BUILDER_API_KEY ? "OK" : "FALTA"}</code>
      </p>
    </main>
  );
}
