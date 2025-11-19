import { MaternarClient } from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Maternar Hub',
  description: 'Central hub para acessar todos os recursos do Maternar',
};

export default function MaternarPage() {
  return <MaternarClient />;
}
