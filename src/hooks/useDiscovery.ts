'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, generateId } from 'ai';
import { useState, useCallback } from 'react';
import { updateStarmapStage } from '@/app/actions/chat';

export function useDiscovery(starmapId?: string, initialMessages?: UIMessage[], initialStage: number = 1) {
  const [currentStage, setCurrentStage] = useState(initialStage);

  const { messages, sendMessage: chatSendMessage, addToolOutput, status, error, stop, regenerate } = useChat({
    id: starmapId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { starmapId },
    }),
  });

  const sendMessage = useCallback(async ({ text }: { text: string }) => {
    if (!starmapId) return;
    chatSendMessage({ parts: [{ type: 'text', text }] });
  }, [starmapId, chatSendMessage]);

  const approveStage = async (toolCallId: string) => {
    if (!starmapId) return;
    
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: { approved: true, stageAdvanced: true },
    });
    
    const nextStage = Math.min(currentStage + 1, 8);
    setCurrentStage(nextStage);

    // Standard background action for metadata (UI handles navigation)
    // Note: We'll re-implement updateStarmapStage in next step
  };

  const rejectStage = async (toolCallId: string, feedback: string) => {
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: { approved: false, feedback },
    });
  };

  const submitToolResult = async (toolName: string, toolCallId: string, result: any) => {
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
    isApproving: status === 'submitted' || status === 'streaming',
    isLoading: status === 'submitted' || status === 'streaming',
    approveStage,
    rejectStage,
    currentStage,
  };
}
