'use client';

import { useDiscovery } from '@/hooks/useDiscovery';
import { ChatMessage } from '@/components/Discovery/ChatMessage';
import { FinalizationPanel } from '@/components/Discovery/FinalizationPanel';
import { Send, Sparkles, Compass, FileText, Target, Users, Zap, CheckCircle2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { type UIMessage } from 'ai';

interface StarmapData {
  id: string;
  title: string;
  status: string;
  context: Record<string, unknown>;
  blueprint: Record<string, unknown> | null;
  starmapResponses: Array<{
    id: string;
    questionId: string;
    answer: string;
    stage: number;
  }>;
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

async function fetchStarmapData(id: string): Promise<StarmapData> {
  const response = await fetch(`/api/starmaps/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch starmap data');
  }
  return response.json();
}

export function DiscoveryClient({ 
  initialStarmap, 
  initialMessages 
}: { 
  initialStarmap: StarmapData; 
  initialMessages: UIMessage[];
}) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    sendMessage,
    isLoading: isAILoading,
    error,
    approveStage,
    rejectStage,
    submitToolResult,
    currentStage,
  } = useDiscovery(id as string, initialMessages);

  const [input, setInput] = useState('');
  const [unsubmittedForms, setUnsubmittedForms] = useState<Record<string, any>>({});

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAILoading]);

  // Fetch starmap data for blueprint preview (with initial data)
  const { data: starmapData } = useQuery({
    queryKey: ['starmap', id],
    queryFn: () => fetchStarmapData(id as string),
    enabled: !!id,
    initialData: initialStarmap,
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

  const handleFormUpdate = (toolCallId: string, data: Record<string, any>) => {
    setUnsubmittedForms(prev => ({ ...prev, [toolCallId]: data }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasUnsubmittedForms = Object.keys(unsubmittedForms).length > 0;
    if (!input.trim() && !hasUnsubmittedForms) return;

    let finalMessage = input;

    if (hasUnsubmittedForms) {
      const formDataString = JSON.stringify(unsubmittedForms, null, 2);
      finalMessage = input.trim() 
        ? `${input}\n\n[User submitted the following form data along with this message]:\n${formDataString}`
        : `[User submitted the following form data]:\n${formDataString}`;
      
      // Resolve the pending tool calls so the AI doesn't hang waiting for them
      Object.keys(unsubmittedForms).forEach(toolCallId => {
        submitToolResult('askInteractiveQuestions', toolCallId, { status: 'submitted_with_message', data: unsubmittedForms[toolCallId] });
      });
      setUnsubmittedForms({});
    }

    sendMessage({ text: finalMessage });
    setInput('');
  };

  const handleOverride = (stage: number, stageName: string, originalAnswer: string) => {
    const text = `I want to override/update the information for Stage ${stage} (${stageName}).\nOriginal information: ${originalAnswer}\n\nMy update is: `;
    setInput(text);
    const inputEl = document.querySelector('input[name="chat-input"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      setTimeout(() => {
        inputEl.setSelectionRange(text.length, text.length);
      }, 0);
    }
  };

  const handleDeepen = (stage: number, stageName: string, originalAnswer: string) => {
    const text = `I want to deepen the discovery for Stage ${stage} (${stageName}) regarding: ${originalAnswer}\n\nPlease ask more specific questions about: `;
    setInput(text);
    const inputEl = document.querySelector('input[name="chat-input"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      setTimeout(() => {
        inputEl.setSelectionRange(text.length, text.length);
      }, 0);
    }
  };

  const responsesByStage = starmapData?.starmapResponses?.reduce((acc, response) => {
    if (!acc[response.stage]) {
      acc[response.stage] = [];
    }
    acc[response.stage].push(response);
    return acc;
  }, {} as Record<number, typeof starmapData.starmapResponses>) || {};

  return (
    <div className="flex h-screen bg-[#020C1B] text-[#e0e0e0] overflow-hidden pt-16 sm:pt-20">
      {/* Sidebar: Navigation & Context */}
      <aside className="w-60 border-r border-white/5 bg-white/[0.01] flex-col hidden md:flex print:hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-5">Discovery Phase</h2>
          <div className="space-y-0.5">
            {stageNames.map((name, i) => {
              const isActive = currentStage === i + 1;
              const isCompleted = currentStage > i + 1;
              return (
                <div key={name} className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/5' : ''}`}>
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-bold border transition-all duration-500 ${
                    isCompleted ? 'bg-primary-500 border-primary-500 text-[#020C1B]' :
                    isActive ? 'border-primary-500 text-primary-500 shadow-[0_0_10px_rgba(167,218,219,0.15)]' :
                    'border-white/5 text-white/10'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={10} strokeWidth={3} /> : i + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10.5px] font-bold truncate tracking-tight ${isActive ? 'text-white/90' : 'text-white/15'}`}>{name}</span>
                  </div>
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
            <section className="flex-1 flex flex-col min-w-0 bg-[#020C1B] relative print:hidden">
          {/* Chat Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Sparkles size={16} />
              </div>
              <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Strategy Partner</h1>
            </div>
          </header>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
          >
            <div className="max-w-3xl mx-auto space-y-8">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4 shrink-0">
                  Error: {error.message || 'The AI failed to respond. Please check your connection or environment variables and try again.'}
                </div>
              )}
              
              {messages.length === 0 && !error && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full" />
                    <img src="/logo-swirl.png" alt="Polaris" className="w-16 h-16 opacity-20 relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">Initialize Discovery</h3>
                    <p className="text-sm text-white/30 max-w-xs mx-auto">Describe your learning goals to begin the agentic strategy mapping.</p>
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <ChatMessage 
                  key={m.id} 
                  message={m} 
                  approveStage={approveStage} 
                  rejectStage={rejectStage} 
                  submitToolResult={submitToolResult}
                  onFormUpdate={handleFormUpdate}
                />
              ))}

              {isAILoading && (
                <div className="flex items-center gap-4 shrink-0 px-2 py-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
                    <img 
                      src="/logo-swirl.png" 
                      alt="AI is thinking" 
                      className="w-8 h-8 animate-spin relative z-10 opacity-80" 
                      style={{ animationDuration: '3s' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-500/40 animate-pulse">
                    Orchestrating...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01]">
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto group">
              <input
                name="chat-input"
                disabled={isAILoading}
                autoComplete="off"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm text-white placeholder-white/10 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all disabled:opacity-50 font-sans font-light"
                value={input}
                placeholder="Reply to Polaris..."
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isAILoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-[#020C1B] flex items-center justify-center hover:bg-primary-500 transition-all shadow-xl disabled:opacity-20 active:scale-95"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-[9px] text-white/10 uppercase tracking-[0.3em] font-bold">Polaris Agentic Discovery Protocol</p>
            </div>
          </div>
        </section>

        {/* Blueprint Preview Panel */}
        <section className="hidden lg:flex w-[400px] border-l border-white/5 bg-white/[0.005] flex-col">
          <header className="h-14 flex items-center px-6 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(167,218,219,0.8)] animate-pulse" />
              Manifest Preview
            </h2>
          </header>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-none">
            {starmapData && Object.keys(responsesByStage).length > 0 ? (
              <>
                {/* Strategy Blueprint Card */}
                <div className="glass-card p-6 rounded-2xl border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <FileText size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Active Context</h3>
                  </div>

                  {starmapData.context && (
                    <div className="space-y-4">
                      {!!starmapData.context.role && (
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1 font-bold">Primary Role</p>
                          <p className="text-xs text-white/70 font-light leading-relaxed">{String(starmapData.context.role)}</p>
                        </div>
                      )}
                      {!!starmapData.context.goals && (
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1 font-bold">Mission Goals</p>
                          <p className="text-xs text-white/70 font-light leading-relaxed">{String(starmapData.context.goals)}</p>
                        </div>
                      )}
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
                      <div key={stage} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl group/stage relative overflow-hidden transition-all hover:bg-white/[0.03]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                            <StageIcon size={14} />
                          </div>
                          <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{stageName}</h4>
                        </div>
                        <div className="space-y-4">
                          {responses.map((response) => (
                            <div key={response.id} className="group/item">
                              <p className="text-xs text-white/50 leading-relaxed font-light mb-3 italic">
                                &quot;{response.answer}&quot;
                              </p>
                              <div className="flex items-center gap-3 opacity-0 group-hover/item:opacity-100 transition-all duration-300">
                                <button
                                  onClick={() => handleOverride(stage, stageName, response.answer)}
                                  className="text-[9px] font-black text-primary-500 hover:text-primary-400 flex items-center gap-1.5 uppercase tracking-[0.2em] cursor-pointer"
                                >
                                  <Zap size={10} strokeWidth={3} />
                                  Override
                                </button>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <button
                                  onClick={() => handleDeepen(stage, stageName, response.answer)}
                                  className="text-[9px] font-black text-white/30 hover:text-white flex items-center gap-1.5 uppercase tracking-[0.2em] cursor-pointer"
                                >
                                  <Compass size={10} strokeWidth={3} />
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
              <div className="p-12 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.005] flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="text-white/5 mb-6">
                  <Compass size={40} />
                </div>
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                  Await transmissions to begin blueprint mapping.
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
