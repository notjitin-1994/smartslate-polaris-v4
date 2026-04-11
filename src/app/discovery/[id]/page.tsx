'use client';

import { useDiscovery } from '@/hooks/useDiscovery';
import { ChatMessage } from '@/components/Discovery/ChatMessage';

import { FinalizationPanel } from '@/components/Discovery/FinalizationPanel';
import { Send, User, Bot, Sparkles, Compass, FileText, Target, Users, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface StarmapData {
  id: string;
  title: string;
  status: string;
  context: Record<string, unknown>;
  blueprint: Record<string, unknown> | null;
  responses: Array<{
    id: string;
    questionId: string;
    answer: string;
    stage: number;
  }>;
}

async function fetchStarmapData(id: string): Promise<StarmapData> {
  const response = await fetch(`/api/starmaps/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch starmap data');
  }
  return response.json();
}

const stageNames = [
  'Discovery & Goals',
  'Audience Analysis',
  'Constraints & Resources',
  'Content Strategy',
  'Delivery Channels',
  'Assessment Methods',
  'Success Metrics',
];

const stageIcons = [
  Target,
  Users,
  FileText,
  Sparkles,
  Zap,
  Compass,
  Target,
];

export default function DiscoveryPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    approveStage,
    rejectStage,
    currentStage,
  } = useDiscovery(id as string);

  const [input, setInput] = useState('');

  // Fetch starmap data for blueprint preview
  const { data: starmapData, isLoading: isLoadingData } = useQuery({
    queryKey: ['starmap', id],
    queryFn: () => fetchStarmapData(id as string),
    enabled: !!id,
    // Removed refetchInterval: 5000
  });

  // Setup Supabase Realtime for instant updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`starmap-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'starmap_responses',
          filter: `starmap_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['starmap', id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'starmaps',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['starmap', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient, supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleOverride = (stage: number, stageName: string, originalAnswer: string) => {
    const text = `I want to override/update the information for Stage ${stage} (${stageName}).\nOriginal information: ${originalAnswer}\n\nMy update is: `;
    setInput(text);
    // Focus input
    const inputEl = document.querySelector('input[name="chat-input"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      // Move cursor to end
      setTimeout(() => {
        inputEl.setSelectionRange(text.length, text.length);
      }, 0);
    }
  };

  const handleDeepen = (stage: number, stageName: string, originalAnswer: string) => {
    const text = `I want to deepen the discovery for Stage ${stage} (${stageName}) regarding: ${originalAnswer}\n\nPlease ask more specific questions about: `;
    setInput(text);
    // Focus input
    const inputEl = document.querySelector('input[name="chat-input"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      setTimeout(() => {
        inputEl.setSelectionRange(text.length, text.length);
      }, 0);
    }
  };

  // Group responses by stage
  const responsesByStage = starmapData?.responses?.reduce((acc, response) => {
    if (!acc[response.stage]) {
      acc[response.stage] = [];
    }
    acc[response.stage].push(response);
    return acc;
  }, {} as Record<number, typeof starmapData.responses>) || {};

  return (
    <div className="flex h-screen bg-brand-bg text-[#e0e0e0] overflow-hidden pt-[var(--nav-height-mobile)] lg:pt-[var(--nav-height-desktop)]">
      {/* Sidebar: Navigation & Context */}
      <aside className="w-64 border-r border-white/5 bg-white/[0.02] flex-col hidden md:flex print:hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-heading font-bold text-white uppercase tracking-widest">Discovery Phase</h2>
          <div className="mt-4 space-y-3">
            {stageNames.map((name, i) => {
              const StageIcon = stageIcons[i];
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    currentStage > i + 1 ? 'bg-primary-500 border-primary-500 text-brand-bg' :
                    currentStage === i + 1 ? 'border-primary-500 text-primary-500 shadow-[0_0_10px_rgba(167,218,219,0.3)]' :
                    'border-white/10 text-white/20'
                  }`}>
                    {i + 1}
                  </div>
                  <StageIcon size={14} className={`${
                    currentStage === i + 1 ? 'text-primary-500' : 'text-white/30'
                  }`} />
                  <span className={`text-xs font-medium ${currentStage === i + 1 ? 'text-white' : 'text-white/30'}`}>{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content: Split Screen */}
      <main className="flex-1 flex flex-col md:flex-row min-w-0">

        {/* Phase 3 & 4: Finalization Panel */}
        {currentStage >= 8 || starmapData?.blueprint ? (
          <FinalizationPanel starmapId={id as string} initialBlueprint={starmapData?.blueprint} />
        ) : (
          <>
            {/* Collaborative Chat */}
            <section className="flex-1 flex flex-col min-w-0 bg-brand-bg relative print:hidden">
          {/* Chat Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Sparkles size={18} />
              </div>
              <h1 className="font-heading font-bold text-white tracking-tight">AI Strategy Partner</h1>
            </div>
          </header>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-6 space-y-6 relative"
            style={{
              backgroundImage: "url('/logo-swirl.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Dark overlay to ensure text readability while keeping the swirl visible */}
            <div className="absolute inset-0 bg-[#020C1B]/95 z-0" />

            <div className="relative z-10 space-y-6 h-full flex flex-col">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4 shrink-0">
                  Error: {error.message || 'The AI failed to respond. Please check your connection or environment variables and try again.'}
                </div>
              )}
              {messages.length === 0 && !error && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary-500 animate-pulse">
                    <Bot size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Initialize Discovery</h3>
                  <p className="text-sm text-white/40">Type your project goals below to start the agentic discovery process.</p>
                </div>
              )}

              {messages.map((m) => (
                <ChatMessage 
                  key={m.id} 
                  message={m} 
                  approveStage={approveStage} 
                  rejectStage={rejectStage} 
                />
              ))}

              {isLoading && (
                <div className="flex gap-4 animate-pulse shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 shrink-0" />
                  <div className="glass-card h-12 w-32 rounded-2xl" />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/5">
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
              <input
                name="chat-input"
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm text-white placeholder-white/20 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:opacity-50"
                value={input}
                placeholder="Ask or answer anything..."
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary-500 text-brand-bg flex items-center justify-center hover:bg-primary-400 transition disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
            <div className="mt-3 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-widest">Polaris Agentic Protocol v4.0.1</p>
            </div>
          </div>
        </section>

        {/* Blueprint Preview Panel */}
        <section className="hidden lg:flex w-[400px] border-l border-white/5 bg-white/[0.01] flex-col">
          <header className="h-16 flex items-center px-6 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(167,218,219,0.8)] animate-pulse" />
              Live Blueprint Preview
            </h2>
          </header>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto overflow-x-hidden">
            {isLoadingData ? (
              <div className="glass-card p-6 rounded-2xl border-dashed border-white/10 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mb-4" />
                <p className="text-xs text-white/30">Loading blueprint data...</p>
              </div>
            ) : starmapData && Object.keys(responsesByStage).length > 0 ? (
              <>
                {/* Strategy Blueprint Card */}
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <FileText size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-white">Strategy Blueprint</h3>
                  </div>

                  {starmapData.context && (
                    <div className="space-y-3">
                      {(() => {
                        const role = starmapData.context?.role;
                        if (role && typeof role === 'string') {
                          return (
                            <div>
                              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Role</p>
                              <p className="text-xs text-white/80">{role}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {(() => {
                        const goals = starmapData.context?.goals;
                        if (goals && typeof goals === 'string') {
                          return (
                            <div>
                              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Goals</p>
                              <p className="text-xs text-white/80">{goals}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Responses by Stage */}
                {Object.entries(responsesByStage)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([stageStr, responses]) => {
                    const stage = parseInt(stageStr);
                    const stageName = stageNames[stage - 1];
                    const StageIcon = stageIcons[stage - 1];
                    return (
                      <div key={stage} className="glass-card p-5 rounded-2xl group/stage relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                            <StageIcon size={14} />
                          </div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-tight">Stage {stage}: {stageName}</h4>
                        </div>
                        <div className="space-y-4">
                          {responses.map((response) => (
                            <div key={response.id} className="group/item">
                              <p className="text-xs text-white/60 leading-relaxed mb-2">
                                {response.answer}
                              </p>
                              <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOverride(stage, stageName, response.answer)}
                                  className="text-[10px] font-bold text-primary-500 hover:text-primary-400 flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                                >
                                  <Zap size={10} />
                                  Override
                                </button>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <button
                                  onClick={() => handleDeepen(stage, stageName, response.answer)}
                                  className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                                >
                                  <Compass size={10} />
                                  Deepen
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </>
            ) : (
              <div className="glass-card p-6 rounded-2xl border-dashed border-white/10 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="text-white/10 mb-4">
                  <Compass size={48} />
                </div>
                <p className="text-xs text-white/30 leading-relaxed uppercase tracking-tighter">
                  Answer the AI&apos;s questions to begin drafting the Strategy Blueprint.
                </p>
              </div>
            )}
          </div>
        </section>
        </>
        )}
      </main>
    </div>
  );
}
