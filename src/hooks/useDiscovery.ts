'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage, generateId } from 'ai';
import { useState, useEffect } from 'react';
import { persistMessage, updateStarmapStage } from '@/app/actions/chat';

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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Watch chat state changes for logging
  useEffect(() => {
    console.log('[useDiscovery] Chat status:', status);
    if (status === 'error' && error) {
      console.error('[useDiscovery] AI SDK Error:', error);
    }
  }, [status, error]);

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
    
    console.log('[useDiscovery] Sending user message (optimistic):', text.substring(0, 50));
    const messageId = generateId();
    const parts = [{ type: 'text' as const, text }];
    
    // 1. TRIGGER UI IMMEDIATELY (Optimistic Update)
    chatSendMessage({
      parts
    }, {
      body: {
        messageId 
      }
    });

    // 2. Persist to DB in background
    persistMessage({
      id: messageId,
      starmapId,
      role: 'user',
      parts
    }).catch(err => {
      console.error('[useDiscovery] User message persistence failed:', err);
    });
  };

  const approveStage = async (toolCallId: string) => {
    if (!starmapId) return;
    
    console.log('[useDiscovery] Approving stage:', currentStage, 'ToolCallId:', toolCallId);

    // 1. UPDATE UI IMMEDIATELY
    const result = { approved: true, stageAdvanced: true };
    const wrappedResult = `[TOOL_RESULT tool="requestApproval" stage="${currentStage}" persisted="true"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    const toolMessageId = generateId();
    const parts = [{
      type: 'tool-result' as const,
      toolCallId,
      toolName: 'requestApproval',
      result: wrappedResult
    }];

    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: wrappedResult,
    });
    
    setCurrentStage((prev) => Math.min(prev + 1, 8));

    // 2. PERSIST IN BACKGROUND
    updateStarmapStage({
      starmapId,
      stageNumber: currentStage
    }).catch(err => console.error('[useDiscovery] Stage update failed:', err));

    persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'assistant',
      parts
    }).catch(err => console.error('[useDiscovery] Approval persistence failed:', err));
  };

  const rejectStage = async (toolCallId: string, feedback: string) => {
    if (!starmapId) return;

    console.log('[useDiscovery] Rejecting stage:', currentStage, 'Feedback:', feedback);

    // 1. UPDATE UI IMMEDIATELY
    const result = { approved: false, feedback };
    const wrappedResult = `[TOOL_RESULT tool="requestApproval" stage="${currentStage}" persisted="false"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    const toolMessageId = generateId();
    const parts = [{
      type: 'tool-result' as const,
      toolCallId,
      toolName: 'requestApproval',
      result: wrappedResult
    }];

    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: wrappedResult,
    });

    // 2. PERSIST IN BACKGROUND
    persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'assistant',
      parts
    }).catch(err => console.error('[useDiscovery] Rejection persistence failed:', err));
  };

  const submitToolResult = async (toolName: string, toolCallId: string, result: any) => {
    if (!starmapId) return;

    console.log(`[useDiscovery] Submitting result for tool ${toolName}:`, toolCallId);

    // 1. UPDATE UI IMMEDIATELY
    const wrappedResult = `[TOOL_RESULT tool="${toolName}" stage="${currentStage}" persisted="false"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    const toolMessageId = generateId();
    const parts = [{
      type: 'tool-result' as const,
      toolCallId,
      toolName,
      result: wrappedResult
    }];

    addToolOutput({
      tool: toolName,
      toolCallId,
      output: wrappedResult,
    });

    // 2. PERSIST IN BACKGROUND
    persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'assistant',
      parts
    }).catch(err => console.error('[useDiscovery] Tool result persistence failed:', err));
  };

  return {
    messages,
    sendMessage,
    submitToolResult,
    status,
    error,
    stop,
    isApproving: status === 'submitted' || status === 'streaming',
    isLoading: status === 'submitted' || status === 'streaming',
    approveStage,
    rejectStage,
    currentStage,
  };
}
