'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Info } from 'lucide-react';
import { useDiscovery } from '@/hooks/useDiscovery';
import { ChatMessage } from './ChatMessage';
import { UIMessage } from 'ai';

interface DiscoveryClientProps {
  initialStarmap: any;
  initialMessages?: UIMessage[];
}

export function DiscoveryClient({ initialStarmap, initialMessages = [] }: DiscoveryClientProps) {
  const starmapId = initialStarmap.id;
  const initialStage = Number(initialStarmap.context?.currentStage || 1);

  const { messages, sendMessage, submitToolResult, status, error, approveStage, rejectStage, currentStage } = useDiscovery(
    starmapId,
    initialMessages,
    initialStage
  );

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // High-performance scroll anchoring
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
    if (isNearBottom || status === 'submitted') {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: status === 'streaming' ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  }, [messages, status]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || status === 'streaming' || status === 'submitted') return;
    
    const text = input.trim();
    setInput('');
    await sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-dvh bg-[#020C1B] text-white overflow-hidden font-sans">
      {/* Workspace Header */}
      <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 bg-white/[0.02] backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(167,218,219,0.8)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Discovery Workspace</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold text-primary-400 uppercase tracking-wider">
          Stage {currentStage} / 7
        </div>
      </header>

      {/* Message Stream */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-10 space-y-8 scrollbar-hide relative selection:bg-primary-500/30"
      >
        <div className="max-w-3xl mx-auto w-full space-y-10">
          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isLast={i === messages.length - 1}
              isChatLoading={status === 'streaming' || status === 'submitted'}
              approveStage={approveStage}
              rejectStage={rejectStage}
              submitToolResult={submitToolResult}
            />
          ))}
          
          {/* Ghost Loading State */}
          {status === 'submitted' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center animate-pulse" />
              <div className="h-10 w-24 bg-white/5 rounded-2xl animate-pulse" />
            </motion.div>
          )}
          
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>

      {/* Input Zone */}
      <footer className="p-4 md:p-8 bg-gradient-to-t from-[#020C1B] via-[#020C1B]/95 to-transparent shrink-0 z-20">
        <form 
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-[26px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
          
          <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-1.5 backdrop-blur-3xl shadow-2xl group-focus-within:border-white/[0.15] transition-all duration-500">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Polaris..."
              className="flex-1 bg-transparent border-none outline-none px-5 py-3 text-[14px] text-white/90 placeholder:text-white/20 font-light"
              disabled={status === 'streaming' || status === 'submitted'}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || status === 'streaming' || status === 'submitted'}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#020C1B] hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {status === 'submitted' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
            </button>
          </div>
          
          <p className="mt-3 text-center text-[9px] text-white/20 uppercase tracking-[0.15em] font-medium">
            Institutional Discovery Protocol v4.0
          </p>
        </form>
      </footer>
    </div>
  );
}
