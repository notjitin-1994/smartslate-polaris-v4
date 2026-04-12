'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, generateId } from 'ai';
import { useState, useEffect, useCallback } from 'react';
import { updateStarmapStage } from '@/app/actions/chat';

export function useDiscovery(starmapId?: string, initialMessages?: UIMessage[], initialStage: number = 1) {
  const [currentStage, setCurrentStage] = useState(initialStage);

  const { messages, setMessages, sendMessage: chatSendMessage, addToolOutput, status, error, stop, regenerate } = useChat({
    id: starmapId,
    messages: initialMessages, 
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        starmapId,
      },
    }),
  });

  // Client-side connection health check
  const [connectionStatus, setConnectionStatus] = useState<'strong' | 'weak'>('strong');
  useEffect(() => {
    if (status !== 'streaming') {
      setConnectionStatus('strong');
      return;
    }
    
    const timeout = setTimeout(() => {
      setConnectionStatus('weak');
    }, 5000); // 5 seconds without a token = weak connection
    
    return () => clearTimeout(timeout);
  }, [status, messages.length]);

  const sendMessage = useCallback(async ({ text }: { text: string }) => {
    if (!starmapId) return;

    const messageId = generateId();
    
    // 1. Optimistic UI Update: Manually add user message to state
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'user',
        parts: [{ type: 'text', text }],
        createdAt: new Date(),
      } as UIMessage,
    ]);

    // 2. Trigger Server Turn (non-blocking)
    chatSendMessage({
      parts: [{ type: 'text', text }]
    }, {
      body: {
        messageId 
      }
    });
  }, [starmapId, setMessages, chatSendMessage]);

  const approveStage = async (toolCallId: string) => {
    if (!starmapId) return;
    
    const result = { approved: true, stageAdvanced: true };

    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: result,
    });
    
    setCurrentStage((prev) => Math.min(prev + 1, 8));

    // PERSIST IN BACKGROUND
    updateStarmapStage({
      starmapId,
      stageNumber: currentStage
    }).catch(err => console.error('[useDiscovery] Stage update failed:', err));
  };

  const rejectStage = async (toolCallId: string, feedback: string) => {
    if (!starmapId) return;

    const result = { approved: false, feedback };

    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: result,
    });
  };

  const submitToolResult = async (toolName: string, toolCallId: string, result: any) => {
    if (!starmapId) return;

    addToolOutput({
      tool: toolName,
      toolCallId,
      output: result,
    });
  };

  return {
    messages,
    sendMessage,
    submitToolResult,
    status,
    error,
    regenerate,
    stop,
    connectionStatus,
    isApproving: status === 'submitted' || status === 'streaming',
    isLoading: status === 'submitted' || status === 'streaming',
    approveStage,
    rejectStage,
    currentStage,
  };
}
