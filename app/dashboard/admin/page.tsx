import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const isAdmin = user.publicMetadata?.role === 'ADMIN';
  
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <AdminDashboardClient />;
}