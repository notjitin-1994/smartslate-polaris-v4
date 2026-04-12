export function getToolInfo(part: any): { toolName: string; state: string } | null {
  if (part.type?.startsWith('tool-') && part.type !== 'tool-result' && part.type !== 'tool-invocation') {
    // Typed tool part: tool-askInteractiveQuestions, tool-requestApproval, etc.
    return {
      toolName: part.type.replace('tool-', ''),
      state: part.state,
    };
  }
  if (part.type === 'dynamic-tool') {
    return {
      toolName: part.toolName,
      state: part.state,
    };
  }
  // Legacy fallback
  if (part.type === 'tool-invocation' || part.type === 'tool-result') {
    return {
      toolName: part.toolName,
      state: part.state || (part.result ? 'output-available' : 'input-available'),
    };
  }
  return null;
}
