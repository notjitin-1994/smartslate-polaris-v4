import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { ToastProvider } from '@/src/components/ui/Toast';

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
