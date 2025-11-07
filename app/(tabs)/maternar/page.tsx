import { redirect } from 'next/navigation';
import { isEnabled } from '@/app/lib/flags';
import MaternarClient from './Client';

export const metadata = {
  title: 'Maternar Hub',
  description: 'Central hub para acessar todos os recursos do Maternar',
};

export default function MaternarPage() {
  // Redirect if flag is disabled
  if (!isEnabled('FF_MATERNAR_HUB')) {
    redirect('/meu-dia');
  }

  return <MaternarClient />;
}
