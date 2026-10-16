import { redirect } from 'next/navigation';
import { getServerSession } from '@/shared/security/session';

export default async function HomePage(): Promise<never> {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  redirect('/dashboard');
}
