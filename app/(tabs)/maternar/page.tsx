export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Maternar Hub',
};

export default async function MaternarPage() {
  // Redirect to meu-dia as maternar is temporarily disabled
  const { redirect } = await import('next/navigation');
  redirect('/meu-dia');
}
