'use client';

import { useDiscovery } from '@/hooks/useDiscovery';
import { ChatMessage } from '@/components/Discovery/ChatMessage';
import { FinalizationPanel } from '@/components/Discovery/FinalizationPanel';
import { Send, Sparkles, Compass, FileText, Target, Users, Zap, CheckCircle2, ChevronRight, Activity, Layout, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { type UIMessage } from 'ai';
import { motion, AnimatePresence } from 'framer-motion';

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
  Activity,
];

async function fetchStarmapData(id: string): Promise<StarmapData> {
  const response = await fetch(`/api/starmaps/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch starmap data');
  }
  return response.json();
}

function FormattedAnswer({ answer }: { answer: string }) {
  try {
    // Check if it's a JSON string
    if (answer.trim().startsWith('{') || answer.trim().startsWith('[')) {
      const data = JSON.parse(answer);
      if (typeof data === 'object' && data !== null) {
        return (
          <div className="space-y-3 pt-1">
            {Object.entries(data).map(([key, value]) => {
              // Format key: "primary_goal" -> "Primary Goal"
              const formattedKey = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              return (
                <div key={key} className="space-y-1">
                  <p className="text-[8px] text-primary-500/60 uppercase tracking-[0.2em] font-bold">{formattedKey}</p>
                  <p className="text-[11px] text-white/70 leading-relaxed font-light">{String(value)}</p>
                </div>
              );
            })}
          </div>
        );
      }
    }
  } catch (e) {
    // Not valid JSON or parsing failed, fallback to plain text
  }

  return (
    <p className="text-[11px] text-white/60 leading-relaxed font-light italic">
      &quot;{answer}&quot;
    </p>
  );
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

  // Calculate initial stage based on starmapResponses and messages
  const initialStage = useMemo(() => {
    // Check if we have an explicit stage in context
    if (initialStarmap.context?.currentStage) {
      return Number(initialStarmap.context.currentStage);
    }

    if (!initialStarmap.starmapResponses || initialStarmap.starmapResponses.length === 0) {
      return 1;
    }

    const maxResponseStage = Math.max(...initialStarmap.starmapResponses.map(r => r.stage));
    
    // Look for stage transitions in messages (requestApproval calls)
    // If the latest requestApproval was approved, we are in the next stage
    const approvedStages = initialMessages
      .filter(m => (m.role as string) === 'assistant' || (m.role as string) === 'tool')
      .flatMap(m => m.parts)
      .filter(p => (p.type === 'tool-requestApproval' || (p.type === 'dynamic-tool' && (p as any).toolName === 'requestApproval')) && p.state === 'output-available')
      .filter(p => (p as any).output?.approved === true);
    
    if (approvedStages.length > 0) {
      // This is a simplified heuristic, but better than just maxResponseStage
      return Math.min(maxResponseStage + 1, 7);
    }

    return maxResponseStage;
  }, [initialStarmap, initialMessages]);
  
  const {
    messages,
    sendMessage,
    isLoading: isAILoading,
    error,
    approveStage,
    rejectStage,
    submitToolResult,
    currentStage,
  } = useDiscovery(id as string, initialMessages, initialStage);

  const [input, setInput] = useState('');
  const [unsubmittedForms, setUnsubmittedForms] = useState<Record<string, any>>({});

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      // Use a small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
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
      
      // Resolve the pending tool calls
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

  const responsesByStage = useMemo(() => {
    return starmapData?.starmapResponses?.reduce((acc, response) => {
      if (!acc[response.stage]) {
        acc[response.stage] = [];
      }
      acc[response.stage].push(response);
      return acc;
    }, {} as Record<number, typeof starmapData.starmapResponses>) || {};
  }, [starmapData]);

  return (
    <div className="flex h-screen bg-[#020611] text-[#e0e0e0] overflow-hidden pt-16 sm:pt-20">
      {/* Sidebar: Navigation & Context */}
      <aside className="w-56 border-r border-white/5 bg-[#050b18] flex-col hidden md:flex print:hidden relative overflow-hidden">
        {/* Animated background detail */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
        
        <div className="p-5 flex-1 overflow-y-auto scrollbar-none">
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <Activity size={12} className="text-primary-500" />
            <h2 className="text-[9px] font-bold uppercase tracking-[0.3em]">System Progress</h2>
          </div>

          <div className="space-y-1">
            {stageNames.map((name, i) => {
              const isActive = currentStage === i + 1;
              const isCompleted = currentStage > i + 1;
              const isLocked = currentStage < i + 1;

              return (
                <div 
                  key={name} 
                  className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-500 relative ${
                    isActive ? 'bg-primary-500/[0.03] border border-white/5 shadow-[inset_0_0_20px_rgba(167,218,219,0.02)]' : 'border border-transparent'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-stage-indicator"
                      className="absolute left-0 w-0.5 h-4 bg-primary-500 rounded-full"
                    />
                  )}
                  
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black border transition-all duration-700 ${
                    isCompleted ? 'bg-primary-500 border-primary-500 text-[#020C1B] shadow-[0_0_15px_rgba(167,218,219,0.3)]' :
                    isActive ? 'border-primary-500 text-primary-500 shadow-[0_0_10px_rgba(167,218,219,0.1)]' :
                    'border-white/5 text-white/10'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={10} strokeWidth={3} /> : i + 1}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-bold truncate tracking-tight transition-colors duration-500 ${
                      isActive ? 'text-white' : 
                      isCompleted ? 'text-white/40' :
                      'text-white/10'
                    }`}>
                      {name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Protocol Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-[8px] font-bold text-primary-500 uppercase tracking-widest text-shadow-glow">Online</span>
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary-500 shadow-[0_0_10px_rgba(167,218,219,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStage / stageNames.length) * 100}%` }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content: Split Screen */}
      <main className="flex-1 flex flex-col md:flex-row min-w-0 bg-[#020611]">

        {/* Phase 3 & 4: Finalization Panel */}
        {currentStage >= 8 || starmapData?.blueprint ? (
          <FinalizationPanel starmapId={id as string} initialBlueprint={starmapData?.blueprint} />
        ) : (
          <>
            {/* Collaborative Chat */}
            <section className="flex-1 flex flex-col min-w-0 bg-[#020611] relative print:hidden">
          {/* Chat Header */}
          <header className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-md z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
                <Sparkles size={12} />
              </div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Architect Interface</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Secure Link</span>
              </div>
            </div>
          </header>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-10 scroll-smooth relative"
          >
            {/* Subtle background grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="max-w-2xl mx-auto space-y-10 relative z-10">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs mb-4 shrink-0 flex items-center gap-3">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>Protocol Error: {error.message || 'Transmission failed. Retrying...'}</span>
                </div>
              )}
              
              {messages.length === 0 && !error && (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-8 shrink-0">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary-500/15 blur-3xl rounded-full scale-150 animate-pulse" />
                    <img src="/logo-swirl.png" alt="Polaris" className="w-20 h-20 opacity-30 relative z-10" />
                  </motion.div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-heading font-black text-white tracking-tight uppercase tracking-[0.1em]">Initiate Discovery</h3>
                    <p className="text-[11px] text-white/20 max-w-[240px] mx-auto leading-relaxed font-light tracking-wide uppercase">
                      Describe your mission parameters to begin agentic blueprinting.
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false} mode="popLayout">
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
              </AnimatePresence>

              {isAILoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 shrink-0 px-2 py-6"
                >
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 bg-primary-500/30 blur-lg rounded-full" />
                    <img 
                      src="/logo-swirl.png" 
                      alt="Thinking..." 
                      className="w-full h-full animate-spin relative z-10 opacity-60" 
                      style={{ animationDuration: '4s' }}
                    />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary-500/40 animate-pulse">
                    Synthesizing...
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-20">
            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-transparent to-secondary-500/20 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
              
              <input
                name="chat-input"
                disabled={isAILoading}
                autoComplete="off"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 pr-16 text-xs text-white placeholder-white/10 focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500/30 outline-none transition-all disabled:opacity-50 font-sans font-light relative z-10"
                value={input}
                placeholder="Reply to Polaris interface..."
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isAILoading || (!input.trim() && Object.keys(unsubmittedForms).length === 0)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-[#020C1B] flex items-center justify-center hover:bg-primary-500 transition-all shadow-xl disabled:opacity-10 active:scale-95 z-20"
              >
                <Send size={16} strokeWidth={3} />
              </button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] font-black">Quantum Discovery Protocol v4.0</p>
            </div>
          </div>
        </section>

        {/* Blueprint Preview Panel */}
        <section className="hidden lg:flex w-[380px] border-l border-white/5 bg-[#050b18] flex-col relative overflow-hidden shadow-2xl">
          {/* Background detail */}
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-primary-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
          
          <header className="h-12 flex items-center px-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-md z-10">
            <h2 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2.5">
              <Layout size={12} className="text-primary-500/50" />
              Manifest Blueprint
            </h2>
          </header>
          
          <div className="flex-1 p-5 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-none relative z-10">
            {starmapData && (Object.keys(responsesByStage).length > 0 || starmapData.context) ? (
              <>
                {/* Strategy Blueprint Card */}
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-5 rounded-3xl border border-white/[0.08] relative overflow-hidden group hover:border-primary-500/20 transition-all duration-700 shadow-2xl">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 rotate-12">
                    <Activity size={120} />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-8 h-8 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(167,218,219,0.1)]">
                      <FileText size={14} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-white/90 tracking-[0.15em] uppercase">Operational Context</h3>
                      <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-0.5">Strategic Foundation</p>
                    </div>
                  </div>

                  {starmapData.context && (
                    <div className="space-y-5 relative z-10">
                      {!!starmapData.context.role && (
                        <div className="space-y-1.5 group/item">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500/40" />
                            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold group-hover/item:text-primary-500/50 transition-colors">Mission Specialist</p>
                          </div>
                          <p className="text-[11px] text-white/70 font-light leading-relaxed pl-3 border-l border-white/5 group-hover/item:border-primary-500/20 transition-colors">{String(starmapData.context.role)}</p>
                        </div>
                      )}
                      {!!starmapData.context.goals && (
                        <div className="space-y-1.5 group/item">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500/40" />
                            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold group-hover/item:text-primary-500/50 transition-colors">Primary Objectives</p>
                          </div>
                          <p className="text-[11px] text-white/70 font-light leading-relaxed pl-3 border-l border-white/5 group-hover/item:border-primary-500/20 transition-colors">{String(starmapData.context.goals)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Responses by Stage */}
                <div className="space-y-4 pt-2">
                  {Object.entries(responsesByStage)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([stageStr, responses]) => {
                      const stage = parseInt(stageStr);
                      const stageName = stageNames[stage - 1];
                      const StageIcon = stageIcons[stage - 1];
                      
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={stage} 
                          className="bg-white/[0.01] border border-white/[0.05] p-5 rounded-3xl group/stage relative overflow-hidden transition-all duration-500 hover:bg-white/[0.02] hover:border-white/[0.1]"
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/40 border border-white/[0.05] group-hover/stage:text-primary-400 group-hover/stage:border-primary-500/20 transition-all duration-500">
                                <StageIcon size={12} />
                              </div>
                              <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.15em] group-hover/stage:text-white/80 transition-colors">{stageName}</h4>
                            </div>
                            <span className="text-[9px] font-black text-white/5 tabular-nums tracking-tighter group-hover/stage:text-white/10 transition-colors">PHASE 0{stage}</span>
                          </div>
                          
                          <div className="space-y-6">
                            {responses.map((response) => (
                              <div key={response.id} className="group/item relative pl-4 border-l border-white/[0.03] hover:border-primary-500/30 transition-all duration-500 py-1">
                                <FormattedAnswer answer={response.answer} />
                                
                                <div className="flex items-center gap-3 mt-4 opacity-0 group-hover/item:opacity-100 transition-all duration-500 transform translate-y-1 group-hover/item:translate-y-0">
                                  <button
                                    onClick={() => handleOverride(stage, stageName, response.answer)}
                                    className="text-[8px] font-black text-primary-500/80 hover:text-primary-400 flex items-center gap-1.5 uppercase tracking-[0.2em] cursor-pointer"
                                  >
                                    <Zap size={9} strokeWidth={3} />
                                    Adjust
                                  </button>
                                  <div className="w-0.5 h-0.5 rounded-full bg-white/10" />
                                  <button
                                    onClick={() => handleDeepen(stage, stageName, response.answer)}
                                    className="text-[8px] font-black text-white/20 hover:text-white/50 flex items-center gap-1.5 uppercase tracking-[0.2em] cursor-pointer"
                                  >
                                    <ChevronRight size={9} strokeWidth={3} />
                                    Deepen
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="p-12 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.005] flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="text-white/5 mb-6 animate-pulse">
                  <Compass size={40} />
                </div>
                <p className="text-[9px] text-white/10 uppercase tracking-[0.3em] leading-relaxed font-black max-w-[180px]">
                  Awaiting mission parameters for blueprint generation
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
