import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize GoogleGenAI SDK per guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Auto-generate questions via Gemini AI
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const { subject, count = 5, type = 'mcq', customTopic = '' } = req.body;

    const prompt = `អ្នកជាអ្នកជំនាញរៀបចំវិញ្ញាសាប្រឡងក្របខ័ណ្ឌរដ្ឋនៅកម្ពុជា (Cambodian Civil Service Examination Expert)។
សូមបង្កើតសំណួរចំនួន ${count} សំណួរ សម្រាប់មុខវិជ្ជា៖ "${subject || customTopic || 'ចំណេះដឹងទូទៅ'}" 
ប្រភេទសំណួរ៖ ${type === 'mcq' ? 'QCM (ពហុជ្រើសរើសចម្លើយ)' : type === 'short' ? 'សំណួរ-ចម្លើយខ្លី (Q&A)' : 'ពន្យល់ពាក្យ (Explanation/Glossary)'}។
${customTopic ? `ប្រធានបទជាក់លាក់៖ ${customTopic}` : ''}

លក្ខខណ្ឌ៖
1. សំណួរ និងចម្លើយត្រូវតែត្រឹមត្រូវតាមស្ដង់ដារប្រឡងក្របខ័ណ្ឌរដ្ឋកម្ពុជា ភាសាខ្មែរត្រឹមត្រូវ អក្ខរាវិរុទ្ធល្អឥតខ្ចោះ។
2. សម្រាប់ MCQ: ត្រូវមាន 4 ជម្រើសជានិច្ច (ក, ខ, គ, ឃ ឬ A, B, C, D សម្រាប់ភាសាអង់គ្លេស) និង correct index (0 ដល់ 3)។
3. សម្រាប់ Q&A ឬពន្យល់ពាក្យ: ត្រូវមានសំណួរ ឬពាក្យគន្លឹះ និងចម្លើយបកស្រាយច្បាស់លាស់។
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite Cambodian Civil Service Exam author creating authentic, high-quality test questions in Khmer language.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'Question text or word in Khmer' },
              type: { type: Type.STRING, enum: ['mcq', 'short', 'explanation'] },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 multiple choice options (only for mcq)',
              },
              correct: {
                type: Type.INTEGER,
                description: 'Index of correct option 0-3 (only for mcq)',
              },
              answer: {
                type: Type.STRING,
                description: 'Detailed answer or explanation (for short and explanation)',
              },
            },
            required: ['question', 'type'],
          },
        },
      },
    });

    const text = response.text || '[]';
    let questions = [];
    try {
      questions = JSON.parse(text);
    } catch {
      questions = [];
    }

    // Attach subject
    const finalQuestions = questions.map((q: any) => ({
      ...q,
      subject: subject || 'ចំណេះដឹងទូទៅ',
      isActive: true,
      options: q.options && q.options.length === 4 ? q.options : ['ក. ជម្រើសទី ១', 'ខ. ជម្រើសទី ២', 'គ. ជម្រើសទី ៣', 'ឃ. ជម្រើសទី ៤'],
      correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
      answer: q.answer || (q.options ? q.options[q.correct || 0] : ''),
    }));

    res.json({ success: true, questions: finalQuestions });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-questions:', err);
    res.status(500).json({ success: false, error: err.message || 'Generation failed' });
  }
});

// Endpoint: Send Quiz Poll to Telegram Bot
app.post('/api/telegram/send-poll', async (req, res) => {
  try {
    const { botToken, chatId, question, options, correct_option_id, explanation } = req.body;
    if (!botToken || !chatId || !question || !options) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const payload: any = {
      chat_id: chatId,
      question: question.length > 300 ? question.slice(0, 297) + '...' : question,
      options: options.slice(0, 10).map((opt: string) => (opt.length > 100 ? opt.slice(0, 97) + '...' : opt)),
      type: 'quiz',
      correct_option_id: typeof correct_option_id === 'number' ? correct_option_id : 0,
      is_anonymous: false,
    };

    if (explanation) {
      payload.explanation = explanation.length > 200 ? explanation.slice(0, 197) + '...' : explanation;
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPoll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      return res.status(400).json({ success: false, error: data.description || 'Telegram API error' });
    }

    res.json({ success: true, result: data.result });
  } catch (err: any) {
    console.error('Error sending Telegram poll:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Send Photo to Telegram Channel
app.post('/api/telegram/send-photo', async (req, res) => {
  try {
    const { botToken, chatId, photoBase64, caption } = req.body;
    if (!botToken || !chatId || !photoBase64) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // Convert data URL to Blob / FormData
    const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 photo' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const parts: Buffer[] = [];
    const addField = (name: string, value: string) => {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    };

    addField('chat_id', chatId);
    if (caption) {
      addField('caption', caption);
    }

    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="quiz_card.png"\r\nContent-Type: image/png\r\n\r\n`));
    parts.push(buffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const totalBuffer = Buffer.concat(parts);

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: totalBuffer,
    });

    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      return res.status(400).json({ success: false, error: data.description || 'Telegram API photo error' });
    }

    res.json({ success: true, result: data.result });
  } catch (err: any) {
    console.error('Error sending Telegram photo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Master Quiz KH' });
});

// Mount Vite or static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Master Quiz KH server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
