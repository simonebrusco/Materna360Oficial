import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import MaternarClient from './Client';

const toBool = (v: string | undefined, fallback: boolean) => {
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return fallback;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Maternar Hub',
  description: 'Central hub para acessar todos os recursos do Maternar',
};

export default async function MaternarPage(props: {
  searchParams?: Record<string, string | string[]>;
}) {
  // Detect Builder preview mode using multiple reliable methods
  const searchParams = props.searchParams || {};
  const isBuilderPreview =
    searchParams['builder.preview'] === '1' ||
    searchParams['builder.preview'] === true ||
    headers().get('x-builder-preview') === '1' ||
    headers().get('x-builder-preview') === 'true';

  // Check if Maternar Hub is enabled
  const cookieVal = cookies().get('ff_maternar')?.value ?? null;
  const cookieBool =
    cookieVal === '1' ? true : cookieVal === '0' ? false : null;

  const isPreview = process.env.VERCEL_ENV === 'preview';
  const envDefault = toBool(
    process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
    isPreview
  );

  // In Builder preview mode, always enable the hub regardless of feature flag
  let ff_maternar_hub = isBuilderPreview
    ? true
    : cookieBool !== null
      ? cookieBool
      : envDefault;

  // Redirect if feature is disabled (never redirect in Builder preview)
  if (!ff_maternar_hub) {
    redirect('/meu-dia');
  }

  return <MaternarClient />;
}
