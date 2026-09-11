import express from 'express';
import { supabaseAdmin } from '../services/supabase.js';

const router = express.Router();

/**
 * Tools available for the Custumu Autonomous Document Agent
 */
const CUSTUMU_AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'split_pdf',
      description: 'Split the PDF into separate files, extract specific pages, or split into parts/ranges.',
      parameters: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['all_pages', 'extract_pages', 'ranges'],
            description: 'all_pages = split every page into its own PDF file; extract_pages = extract specific pages into a new document; ranges = split into custom parts',
          },
          page_numbers: {
            type: 'array',
            items: { type: 'integer' },
            description: '1-based page numbers to extract or include in the split (e.g. [1, 2] or [3])',
          },
          ranges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                page_numbers: { type: 'array', items: { type: 'integer' } },
              },
              required: ['name', 'page_numbers'],
            },
            description: 'Custom named split parts with 1-based page numbers',
          },
          summary: {
            type: 'string',
            description: 'Short, clear explanation of the split action for non-technical users (e.g. "Split all 4 pages into individual files" or "Extract Pages 1 to 2 into a new PDF")',
          },
        },
        required: ['mode', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_pages',
      description: 'Delete one or more pages from the current PDF document.',
      parameters: {
        type: 'object',
        properties: {
          page_numbers: {
            type: 'array',
            items: { type: 'integer' },
            description: 'List of 1-based page numbers to delete (e.g. [2] or [1, 3, 5])',
          },
          summary: {
            type: 'string',
            description: 'Short plain-language summary of deletion (e.g. "Delete Page 2" or "Remove Pages 3 and 4")',
          },
        },
        required: ['page_numbers', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotate_pages',
      description: 'Rotate one or more pages clockwise in the PDF document.',
      parameters: {
        type: 'object',
        properties: {
          page_numbers: {
            type: 'array',
            items: { type: 'integer' },
            description: '1-based page numbers to rotate. Leave empty or specify all pages to rotate the whole document.',
          },
          degrees: {
            type: 'integer',
            enum: [90, 180, 270],
            description: 'Degrees clockwise to rotate (default 90)',
          },
          summary: {
            type: 'string',
            description: 'Short summary of rotation (e.g. "Rotate Page 1 by 90° clockwise")',
          },
        },
        required: ['degrees', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_watermark',
      description: 'Stamp a semi-transparent watermark text across document pages.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Watermark text, e.g. CONFIDENTIAL, DRAFT, APPROVED, COPY, VOID',
          },
          summary: {
            type: 'string',
            description: 'Short summary (e.g. "Add \'CONFIDENTIAL\' watermark across all pages")',
          },
        },
        required: ['text', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reorder_pages',
      description: 'Reorder or move pages in the PDF document.',
      parameters: {
        type: 'object',
        properties: {
          new_order: {
            type: 'array',
            items: { type: 'integer' },
            description: 'The complete new sequence of 1-based page numbers (e.g. [2, 1, 3] to swap pages 1 and 2)',
          },
          summary: {
            type: 'string',
            description: 'Short summary of new order (e.g. "Move Page 3 to the beginning [3, 1, 2]")',
          },
        },
        required: ['new_order', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compress_pdf',
      description: 'Compress and optimize the PDF file to reduce its size.',
      parameters: {
        type: 'object',
        properties: {
          target_mb: {
            type: 'number',
            description: 'Target maximum file size in MB (e.g. 5)',
          },
          quality: {
            type: 'string',
            enum: ['medium', 'extreme'],
            description: 'Compression quality',
          },
          summary: {
            type: 'string',
            description: 'Short summary (e.g. "Compress PDF to reduce file size")',
          },
        },
        required: ['summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_document',
      description: 'Export or download the document as Word (.doc), Excel (.xlsx), or PDF.',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['word', 'excel', 'pdf', 'png'],
            description: 'Export format',
          },
          summary: {
            type: 'string',
            description: 'Short summary (e.g. "Export document to Microsoft Word (.doc)")',
          },
        },
        required: ['format', 'summary'],
      },
    },
  },
];

/**
 * POST /api/ai/chat
 * Server-Sent Events (SSE) streaming endpoint for AI Chat & Autonomous Function Calling
 */
router.post('/chat', async (req, res) => {
  const {
    prompt,
    conversationId,
    conversationHistory = [],
    documentContext,
    documentMetadata,
    documentText: fallbackDocText,
    model = 'gpt-4o-mini',
  } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: 'Server OPENAI_API_KEY is not configured.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  // Handle Supabase chat persistence for authenticated user
  const user = req.user;
  let activeConvId = conversationId || null;

  if (user && supabaseAdmin) {
    try {
      if (activeConvId) {
        const { data: existingConv } = await supabaseAdmin
          .from('ai_conversations')
          .select('id')
          .eq('id', activeConvId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingConv) {
          activeConvId = null;
        }
      }

      if (!activeConvId) {
        const title = prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt;
        const { data: newConv, error: convErr } = await supabaseAdmin
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            title,
            model_used: model || 'gpt-4o-mini',
          })
          .select('id')
          .single();

        if (!convErr && newConv) {
          activeConvId = newConv.id;
        }
      }

      if (activeConvId) {
        res.write(`data: ${JSON.stringify({ conversation_id: activeConvId })}\n\n`);

        await supabaseAdmin.from('ai_messages').insert({
          conversation_id: activeConvId,
          sender: 'user',
          content: prompt,
        });
      }
    } catch (dbErr) {
      console.warn('[Custumu AI] Failed to initialize Supabase conversation:', dbErr.message);
    }
  }

  const pageCount = documentMetadata?.pageCount || documentContext?.numPages || 1;
  const docTitle = documentMetadata?.title || 'Document.pdf';
  const fullText = documentContext?.fullText || fallbackDocText || '';

  const systemPrompt = `You are Custumu AI Agent, an autonomous document editing and analysis copilot (built like Cursor / Antigravity). You assist users—especially non-technical or elderly users—by explaining things clearly, answering questions, and DIRECTLY modifying their PDF documents using your available tools.

DOCUMENT CONTEXT:
- Document Title: "${docTitle}"
- Total Pages: ${pageCount} (Pages are indexed from 1 to ${pageCount})
${fullText ? `\nDOCUMENT TEXT CONTENT:\n${fullText.slice(0, 15000)}` : '\n(Document has no selectable text layer or is image-only)'}

AVAILABLE TOOLS & ACTIONS:
You have autonomous tools to modify this document in real time:
- split_pdf: Split into separate files, extract specific pages, or split into parts.
- delete_pages: Delete one or more pages from the document.
- rotate_pages: Rotate pages clockwise (90, 180, 270 degrees).
- add_watermark: Add a watermark text across pages.
- reorder_pages: Change the order of pages or move pages.
- compress_pdf: Compress and reduce file size.
- export_document: Export/download as Word (.doc), Excel (.xlsx), or PDF.

CRITICAL RULES:
1. When a user asks to split, extract, delete, rotate, watermark, compress, reorder, or export the PDF, YOU MUST INVOKE THE MATCHING TOOL. NEVER say that you cannot edit or split PDF files, and NEVER tell the user to use Adobe Acrobat, Smallpdf, or other external software. YOU CAN DO IT!
2. Accompany the tool call with a friendly, reassuring, plain-language message explaining what action has been prepared (e.g., "I've prepared the split for you to separate all pages into individual files. Click the button below to execute it!").
3. Page numbers are 1-based and must be within 1 and ${pageCount}.
4. For questions about document contents, answer accurately with citations formatted like [Page X].`;

  // Build message history
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text || '',
    })),
    { role: 'user', content: prompt },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        tools: CUSTUMU_AI_TOOLS,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      res.write(`data: ${JSON.stringify({ error: `OpenAI error (${response.status}): ${errText}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let accumulatedAssistantText = '';
    const accumulatedToolCalls = {}; // index -> { id, name, arguments }

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
          const chunk = JSON.parse(dataStr);
          const delta = chunk.choices?.[0]?.delta;

          if (delta?.content) {
            accumulatedAssistantText += delta.content;
            res.write(`data: ${JSON.stringify({ token: delta.content })}\n\n`);
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!accumulatedToolCalls[idx]) {
                accumulatedToolCalls[idx] = {
                  id: tc.id || '',
                  name: tc.function?.name || '',
                  arguments: '',
                };
              }
              if (tc.function?.name) {
                accumulatedToolCalls[idx].name = tc.function.name;
              }
              if (tc.function?.arguments) {
                accumulatedToolCalls[idx].arguments += tc.function.arguments;
              }
            }
          }
        } catch (e) {
          // partial JSON
        }
      }
    }

    // Process leftover buffer
    if (buffer.trim().startsWith('data: ')) {
      const dataStr = buffer.trim().slice(6).trim();
      if (dataStr !== '[DONE]') {
        try {
          const chunk = JSON.parse(dataStr);
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            accumulatedAssistantText += delta.content;
            res.write(`data: ${JSON.stringify({ token: delta.content })}\n\n`);
          }
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!accumulatedToolCalls[idx]) {
                accumulatedToolCalls[idx] = {
                  id: tc.id || '',
                  name: tc.function?.name || '',
                  arguments: '',
                };
              }
              if (tc.function?.name) accumulatedToolCalls[idx].name = tc.function.name;
              if (tc.function?.arguments) accumulatedToolCalls[idx].arguments += tc.function.arguments;
            }
          }
        } catch (e) {}
      }
    }

    // Emit accumulated tool calls
    for (const key of Object.keys(accumulatedToolCalls)) {
      const tc = accumulatedToolCalls[key];
      if (tc && tc.name) {
        let args = {};
        try {
          args = JSON.parse(tc.arguments || '{}');
        } catch (e) {
          console.warn('[Custumu AI] Failed to parse tool call args JSON:', tc.arguments);
        }
        res.write(`data: ${JSON.stringify({ tool_call: { name: tc.name, args } })}\n\n`);
      }
    }

    // Save assistant response and tool calls to Supabase
    if (user && supabaseAdmin && activeConvId) {
      try {
        const toolCallsToSave = Object.values(accumulatedToolCalls)
          .filter((tc) => tc && tc.name)
          .map((tc) => {
            let args = {};
            try {
              args = JSON.parse(tc.arguments || '{}');
            } catch (e) {}
            return { name: tc.name, args };
          });

        await supabaseAdmin.from('ai_messages').insert({
          conversation_id: activeConvId,
          sender: 'assistant',
          content: accumulatedAssistantText || '(Action performed)',
          tool_calls: toolCallsToSave.length > 0 ? toolCallsToSave : null,
        });
        console.log(`[Custumu AI] Successfully saved message to conversation ${activeConvId}`);
      } catch (saveErr) {
        console.warn('[Custumu AI] Failed to save assistant message:', saveErr.message);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Server AI stream error', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Error processing AI stream' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * GET /api/ai/conversations
 * Retrieve conversation history list for authenticated user
 */
router.get('/conversations', async (req, res) => {
  const user = req.user;
  if (!user || !supabaseAdmin) {
    return res.json({ conversations: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_conversations')
      .select('id, title, model_used, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ conversations: data || [] });
  } catch (err) {
    console.error('[Custumu AI] Error fetching conversations:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/ai/conversations/:id/messages
 * Retrieve messages for a specific conversation
 */
router.get('/conversations/:id/messages', async (req, res) => {
  const user = req.user;
  const convId = req.params.id;
  if (!user || !supabaseAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('ai_conversations')
      .select('id')
      .eq('id', convId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (convErr || !conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('ai_messages')
      .select('id, sender, content, tool_calls, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;
    res.json({ messages: messages || [] });
  } catch (err) {
    console.error('[Custumu AI] Error fetching messages:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/ai/suggest-prompts
 * Generates 4-5 contextual prompt suggestions based on current document text
 */
router.post('/suggest-prompts', async (req, res) => {
  const { documentText = '', pageCount = 1 } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server OPENAI_API_KEY is not configured', prompts: [] });
  }

  if (!documentText || typeof documentText !== 'string' || documentText.trim().length < 20) {
    return res.json({ prompts: [] });
  }

  try {
    const excerpt = documentText.slice(0, 3500);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant analyzing a PDF document. Based on the document excerpt, generate 4 to 5 smart, highly relevant question or action prompt suggestions tailored to this specific document.
Format your output strictly as a JSON array of objects with keys "label" (short chip title, 2-4 words max) and "prompt" (the full question or instruction to ask the AI). Return ONLY the raw JSON array, without markdown formatting or code fences.`,
          },
          {
            role: 'user',
            content: `Document excerpt (${pageCount} pages total):\n\n${excerpt}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      const cleanJson = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ prompts: parsed.slice(0, 5) });
      }
    } else {
      const errText = await response.text().catch(() => '');
      console.error('OpenAI suggest-prompts error:', response.status, errText);
    }
  } catch (err) {
    console.error('Error generating AI prompt suggestions:', err);
  }

  return res.json({ prompts: [] });
});

export default router;
