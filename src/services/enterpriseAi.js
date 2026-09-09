/**
 * Custumu Enterprise AI Engine (Client-Side)
 * Connects directly to the real /api/ai/chat streaming backend or executes direct client BYOK streaming.
 * Zero hardcoded replies. Pure real LLM streaming with RAG context and tool execution.
 */

const STORAGE_KEY = 'custumu_ai_config';

export const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'] },
];

export function getAiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read AI config', e);
  }
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
    useServerProxy: true,
  };
}

export function saveAiConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI config', e);
  }
}

/**
 * Stream real LLM response via backend SSE endpoint or direct client API
 */
export async function streamEnterpriseAiResponse({
  prompt,
  conversationHistory = [],
  documentContext,
  onToken,
}) {
  const config = getAiConfig();

  // If user entered a direct client key and wants direct browser-to-API execution
  if (config.apiKey && !config.useServerProxy && config.provider === 'openai') {
    return await streamDirectOpenAi(prompt, conversationHistory, documentContext, config, onToken);
  }

  // Standard production path: stream from Custumu backend API (/api/ai/chat)
  return await streamViaServerApi(prompt, conversationHistory, documentContext, config, onToken);
}

/**
 * Real Backend SSE Stream Consumer
 */
async function streamViaServerApi(prompt, conversationHistory, documentContext, config, onToken) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      conversationHistory: conversationHistory.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text,
      })),
      documentContext,
      provider: config.provider || 'openai',
      model: config.model || 'gpt-4o-mini',
    }),
  });

  // Handle missing API key or backend errors cleanly without any mock
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 400) {
      const errorMsg = errorPayload?.error || 'Missing API Key';
      const helpMsg = 
`⚠️ **API Key Required**\n\n` +
`${errorMsg}\n\n` +
`To enable real-time AI document analysis, please:\n` +
`1. Open **AI Engine Settings** in the top right of this panel.\n` +
`2. Enter your **OpenAI**, **Google Gemini**, or **Anthropic** API key.\n` +
`*(Or configure OPENAI_API_KEY in server/.env)*`;

      onToken(helpMsg);
      return { text: helpMsg, action: null };
    }

    throw new Error(errorPayload?.error || `Server responded with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let detectedAction = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const payload = JSON.parse(dataStr);

          if (payload.token) {
            accumulatedText += payload.token;
            onToken(payload.token);
          }

          if (payload.tool_call) {
            detectedAction = mapToolCallToAction(payload.tool_call.name, payload.tool_call.args);
          }

          if (payload.error) {
            onToken(`\n\n*[Error: ${payload.error}]*`);
          }
        } catch (e) {
          // ignore partial JSON chunks
        }
      }
    }
  }

  return { text: accumulatedText, action: detectedAction };
}

/**
 * Direct Client-Side OpenAI Streaming (Zero-Knowledge / BYOK)
 */
async function streamDirectOpenAi(prompt, history, docContext, config, onToken) {
  const systemPrompt = 
`You are Custumu AI, an enterprise document intelligence copilot.
Answer questions accurately based on the document text below. Always cite the exact page using format [Page X].
If the user requests a document modification, invoke the corresponding tool.

DOCUMENT CONTEXT:
${docContext?.fullText || 'No document text available.'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        { role: 'user', content: prompt }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const json = JSON.parse(line.slice(6));
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) {
            fullText += delta.content;
            onToken(delta.content);
          }
        } catch (e) {}
      }
    }
  }

  return { text: fullText, action: null };
}

function mapToolCallToAction(toolName, args) {
  if (toolName === 'delete_page') {
    return { type: 'DELETE_PAGE', pageNumber: args.page_number, pageIndex: args.page_number - 1 };
  }
  if (toolName === 'rotate_page') {
    return { type: 'ROTATE_PAGE', pageNumber: args.page_number, degrees: args.degrees || 90 };
  }
  if (toolName === 'add_watermark') {
    return { type: 'WATERMARK', text: args.text };
  }
  if (toolName === 'compress_pdf') {
    return { type: 'COMPRESS', targetMb: args.target_mb || 5 };
  }
  if (toolName === 'extract_tables') {
    return { type: 'EXTRACT_TABLES', tables: [{ name: args.table_name || 'Extracted Data', rows: args.rows || [] }] };
  }
  if (toolName === 'export_word') {
    return { type: 'EXPORT_WORD' };
  }
  return null;
}
