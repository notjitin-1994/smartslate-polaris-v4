import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthHeader } from '@/components/Auth/AuthHeader';
import { Settings, Shield, Key, Bell, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const sections = [
    {
      title: 'Account Information',
      description: 'Manage your email, password, and primary identity.',
      icon: <Shield size={18} className="text-primary-500" />,
      href: '#account',
    },
    {
      title: 'Authentication',
      description: 'Configure 2FA and manage connected devices.',
      icon: <Key size={18} className="text-secondary-500" />,
      href: '#auth',
    },
    {
      title: 'Notifications',
      description: 'Configure email alerts and weekly digests.',
      icon: <Bell size={18} className="text-green-500" />,
      href: '/preferences',
    },
    {
      title: 'Billing & Plan',
      description: 'Manage your Pro Tier subscription and invoices.',
      icon: <CreditCard size={18} className="text-purple-500" />,
      href: '#billing',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#020C1B] text-[#e0e0e0] font-sans selection:bg-primary-500/30 pt-24 pb-20">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[10%] h-[30%] w-[30%] rounded-full bg-primary-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <AuthHeader 
          title="Account Settings" 
          subtitle="Manage your identity, security, and billing preferences."
        />

        <div className="mt-12 space-y-4">
          {sections.map((section, i) => (
            <Link 
              key={i} 
              href={section.href}
              className="group flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-0.5">{section.title}</h3>
                  <p className="text-xs text-white/40 font-light">{section.description}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/20 group-hover:text-primary-500 transition-colors group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
