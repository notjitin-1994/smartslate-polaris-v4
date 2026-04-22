// Ollama AI Schema Types
// Placeholder schema types for Ollama integration

export interface Blueprint {
  id: string;
  title: string;
  description?: string;
  content: string;
  status: 'draft' | 'generating' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
  user_id: string;
  static_answers: Record<string, any>;
  dynamic_questions: Record<string, any>;
  dynamic_answers: Record<string, any>;
  blueprint_json: Record<string, any>;
  blueprint_markdown?: string;
}

export interface OllamaResponse<T> {
  response: T;
  model: string;
  created_at: string;
  done: boolean;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}
