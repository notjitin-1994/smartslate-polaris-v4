import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { ToastProvider } from '@/components/ui/toast';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <ToastProvider>
        <GlobalLayout>{children}</GlobalLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
