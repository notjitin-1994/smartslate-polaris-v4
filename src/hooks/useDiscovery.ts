'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';
import { useState } from 'react';

export function useDiscovery(starmapId?: string, initialMessages?: UIMessage[], initialStage: number = 1) {
  const [currentStage, setCurrentStage] = useState(initialStage);

  const { messages, sendMessage, addToolOutput, status, error, stop } = useChat({
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
    // Wrap result in the semantic TOOL_RESULT envelope
    const wrappedResult = `[TOOL_RESULT tool="${toolName}" stage="${currentStage}" persisted="false"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    addToolOutput({
      tool: toolName,
      toolCallId,
      output: wrappedResult,
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
