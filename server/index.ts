import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY is not set');
  process.exit(1);
}
const openai = new OpenAI({ apiKey });

app.post('/api/generate-text', async (req, res) => {
  try {
    const { messages, model = 'gpt-4-turbo-preview', temperature = 0.7 } = req.body;
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature
    });
    res.json({ text: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural'
    });
    res.json({ url: response.data[0]?.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
