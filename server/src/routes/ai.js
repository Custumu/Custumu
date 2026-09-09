import express from 'express';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Server-Sent Events (SSE) streaming endpoint for AI Chat & Function Calling
 */
router.post('/chat', async (req, res) => {
  const { prompt, documentText, model = 'gpt-4o-mini' } = req.body;

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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are Custumu AI Enterprise Copilot. Answer questions based on the following document. Cite pages like [Page X].\n\nDOCUMENT:\n${documentText || ''}`
          },
          { role: 'user', content: prompt }
        ],
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    console.error('Server AI stream error', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Error processing AI stream' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
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
    return res.status(500).json({ 
      error: 'OPENAI_API_KEY is not configured in server/.env', 
      prompts: [] 
    });
  }

  if (!documentText || typeof documentText !== 'string' || documentText.trim().length < 20) {
    return res.status(400).json({ 
      error: 'Missing or insufficient "documentText" in request body (minimum 20 characters required).', 
      prompts: [] 
    });
  }

  try {
    const excerpt = documentText.slice(0, 3500);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant analyzing a PDF document. Based on the document excerpt, generate 4 to 5 smart, highly relevant question or action prompt suggestions tailored to this specific document.
Format your output strictly as a JSON array of objects with keys "label" (short chip title, 2-4 words max) and "prompt" (the full question or instruction to ask the AI). Return ONLY the raw JSON array, without markdown formatting or code fences.`
          },
          {
            role: 'user',
            content: `Document excerpt (${pageCount} pages total):\n\n${excerpt}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errMsg = errJson?.error?.message || errJson?.message || await response.text().catch(() => 'Unknown error');
      console.error('OpenAI API error in /suggest-prompts:', response.status, errMsg);
      return res.status(response.status).json({ 
        error: `OpenAI API Error (${response.status}): ${errMsg}`, 
        prompts: [] 
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const cleanJson = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse OpenAI JSON output:', content);
      return res.status(502).json({ 
        error: `OpenAI returned non-JSON output: "${content.slice(0, 150)}"`, 
        prompts: [] 
      });
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return res.json({ prompts: parsed.slice(0, 5) });
    } else {
      return res.status(502).json({ 
        error: 'OpenAI returned an empty or invalid format array', 
        prompts: [] 
      });
    }
  } catch (err) {
    console.error('Exception in /suggest-prompts:', err);
    return res.status(500).json({ 
      error: `Internal server exception: ${err.message}`, 
      prompts: [] 
    });
  }
});

export default router;

