'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, generateId } from 'ai';
import { useState, useEffect } from 'react';
import { updateStarmapStage } from '@/app/actions/chat';

export function useDiscovery(starmapId?: string, initialMessages?: UIMessage[], initialStage: number = 1) {
  const [currentStage, setCurrentStage] = useState(initialStage);

  console.log('[useDiscovery] Initializing hook:', { starmapId, initialMessagesCount: initialMessages?.length, initialStage });

  const { messages, sendMessage: chatSendMessage, addToolOutput, status, error, stop } = useChat({
    id: starmapId,
    messages: initialMessages, 
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        starmapId,
      },
    }),
  });

  // Watch chat state changes for logging
  useEffect(() => {
    console.log('[useDiscovery] Chat status:', status);
    if (status === 'error' && error) {
      console.error('[useDiscovery] AI SDK Error:', error);
    }
  }, [status, error]);

  // Client-side connection health check
  const [connectionStatus, setConnectionStatus] = useState<'strong' | 'weak'>('strong');
  useEffect(() => {
    if (status !== 'streaming') return;
    
    const timeout = setTimeout(() => {
      setConnectionStatus('weak');
    }, 5000); // 5 seconds without a token = weak connection
    
    const messageHandler = () => setConnectionStatus('strong');
    messageHandler();
    
    return () => clearTimeout(timeout);
  }, [status, messages.length]);

  // Watch message state changes
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log(`[useDiscovery] Messages Update (Total: ${messages.length}):`, {
        role: lastMsg.role,
        id: lastMsg.id,
        partsCount: lastMsg.parts?.length
      });
    }
  }, [messages]);

  const sendMessage = async ({ text }: { text: string }) => {
    if (!starmapId) return;
    
    console.log('[useDiscovery] Sending user message:', text.substring(0, 50));
    const messageId = generateId();
    const parts = [{ type: 'text' as const, text }];
    
    // Trigger Chat
    chatSendMessage({
      parts
    }, {
      body: {
        messageId 
      }
    });
  };

  const approveStage = async (toolCallId: string) => {
    if (!starmapId) return;
    
    console.log('[useDiscovery] Approving stage:', currentStage, 'ToolCallId:', toolCallId);

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

    console.log('[useDiscovery] Rejecting stage:', currentStage, 'Feedback:', feedback);

    const result = { approved: false, feedback };

    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: result,
    });
  };

  const submitToolResult = async (toolName: string, toolCallId: string, result: any) => {
    if (!starmapId) return;

    console.log(`[useDiscovery] Submitting result for tool ${toolName}:`, toolCallId);

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
    stop,
    connectionStatus,
    isApproving: status === 'submitted' || status === 'streaming',
    isLoading: status === 'submitted' || status === 'streaming',
    approveStage,
    rejectStage,
    currentStage,
  };
}
