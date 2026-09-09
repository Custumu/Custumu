export function getAiConfig() {
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
  };
}

/**
 * Stream real LLM response via backend Custumu AI API endpoint
 */
export async function streamEnterpriseAiResponse({
  prompt,
  conversationHistory = [],
  documentContext,
  onToken,
}) {
  const config = getAiConfig();
  return await streamViaServerApi(prompt, conversationHistory, documentContext, config, onToken);
}

/**
 * Real Backend SSE Stream Consumer
 */
async function streamViaServerApi(prompt, conversationHistory, documentContext, config, onToken) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const endpoint = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:5000/api/ai/chat' : '/api/ai/chat';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      conversationHistory: conversationHistory.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text,
      })),
      documentContext,
      provider: 'openai',
      model: 'gpt-4o-mini',
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const errorMsg = errorPayload?.error || 'AI engine is currently busy. Please try again in a moment.';
    const helpMsg = `⚠️ **Custumu AI Notification**\n\n${errorMsg}`;
    onToken(helpMsg);
    return { text: helpMsg, action: null };
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

          const token = payload.token || payload.choices?.[0]?.delta?.content || '';
          if (token) {
            accumulatedText += token;
            onToken(token);
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

