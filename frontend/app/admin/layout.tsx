import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/auth/adminAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/src/components/ui/Toast';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Admin Dashboard | Smartslate Polaris',
  description: 'Enterprise admin dashboard for Smartslate Polaris v3',
};

// Force dynamic rendering since we check authentication with cookies
export const dynamic = 'force-dynamic';

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin authentication check
  const adminCheck = await checkAdminAccess();

  if (!adminCheck.isAdmin || !adminCheck.user) {
    redirect('/');
  }

  // Wrap admin pages with AuthProvider, ToastProvider, and AdminLayout
  // AdminLayout provides responsive sidebar/header coordination
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminLayout user={adminCheck.user}>{children}</AdminLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
