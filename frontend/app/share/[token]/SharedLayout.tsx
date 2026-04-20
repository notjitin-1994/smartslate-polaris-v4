'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { BlueprintSidebarProvider } from '@/contexts/BlueprintSidebarContext';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <BlueprintSidebarProvider>
      <div className="bg-background text-foreground flex h-screen w-full">
        {/* Fixed Sidebar - Exact same as landing page */}
        <Sidebar user={user} onSignOut={signOut} />

        {/* Main Content Area */}
        <div className="ml-16 flex flex-1 flex-col md:ml-0">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </BlueprintSidebarProvider>
  );
}
