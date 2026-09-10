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
  documentMetadata,
  onToken,
}) {
  const config = getAiConfig();
  return await streamViaServerApi(
    prompt,
    conversationHistory,
    documentContext,
    documentMetadata,
    config,
    onToken
  );
}

/**
 * Real Backend SSE Stream Consumer
 */
async function streamViaServerApi(
  prompt,
  conversationHistory,
  documentContext,
  documentMetadata,
  config,
  onToken
) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const endpoint =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api/ai/chat'
      : 'https://api.custumu.com/api/ai/chat';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      conversationHistory: conversationHistory.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      })),
      documentContext,
      documentMetadata,
      provider: 'openai',
      model: 'gpt-4o-mini',
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const errorMsg =
      errorPayload?.error || 'AI engine is currently busy. Please try again in a moment.';
    const helpMsg = `⚠️ **Custumu AI Notification**\n\n${errorMsg}`;
    onToken(helpMsg);
    return { text: helpMsg, action: null };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let detectedAction = null;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6).trim();
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

  // Check remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    const dataStr = buffer.trim().slice(6).trim();
    if (dataStr !== '[DONE]') {
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
      } catch (e) {}
    }
  }

  return { text: accumulatedText, action: detectedAction };
}

function mapToolCallToAction(toolName, args = {}) {
  if (toolName === 'split_pdf') {
    return {
      type: 'SPLIT_PDF',
      mode: args.mode || 'all_pages',
      pageNumbers: Array.isArray(args.page_numbers) ? args.page_numbers : [],
      ranges: Array.isArray(args.ranges) ? args.ranges : [],
      summary: args.summary || 'Split PDF document',
    };
  }
  if (toolName === 'delete_pages' || toolName === 'delete_page') {
    const pageNumbers = Array.isArray(args.page_numbers)
      ? args.page_numbers
      : args.page_number
        ? [args.page_number]
        : [];
    return {
      type: 'DELETE_PAGES',
      pageNumbers,
      pageNumber: pageNumbers[0] || 1,
      pageIndex: (pageNumbers[0] || 1) - 1,
      summary: args.summary || `Delete Page ${pageNumbers.join(', ')}`,
    };
  }
  if (toolName === 'rotate_pages' || toolName === 'rotate_page') {
    const pageNumbers = Array.isArray(args.page_numbers)
      ? args.page_numbers
      : args.page_number
        ? [args.page_number]
        : [];
    return {
      type: 'ROTATE_PAGES',
      pageNumbers,
      pageNumber: pageNumbers[0] || 1,
      degrees: args.degrees || 90,
      summary: args.summary || `Rotate by ${args.degrees || 90}° clockwise`,
    };
  }
  if (toolName === 'add_watermark') {
    return {
      type: 'WATERMARK',
      text: args.text || 'CONFIDENTIAL',
      summary: args.summary || `Add watermark "${args.text || 'CONFIDENTIAL'}"`,
    };
  }
  if (toolName === 'reorder_pages') {
    return {
      type: 'REORDER_PAGES',
      newOrder: Array.isArray(args.new_order) ? args.new_order : [],
      summary: args.summary || 'Reorder document pages',
    };
  }
  if (toolName === 'compress_pdf') {
    return {
      type: 'COMPRESS',
      targetMb: args.target_mb || 5,
      quality: args.quality || 'medium',
      summary: args.summary || 'Compress and optimize PDF file size',
    };
  }
  if (toolName === 'export_document') {
    const format = (args.format || 'pdf').toLowerCase();
    return {
      type: 'EXPORT',
      format,
      summary: args.summary || `Export document as ${format.toUpperCase()}`,
    };
  }
  if (toolName === 'extract_tables') {
    return {
      type: 'EXTRACT_TABLES',
      tables: [{ name: args.table_name || 'Extracted Data', rows: args.rows || [] }],
      summary: args.summary || 'Download Extracted Excel (.xlsx)',
    };
  }
  return null;
}

/**
 * Request AI to analyze document text and suggest 4-5 contextual prompts
 */
export async function fetchSuggestedPrompts(documentText = '', pageCount = 1) {
  try {
    const endpoint =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api/ai/suggest-prompts'
        : 'https://api.custumu.com/api/ai/suggest-prompts';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText, pageCount }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[Suggest Prompts Error]', res.status, data?.error || 'Unknown error');
      return [];
    }

    if (Array.isArray(data?.prompts)) {
      return data.prompts;
    }
  } catch (err) {
    console.error('Failed to fetch AI prompt suggestions:', err);
  }

  return [];
}
