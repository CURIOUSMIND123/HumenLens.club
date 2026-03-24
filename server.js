const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('.'));

app.post('/api/ai', async (req, res) => {
  if (!process.env.ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Request timed out. Try a shorter prompt.' });
    } else {
      console.error('API error:', err.message);
      res.status(502).json({ error: 'Failed to reach AI. Please try again.' });
    }
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('HumanLens running on port', process.env.PORT || 3000);
});
