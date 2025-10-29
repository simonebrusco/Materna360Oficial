'use client'

export function MeuDiaClient(props: { dateKey?: string; [key: string]: any }) {
  return <div style={{ padding: '8px' }}>Meu Dia — client ready {props.dateKey ? `(key ${props.dateKey})` : ''}</div>
}

export default MeuDiaClient
