import MeuDiaClient from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  // O <main> e o fundo já estão dentro do MeuDiaClient
  return <MeuDiaClient />;
}
