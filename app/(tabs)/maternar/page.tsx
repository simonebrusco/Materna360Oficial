import { redirect } from 'next/navigation';
import { getServerFlags } from '@/app/lib/flags.server';
import MaternarClient from './Client';

export const metadata = {
  title: 'Maternar Hub',
  description: 'Central hub para acessar todos os recursos do Maternar',
};

export default function MaternarPage() {
  // Get server flags and redirect if flag is disabled
  const flags = getServerFlags();
  if (!flags.FF_MATERNAR_HUB) {
    redirect('/meu-dia');
  }

  return <MaternarClient />;
}
