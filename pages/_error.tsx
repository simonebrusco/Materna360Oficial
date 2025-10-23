function Error({ statusCode }: { statusCode?: number }) {
  const code = typeof statusCode === 'number' ? statusCode : 500
  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Algo deu errado</h1>
      <p style={{ color: '#444' }}>Código do erro: {code}</p>
      <p style={{ marginTop: '1.5rem', color: '#666' }}>Tente atualizar a página ou volte mais tarde.</p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode?: number }; err?: { statusCode?: number } }) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500
  return { statusCode }
}

export default Error
