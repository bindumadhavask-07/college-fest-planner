/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// --- API Endpoints ---

// Copilot AI Chat Endpoint (Reserved for teammate integration)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Genuine integration check: if API key is not supplied or is placeholder
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return res.status(503).json({
      error: 'GEMINI_API_NOT_CONFIGURED',
      status: 'pending_configuration',
      message: 'Gemini AI API key is not configured in the server environment. Add GEMINI_API_KEY to your environment variables or AI Studio Secrets panel.',
      contract: {
        method: 'POST',
        endpoint: '/api/ai/chat',
        expectedPayload: {
          messages: [{ role: 'user', content: 'string' }],
          festContext: {
            festName: 'string',
            totalBudget: 'number',
            eventsCount: 'number',
            venuesCount: 'number',
            conflictsCount: 'number'
          }
        }
      }
    });
  }

  try {
    const { messages, festContext } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Request body must contain a non-empty "messages" array.'
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are FESTOS Copilot, the AI planning coordinator for Indian engineering college festivals (such as IITs, NITs, BITS, and technical universities).
You assist the Fest Convenor, Cultural/Technical Heads, and Logistics coordinators with:
- Optimizing multi-day event schedules and turnaround buffers
- Preventing venue collisions and capacity overflows
- Suggesting budget reductions and sponsorship tier structures in Indian Rupees (INR ₹)
- Formulating safety, security, and medical response protocols for large campus crowds

Fest Context:
${JSON.stringify(festContext || {}, null, 2)}

Provide structured, actionable, professional suggestions.`;

    const userPrompt = messages[messages.length - 1]?.content || 'Hello';
    
    // Set a race promise with 8s timeout to avoid hanging if network/key issues
    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 8000)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    return res.json({
      reply: response.text || 'No response generated.',
      model: 'gemini-2.5-flash',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error invoking Gemini API:', err?.message || err);
    return res.status(503).json({
      error: 'AI_SERVICE_UNAVAILABLE',
      status: 'reserved_for_teammate_integration',
      message: 'FESTOS AI Copilot service is currently reserved for teammate integration. Real-time Gemini generation will become active once your teammate deploys their verified API key.',
      contract: {
        method: 'POST',
        endpoint: '/api/ai/chat',
        documentation: 'docs/ai-integration.md'
      }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const isKeyConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY.trim() !== ''
  );

  res.json({
    status: 'healthy',
    service: 'FESTOS AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      firestorePersistence: true,
      googleAuth: true,
      schedulerConflictEngine: true,
      aiCopilotConfigured: isKeyConfigured
    }
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite middlewares in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FESTOS AI] Server running on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
