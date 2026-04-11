import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthHeader } from '@/components/Auth/AuthHeader';
import { Bell, Palette, Globe, Shield } from 'lucide-react';

export default async function PreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const preferenceGroups = [
    {
      title: 'Email Notifications',
      icon: <Bell size={16} className="text-primary-500" />,
      items: [
        { id: 'updates', label: 'Product Updates', description: 'Receive news about features and platform updates.', defaultChecked: true },
        { id: 'marketing', label: 'Marketing & Offers', description: 'Promotions and special offers for Pro tier.', defaultChecked: false },
        { id: 'activity', label: 'Activity Summaries', description: 'Weekly digest of your starmap activity.', defaultChecked: true },
      ]
    },
    {
      title: 'Appearance',
      icon: <Palette size={16} className="text-secondary-500" />,
      items: [
        { id: 'dark-mode', label: 'Dark Mode', description: 'Force dark theme across the application.', defaultChecked: true },
        { id: 'animations', label: 'Reduce Motion', description: 'Minimize UI animations for accessibility.', defaultChecked: false },
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#020C1B] text-[#e0e0e0] font-sans selection:bg-primary-500/30 pt-24 pb-20">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute bottom-[20%] right-[20%] h-[40%] w-[40%] rounded-full bg-primary-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <AuthHeader 
          title="Preferences" 
          subtitle="Customize your workspace experience and notification settings."
        />

        <div className="mt-12 space-y-8">
          {preferenceGroups.map((group, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  {group.icon}
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">{group.title}</h2>
              </div>
              
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{item.label}</h4>
                      <p className="text-xs text-white/40">{item.description}</p>
                    </div>
                    {/* Custom Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              className="px-8 py-3 rounded-xl bg-white text-[#020C1B] font-bold text-sm hover:bg-white/90 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
