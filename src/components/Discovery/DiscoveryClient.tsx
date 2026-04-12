'use client';

import { useDiscovery } from '@/hooks/useDiscovery';
import { ChatMessage } from '@/components/Discovery/ChatMessage';
import { FinalizationPanel } from '@/components/Discovery/FinalizationPanel';
import { Send, Sparkles, Compass, FileText, Target, Users, Zap, CheckCircle2, ChevronRight, Activity, Layout, ShieldCheck, Menu, X, Info } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { type UIMessage } from 'ai';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGE_NAMES } from '@/lib/constants';

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
    if (answer.trim().startsWith('{') || answer.trim().startsWith('[')) {
      const data = JSON.parse(answer);
      if (typeof data === 'object' && data !== null) {
        return (
          <div className="space-y-3 pt-1">
            {Object.entries(data).map(([key, value]) => {
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
  } catch (e) {}

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
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manifestOpen, setManifestOpen] = useState(false);

  // Calculate initial stage based on starmapResponses and messages
  const initialStage = useMemo(() => {
    if (initialStarmap.context?.currentStage) {
      return Number(initialStarmap.context.currentStage);
    }

    if (!initialStarmap.starmapResponses || initialStarmap.starmapResponses.length === 0) {
      return 1;
    }

    const maxResponseStage = Math.max(...initialStarmap.starmapResponses.map(r => r.stage));
    
    const approvedStages = initialMessages
      .filter(m => (m.role as string) === 'assistant' || (m.role as string) === 'tool')
      .flatMap(m => m.parts)
      .filter(p => (p.type === 'tool-requestApproval' || (p.type === 'dynamic-tool' && (p as any).toolName === 'requestApproval')) && p.state === 'output-available')
      .filter(p => (p as any).output?.approved === true);
    
    if (approvedStages.length > 0) {
      return Math.min(maxResponseStage + 1, 7);
    }

    return maxResponseStage;
  }, [initialStarmap, initialMessages]);
  
  const {
    messages,
    sendMessage,
    isLoading: isAILoading,
    status,
    error,
    regenerate,
    connectionStatus,
    approveStage,
    rejectStage,
    submitToolResult,
    currentStage,
  } = useDiscovery(id as string, initialMessages, initialStage);

  // Dynamic Deduplication Engine
  const lastUniqueMessagesRef = useRef<UIMessage[]>([]);
  const uniqueMessages = useMemo(() => {
    // Optimization: During active turns, return the raw messages array.
    // This is fast and ensures the latest user message is visible instantly.
    // Full deduplication will re-run once the turn finishes.
    if (status === 'streaming' || status === 'submitted') {
      return messages;
    }

    const messageMap = new Map<string, UIMessage>();
    const completedToolCalls = new Set<string>();
    
    // First pass: Identify all completed tool results in the history
    messages.forEach(msg => {
      msg.parts?.forEach(part => {
        if (part.type === 'tool-result' || (part as any).state === 'result') {
          completedToolCalls.add((part as any).toolCallId);
        }
      });
    });

    // Second pass: Filter messages and parts
    messages.forEach(msg => {
      const existing = messageMap.get(msg.id);
      
      // Filter out parts that are redundant tool invocations for already completed calls
      const cleanParts = msg.parts?.filter(part => {
        const toolCallId = (part as any).toolCallId;
        if (toolCallId && part.type === 'tool-invocation' && completedToolCalls.has(toolCallId)) {
          // If we have a result for this elsewhere, we don't need the 'pending' invocation part
          return false;
        }
        return true;
      });

      if (cleanParts && cleanParts.length === 0) return; // Skip empty messages

      if (!existing) {
        messageMap.set(msg.id, { ...msg, parts: cleanParts });
      } else {
        const existingParts = existing.parts?.length || 0;
        const newParts = cleanParts?.length || 0;
        if (newParts > existingParts) {
          messageMap.set(msg.id, { ...msg, parts: cleanParts });
        }
      }
    });
    
    const result = Array.from(messageMap.values());
    lastUniqueMessagesRef.current = result;
    return result;
  }, [messages, status]);

  // Client-side logging for message state
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    
    if (uniqueMessages.length > 0) {
      const last = uniqueMessages[uniqueMessages.length - 1];
      console.log(`[DiscoveryClient] State Synced. Unique: ${uniqueMessages.length}. Latest: ${last.role}, Status: ${status}`);
    }
  }, [uniqueMessages, status]);

  const [input, setInput] = useState('');
  const [unsubmittedForms, setUnsubmittedForms] = useState<Record<string, any>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Viewport-safe keyboard handling
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    
    const viewport = window.visualViewport;
    const handleResize = () => {
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${viewport.height}px`
      );
    };
    
    viewport.addEventListener('resize', handleResize);
    handleResize();
    
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Intelligent Scroll Anchoring
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // Stay at bottom if we were already close to the bottom
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isAtBottom || isAILoading) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: isAILoading ? 'auto' : 'smooth'
        });
      }
    });

    const scrollContent = container.firstElementChild;
    if (scrollContent) observer.observe(scrollContent);

    return () => observer.disconnect();
  }, [messages, isAILoading]);

  const hasPendingData = Object.keys(unsubmittedForms).length > 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasUnsubmittedForms = Object.keys(unsubmittedForms).length > 0;
    console.log('[DiscoveryClient] Submitting. Input:', !!input.trim(), 'Forms:', Object.keys(unsubmittedForms).length);

    if (!input.trim() && !hasUnsubmittedForms) return;

    let finalMessage = input;

    if (hasUnsubmittedForms) {
      // Submit results for all pending forms via native addToolOutput
      for (const [toolCallId, formData] of Object.entries(unsubmittedForms)) {
        console.log('[DiscoveryClient] Submitting form:', toolCallId);
        await submitToolResult('askInteractiveQuestions', toolCallId, formData);
      }
      setUnsubmittedForms({});
    }

    // Only send a text message if the user typed something
    // Form data is handled via addToolOutput above — no need for text envelopes
    if (finalMessage.trim()) {
      sendMessage({ text: finalMessage });
    }
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
    setManifestOpen(false);
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
    setManifestOpen(false);
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 flex-1 overflow-y-auto scrollbar-none">
        <div className="flex items-center gap-2 mb-8 opacity-40">
          <Activity size={12} className="text-primary-500" />
          <h2 className="text-[9px] font-bold uppercase tracking-[0.3em]">System Progress</h2>
        </div>

        <div className="space-y-1">
          {STAGE_NAMES.map((name, i) => {
            const isActive = currentStage === i + 1;
            const isCompleted = currentStage > i + 1;

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
            <span className="text-[8px] font-bold text-primary-500 uppercase tracking-widest text-shadow-glow text-primary-500 shadow-[0_0_8px_rgba(167,218,219,0.4)]">Online</span>
          </div>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary-500 shadow-[0_0_10px_rgba(167,218,219,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStage / STAGE_NAMES.length) * 100}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </div>
      </div>
    </div>
  );

  const ManifestContent = () => (
    <div className="flex-1 p-5 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-none relative z-10">
      {starmapData && (Object.keys(responsesByStage).length > 0 || starmapData.context) ? (
        <div className="space-y-4">
          {STAGE_NAMES.map((stageName, i) => {
            const stage = i + 1;
            const responses = responsesByStage[stage] || [];
            const StageIcon = stageIcons[i];
            
            // Check if this stage has any data (context or responses)
            const hasContext = stage === 1 && (starmapData.context?.role || starmapData.context?.goals);
            const hasResponses = responses.length > 0;
            
            if (!hasContext && !hasResponses) return null;

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
                  {/* Stage 1 special context */}
                  {stage === 1 && starmapData.context && (
                    <div className={`space-y-5 ${hasResponses ? 'mb-6 pb-6 border-b border-white/5' : ''}`}>
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
                          className="text-[8px] font-black text-white/20 hover:text-white/50 flex items-center gap-1 uppercase tracking-[0.2em] cursor-pointer"
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
  );

  return (
    <div className="flex h-dvh bg-[#020611] text-[#e0e0e0] overflow-hidden">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#020611]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-[100] md:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/60 active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Stage {currentStage}</span>
            <h1 className="text-[11px] font-bold text-white tracking-tight uppercase truncate max-w-[120px]">
              {STAGE_NAMES[currentStage - 1]}
            </h1>
          </div>
        </div>
        <button 
          onClick={() => setManifestOpen(true)}
          className="px-4 h-10 rounded-xl bg-primary-500 text-[#020C1B] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(167,218,219,0.3)] active:scale-95 transition-all"
        >
          <Layout size={14} strokeWidth={2.5} />
          Manifest
        </button>
      </header>

      {/* Desktop Sidebar: Navigation & Context */}
      <aside className="w-56 border-r border-white/5 bg-[#050b18] flex-col hidden md:flex print:hidden relative overflow-hidden pt-20">
        <SidebarContent />
      </aside>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#050b18] border-r border-white/10 z-[120] md:hidden flex flex-col pt-6"
            >
              <div className="flex items-center justify-between px-5 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Activity size={14} />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Progress</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40"
                >
                  <X size={16} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Manifest Drawer */}
      <AnimatePresence>
        {manifestOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#020611] z-[150] md:hidden flex flex-col"
          >
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-5 shrink-0 bg-[#050b18]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
                  <Layout size={16} />
                </div>
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Manifest Blueprint</h2>
              </div>
              <button 
                onClick={() => setManifestOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <ManifestContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Split Screen */}
      <main className="flex-1 flex flex-col md:flex-row min-w-0 bg-[#020611] pt-16 md:pt-20 overflow-hidden min-h-0">

        {/* Phase 3 & 4: Finalization Panel */}
        {currentStage >= 8 || starmapData?.blueprint ? (
          <FinalizationPanel starmapId={id as string} initialBlueprint={starmapData?.blueprint} />
        ) : (
          <>
            {/* Collaborative Chat */}
            <section className="flex-1 flex flex-col min-w-0 bg-[#020611] relative print:hidden min-h-0">
          {/* Chat Header (Desktop only) */}
          <header className="hidden md:flex h-12 items-center justify-between px-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-md z-20">
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
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 md:space-y-10 scroll-smooth relative"
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="max-w-2xl mx-auto space-y-8 md:space-y-10 relative z-10">
              {/* Connection Status Alert */}
              <AnimatePresence>
                {connectionStatus === 'weak' && status === 'streaming' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] flex items-center justify-between gap-4 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="animate-pulse" />
                      <span>The architectural uplink is weak. Tokens are arriving slowly.</span>
                    </div>
                    <button 
                      onClick={() => regenerate()}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-[#020C1B] font-black uppercase tracking-widest active:scale-95 transition-all shrink-0"
                    >
                      Retry Turn
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="p-5 rounded-3xl bg-red-500/5 border border-red-500/10 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-[13px] font-black text-white uppercase tracking-widest">Protocol Interruption</h3>
                      <p className="text-[11px] text-white/50 leading-relaxed font-light">
                        {error.message?.includes('overloaded') 
                          ? 'The architectural engine is currently handling high volume. Please wait a moment and try again.'
                          : `Transmission failure detected: ${error.message || 'Unknown protocol error.'}`}
                      </p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-all active:scale-95"
                      >
                        Re-sync Interface
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {messages.length === 0 && !error && (
                <div className="py-16 md:py-24 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 shrink-0">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary-500/15 blur-3xl rounded-full scale-150 animate-pulse" />
                    <img src="/logo-swirl.png" alt="Polaris" className="w-16 h-16 md:w-20 md:h-20 opacity-30 relative z-10" />
                  </motion.div>
                  <div className="space-y-3">
                    <h3 className="text-base md:text-lg font-heading font-black text-white tracking-tight uppercase tracking-[0.1em]">Initiate Discovery</h3>
                    <p className="text-[10px] md:text-[11px] text-white/20 max-w-[200px] md:max-w-[240px] mx-auto leading-relaxed font-light tracking-wide uppercase">
                      Describe your mission parameters to begin agentic blueprinting.
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {uniqueMessages.map((m, index) => (
                  <ChatMessage 
                    key={m.id} 
                    message={m} 
                    approveStage={approveStage} 
                    rejectStage={rejectStage} 
                    submitToolResult={submitToolResult}
                    onFormUpdate={handleFormUpdate}
                    isLast={index === uniqueMessages.length - 1}
                    isChatLoading={status === 'streaming' || status === 'submitted'}
                  />
                ))}

                {status === 'submitted' && (
                  <motion.div
                    key="ghost-bubble"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="w-8 h-8 rounded-full border border-white/[0.08] shadow-[0_0_20px_rgba(167,218,219,0.05)] flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white/40 animate-pulse" />
                    </div>
                    <div className="py-3.5 px-5 rounded-[20px] rounded-tl-sm bg-white/5 backdrop-blur-xl border border-white/[0.05]">
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 border-t border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-20">
            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-transparent to-secondary-500/20 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col w-full bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary-500/30 focus-within:ring-1 focus-within:ring-primary-500/30 transition-all">
                {/* Pending Data Indicator */}
                <AnimatePresence>
                  {hasPendingData && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-primary-500/10 border-b border-primary-500/20 px-4 py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-[9px] font-black text-primary-400 uppercase tracking-widest">Active Data Uplink</span>
                      </div>
                      <span className="text-[8px] text-primary-500/60 font-bold uppercase tracking-tighter">Will be sent with next message</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center relative">
                  <textarea
                    ref={textareaRef}
                    name="chat-input"
                    rows={1}
                    disabled={isAILoading}
                    autoComplete="off"
                    className="w-full bg-transparent px-5 md:px-6 py-3.5 md:py-4 pr-14 md:pr-16 text-[13px] text-white placeholder-white/10 outline-none transition-all disabled:opacity-50 font-sans font-light resize-none scrollbar-none"
                    value={input}
                    placeholder="Reply to Polaris interface..."
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                  />
                  
                  <div className="absolute right-2 md:right-3 flex items-center h-full">
                    <button
                      type="submit"
                      disabled={isAILoading || (!input.trim() && !hasPendingData)}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white text-[#020C1B] flex items-center justify-center hover:bg-primary-500 transition-all shadow-xl disabled:opacity-10 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="mt-3 md:mt-4 text-center">
              <p className="text-[7px] md:text-[8px] text-white/10 uppercase tracking-[0.4em] font-black">Quantum Discovery Protocol v4.0</p>
            </div>
          </div>
        </section>

        {/* Desktop Blueprint Preview Panel */}
        <section className="hidden lg:flex w-[380px] border-l border-white/5 bg-[#050b18] flex-col relative overflow-hidden shadow-2xl pt-0">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-primary-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
          <header className="h-12 flex items-center px-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-md z-10">
            <h2 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2.5">
              <Layout size={12} className="text-primary-500/50" />
              Manifest Blueprint
            </h2>
          </header>
          <ManifestContent />
        </section>
        </>
        )}
      </main>
    </div>
  );
}
