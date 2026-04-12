'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage, generateId } from 'ai';
import { useState } from 'react';
import { persistMessage, updateStarmapStage } from '@/app/actions/chat';

export function useDiscovery(starmapId?: string, initialMessages?: UIMessage[], initialStage: number = 1) {
  const [currentStage, setCurrentStage] = useState(initialStage);

  const { messages, sendMessage: chatSendMessage, addToolOutput, status, error, stop } = useChat({
    id: starmapId, // Explicitly provide starmapId as the chat ID
    messages: initialMessages, // load initial messages
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        starmapId,
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const sendMessage = async ({ text }: { text: string }) => {
    if (!starmapId) return;
    
    const messageId = generateId();
    const parts = [{ type: 'text' as const, text }];
    
    // 1. TRIGGER UI IMMEDIATELY (Optimistic Update)
    chatSendMessage({
      parts
    }, {
      body: {
        messageId // Pass manual ID so server can match it
      }
    });

    // 2. Persist to DB in background
    persistMessage({
      id: messageId,
      starmapId,
      role: 'user',
      parts
    }).catch(err => {
      console.error('[Optimistic Update] User message persistence failed:', err);
      // Here you could trigger a toast or notification to inform the user
    });
  };

  const approveStage = async (toolCallId: string) => {
    if (!starmapId) return;
    
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
    }).catch(err => console.error('[Optimistic Update] Stage update failed:', err));

    persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'assistant',
      parts
    }).catch(err => console.error('[Optimistic Update] Approval persistence failed:', err));
  };

  const rejectStage = async (toolCallId: string, feedback: string) => {
    if (!starmapId) return;

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
    }).catch(err => console.error('[Optimistic Update] Rejection persistence failed:', err));
  };

  const submitToolResult = async (toolName: string, toolCallId: string, result: any) => {
    if (!starmapId) return;

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
    }).catch(err => console.error('[Optimistic Update] Tool result persistence failed:', err));
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
