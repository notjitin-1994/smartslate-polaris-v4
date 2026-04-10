'use client';

import { useDiscovery } from '@/hooks/useDiscovery';
import { ApprovalCard } from '@/components/Discovery/ApprovalCard';
import { Send, User, Bot, Sparkles, Sidebar as SidebarIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function DiscoveryPage() {
  const { id } = useParams();
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    isApproving,
    approveStage,
    rejectStage,
    currentStage 
  } = useDiscovery(id as string);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-brand-bg text-[#e0e0e0] overflow-hidden">
      {/* Sidebar: Navigation & Context */}
      <aside className={`w-64 border-r border-white/5 bg-white/[0.02] flex-col ${sidebarOpen ? 'flex' : 'hidden'} md:flex transition-all`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-heading font-bold text-white uppercase tracking-widest">Discovery Phase</h2>
          <div className="mt-4 space-y-3">
            {[
              "Discovery & Goals", "Audience", "Constraints", 
              "Content", "Delivery", "Assessment", "Success"
            ].map((name, i) => (
              <div key={name} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  currentStage > i + 1 ? 'bg-primary-500 border-primary-500 text-brand-bg' : 
                  currentStage === i + 1 ? 'border-primary-500 text-primary-500 shadow-[0_0_10px_rgba(167,218,219,0.3)]' : 
                  'border-white/10 text-white/20'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium ${currentStage === i + 1 ? 'text-white' : 'text-white/30'}`}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content: Split Screen */}
      <main className="flex-1 flex flex-col md:flex-row min-w-0">
        
        {/* Collaborative Chat */}
        <section className="flex-1 flex flex-col min-w-0 bg-brand-bg relative">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary-500 animate-pulse">
                  <Bot size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Initialize Discovery</h3>
                <p className="text-sm text-muted-foreground">Type your project goals below to start the agentic discovery process.</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-secondary-500 text-white' : 'bg-white/5 text-primary-500 border border-white/10'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
                  {m.parts?.map((part, i) => {
                    if (part.type === 'text') {
                      return (
                        <div key={i} className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          m.role === 'user' ? 'bg-secondary-500/10 border border-secondary-500/20 text-white' : 'glass-card'
                        }`}>
                          {part.text}
                        </div>
                      );
                    }
                    if (part.type === 'tool-invocation') {
                      const { toolCallId, toolName, args } = part.toolInvocation;
                      if (toolName === 'requestApproval') {
                        return (
                          <ApprovalCard 
                            key={toolCallId}
                            summary={args.summary}
                            nextStage={args.nextStage}
                            onApprove={() => approveStage(toolCallId)}
                            onReject={(feedback) => rejectStage(toolCallId, feedback)}
                          />
                        );
                      }
                    }
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 shrink-0" />
                <div className="glass-card h-12 w-32 rounded-2xl" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/5">
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
              <input
                disabled={isApproving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm text-white placeholder-white/20 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:opacity-50"
                value={input}
                placeholder={isApproving ? "Waiting for your approval above..." : "Ask or answer anything..."}
                onChange={handleInputChange}
              />
              <button
                type="submit"
                disabled={isApproving || !input.trim()}
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
            <div className="glass-card p-6 rounded-2xl border-dashed border-white/10 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="text-white/10 mb-4">
                <Compass size={48} />
              </div>
              <p className="text-xs text-white/30 leading-relaxed uppercase tracking-tighter">
                Answer the AI's questions to begin drafting the Strategy Blueprint.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
