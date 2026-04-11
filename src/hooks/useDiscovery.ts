'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';
import { useState } from 'react';

export function useDiscovery(starmapId?: string, initialMessages?: UIMessage[]) {
  const [currentStage, setCurrentStage] = useState(1);

  const { messages, sendMessage, addToolOutput, status, error, stop } = useChat({
    id: starmapId, // Explicitly provide starmapId as the chat ID
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        starmapId,
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const approveStage = (toolCallId: string) => {
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: { approved: true },
    });
    setCurrentStage((prev) => Math.min(prev + 1, 8));
  };

  const rejectStage = (toolCallId: string, feedback: string) => {
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: { approved: false, feedback },
    });
  };

  const submitToolResult = (toolName: string, toolCallId: string, result: any) => {
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
    isApproving: status === 'submitted' || status === 'streaming',
    isLoading: status === 'submitted' || status === 'streaming',
    approveStage,
    rejectStage,
    currentStage,
  };
}
