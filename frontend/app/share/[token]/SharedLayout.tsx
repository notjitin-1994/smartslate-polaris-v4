'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { BlueprintSidebarProvider } from '@/contexts/BlueprintSidebarContext';
import { useSidebar } from '@/contexts/SidebarContext';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  const { user, signOut } = useAuth();
  const { sidebarCollapsed } = useSidebar();

  return (
    <BlueprintSidebarProvider>
      <div className="bg-background text-foreground flex h-screen w-full">
        {/* Fixed Sidebar - Exact same as landing page */}
        <Sidebar user={user} onSignOut={signOut} />

        {/* Main Content Area */}
        <div 
          className={`flex flex-1 flex-col transition-all duration-300 ease-out ${
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-72 lg:ml-80'
          }`}
        >
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </BlueprintSidebarProvider>
  );
}
