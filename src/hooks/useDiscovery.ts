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
    
    // 1. Persist to DB immediately
    await persistMessage({
      id: messageId,
      starmapId,
      role: 'user',
      parts
    });

    // 2. Trigger Chat with the same ID
    chatSendMessage({
      parts
    }, {
      body: {
        messageId // Pass manual ID so server can match it if needed
      }
    });
  };

  const approveStage = async (toolCallId: string) => {
    if (!starmapId) return;
    
    // 1. Persist the stage update to database context
    await updateStarmapStage({
      starmapId,
      stageNumber: currentStage
    });

    // 2. Submit the tool result (marked as persisted=true since we just saved the stage)
    const result = { approved: true, stageAdvanced: true };
    const wrappedResult = `[TOOL_RESULT tool="requestApproval" stage="${currentStage}" persisted="true"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    const toolMessageId = generateId();
    const parts = [{
      type: 'tool-result' as const,
      toolCallId,
      toolName: 'requestApproval',
      result: wrappedResult
    }];

    await persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'tool',
      parts
    });

    // 3. Update UI
    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: wrappedResult,
    });
    
    setCurrentStage((prev) => Math.min(prev + 1, 8));
  };

  const rejectStage = async (toolCallId: string, feedback: string) => {
    if (!starmapId) return;

    const result = { approved: false, feedback };
    const wrappedResult = `[TOOL_RESULT tool="requestApproval" stage="${currentStage}" persisted="false"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    const toolMessageId = generateId();
    const parts = [{
      type: 'tool-result' as const,
      toolCallId,
      toolName: 'requestApproval',
      result: wrappedResult
    }];

    await persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'tool',
      parts
    });

    addToolOutput({
      tool: 'requestApproval',
      toolCallId,
      output: wrappedResult,
    });
  };

  const submitToolResult = async (toolName: string, toolCallId: string, result: any) => {
    if (!starmapId) return;

    // Wrap result in the semantic TOOL_RESULT envelope
    const wrappedResult = `[TOOL_RESULT tool="${toolName}" stage="${currentStage}" persisted="false"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
    
    const toolMessageId = generateId();
    const parts = [{
      type: 'tool-result' as const,
      toolCallId,
      toolName,
      result: wrappedResult
    }];

    // 1. Persist tool message to DB
    await persistMessage({
      id: toolMessageId,
      starmapId,
      role: 'tool',
      parts
    });

    // 2. Update UI State
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
