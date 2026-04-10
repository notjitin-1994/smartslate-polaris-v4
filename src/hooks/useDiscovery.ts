import { useChat } from 'ai/react';
import { useState } from 'react';

export function useDiscovery(starmapId: string) {
  const [currentStage, setCurrentStage] = useState(1);
  const [isApproving, setIsApproving] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, addToolResult, isLoading } = useChat({
    api: '/api/chat',
    body: {
      starmapId,
      currentStage,
    },
    onToolCall({ toolCall }) {
      if (toolCall.toolName === 'requestApproval') {
        setIsApproving(true);
      }
    },
  });

  const approveStage = async (toolCallId: string) => {
    addToolResult({
      toolCallId,
      result: { approved: true },
    });
    setIsApproving(false);
    setCurrentStage((prev) => Math.min(prev + 1, 7));
  };

  const rejectStage = async (toolCallId: string, feedback: string) => {
    addToolResult({
      toolCallId,
      result: { approved: false, feedback },
    });
    setIsApproving(false);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isApproving,
    approveStage,
    rejectStage,
    currentStage,
  };
}
