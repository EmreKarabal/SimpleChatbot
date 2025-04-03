// index.js - Ana Node.js sunucu dosyası
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Groq API ile iletişim kurma
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    const customPrompt = req.body.customPrompt || "";
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        messages: [
          { role:'system', content: customPrompt || "Sen yardımcı bir chatbotsun. Cevabını vermeden önce kendini tanıt."},
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile', // veya kullanmak istediğiniz diğer modeller
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
      }
    );
    
    const botReply = response.data.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (error) {
    console.error('Groq API hatası:', error.response?.data || error.message);
    res.status(500).json({ error: 'Bir hata oluştu', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});