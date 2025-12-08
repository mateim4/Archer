# Integration Example: Frontend ↔ AI Engine

This document shows how to integrate the Archer AI Engine with the React frontend.

## 🔌 API Client Setup

### Create AI Client Utility

```typescript
// frontend/src/utils/aiClient.ts
const AI_ENGINE_URL = process.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  finish_reason: string | null;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_window?: number;
  supports_streaming: boolean;
  supports_functions: boolean;
}

/**
 * Send a chat completion request to the AI Engine
 */
export async function chatCompletion(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${AI_ENGINE_URL}/api/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI Engine error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Stream a chat completion response
 */
export async function* streamChatCompletion(
  request: ChatRequest
): AsyncGenerator<string> {
  const response = await fetch(`${AI_ENGINE_URL}/api/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`AI Engine error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            yield parsed.content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * List available AI models
 */
export async function listModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${AI_ENGINE_URL}/api/v1/models`);

  if (!response.ok) {
    throw new Error(`AI Engine error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check AI Engine health
 */
export async function checkHealth(): Promise<{
  status: string;
  ready: boolean;
  default_provider: string;
}> {
  const response = await fetch(`${AI_ENGINE_URL}/health/ready`);
  return response.json();
}
```

## 🎯 Example Use Cases

### 1. AI Chat Component

```tsx
// frontend/src/components/AIChat.tsx
import { useState } from 'react';
import { chatCompletion, streamChatCompletion } from '@/utils/aiClient';
import { PurpleGlassInput, PurpleGlassButton } from '@/components/ui';

export function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatCompletion({
        messages: [...messages, userMessage],
        temperature: 0.7,
        max_tokens: 500,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.content },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <PurpleGlassInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <PurpleGlassButton onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </PurpleGlassButton>
      </div>
    </div>
  );
}
```

### 2. Streaming AI Response

```tsx
// frontend/src/components/StreamingChat.tsx
import { useState } from 'react';
import { streamChatCompletion } from '@/utils/aiClient';

export function StreamingChat() {
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);

  const handleStream = async (userMessage: string) => {
    setStreaming(true);
    setResponse('');

    try {
      for await (const chunk of streamChatCompletion({
        messages: [{ role: 'user', content: userMessage }],
      })) {
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error('Stream error:', error);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div>
      <pre className="ai-response">{response}</pre>
      {streaming && <span className="typing-indicator">AI is typing...</span>}
    </div>
  );
}
```

### 3. AI-Powered Ticket Analysis

```tsx
// frontend/src/views/TicketDetailView.tsx
import { chatCompletion } from '@/utils/aiClient';

export function TicketDetailView({ ticket }) {
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const analyzeTicket = async () => {
    const response = await chatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are an ITSM expert. Analyze the ticket and provide resolution suggestions.',
        },
        {
          role: 'user',
          content: `Ticket: ${ticket.title}\n\nDescription: ${ticket.description}`,
        },
      ],
    });

    setAiSuggestion(response.content);
  };

  return (
    <div className="ticket-detail">
      <h1>{ticket.title}</h1>
      <p>{ticket.description}</p>

      <PurpleGlassButton onClick={analyzeTicket}>
        Get AI Suggestions
      </PurpleGlassButton>

      {aiSuggestion && (
        <div className="ai-suggestion">
          <h3>AI Analysis</h3>
          <p>{aiSuggestion}</p>
        </div>
      )}
    </div>
  );
}
```

### 4. Model Selection Component

```tsx
// frontend/src/components/ModelSelector.tsx
import { useEffect, useState } from 'react';
import { listModels } from '@/utils/aiClient';
import { PurpleGlassDropdown } from '@/components/ui';

export function ModelSelector({ onSelect }) {
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    listModels().then(setModels);
  }, []);

  const handleSelect = (modelId) => {
    setSelected(modelId);
    onSelect?.(modelId);
  };

  return (
    <PurpleGlassDropdown
      label="AI Model"
      value={selected}
      onChange={handleSelect}
      options={models.map((m) => ({
        key: m.id,
        text: `${m.name} (${m.provider})`,
      }))}
    />
  );
}
```

## 🔄 Integration with Existing Features

### Ticket Assistant Integration

```typescript
// frontend/src/views/ServiceDeskView.tsx
import { chatCompletion } from '@/utils/aiClient';
import { useTicketStore } from '@/store/ticketStore';

export function ServiceDeskView() {
  const { tickets } = useTicketStore();

  const getSimilarTickets = async (currentTicket) => {
    const response = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Find similar tickets from the database based on this description.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            current: currentTicket,
            database: tickets,
          }),
        },
      ],
    });

    // Parse AI response to extract similar ticket IDs
    return parseSimilarTickets(response.content);
  };

  // ... rest of component
}
```

## 🚀 Environment Configuration

Add to your `.env` file:

```env
# AI Engine Configuration
VITE_AI_ENGINE_URL=http://localhost:8000
VITE_AI_DEFAULT_MODEL=llama3.2
VITE_AI_ENABLED=true
```

## 🧪 Testing AI Integration

```typescript
// frontend/src/utils/__tests__/aiClient.test.ts
import { describe, it, expect, vi } from 'vitest';
import { chatCompletion, listModels } from '../aiClient';

describe('AI Client', () => {
  it('should send chat completion request', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'test-id',
            content: 'Hello from AI',
            model: 'llama3.2',
            provider: 'ollama',
          }),
      })
    );

    const response = await chatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response.content).toBe('Hello from AI');
  });

  it('should list available models', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
          ]),
      })
    );

    const models = await listModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('gpt-4o');
  });
});
```

## 🔒 Security Considerations

1. **API Key Management**: Never expose API keys in frontend code
2. **Rate Limiting**: Implement client-side rate limiting for AI requests
3. **Error Handling**: Always handle AI Engine errors gracefully
4. **User Feedback**: Show loading states and error messages
5. **Cost Awareness**: Track token usage for cloud LLM providers

## 📊 Monitoring AI Requests

```typescript
// frontend/src/utils/aiMonitoring.ts
export function trackAIRequest(
  endpoint: string,
  tokens: number,
  latency: number
) {
  // Send to analytics
  console.log('AI Request:', { endpoint, tokens, latency });

  // Store in local state for dashboard
  localStorage.setItem(
    'ai-usage',
    JSON.stringify({
      totalRequests: (getTotalRequests() || 0) + 1,
      totalTokens: (getTotalTokens() || 0) + tokens,
    })
  );
}
```

## 🎉 Next Steps

1. Implement the AI client utility in your frontend
2. Add a simple chat interface to test the integration
3. Gradually add AI features to existing views
4. Monitor usage and performance
5. Implement advanced features (RAG, agents) in Phase 2

For more details, see the [AI Engine README](README.md).
