'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useState } from 'react';

export function useDiscovery(starmapId: string) {
  const [currentStage, setCurrentStage] = useState(1);

  const { messages, sendMessage, addToolOutput, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const approveStage = (toolCallId: string) => {
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: { approved: true },
    });
    setCurrentStage((prev) => Math.min(prev + 1, 7));
  };

  const rejectStage = (toolCallId: string, feedback: string) => {
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: { approved: false, feedback },
    });
  };

  return {
    messages,
    sendMessage,
    addToolOutput,
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
