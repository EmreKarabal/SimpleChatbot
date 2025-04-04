// index.js - Ana Node.js sunucu dosyası
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

cron.schedule('* * * * *', () => {
  console.log('Bu işlem her dakika çalışır!', new Date());
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json({ limit: '50mb'}));
app.use(express.urlencoded({ extended:true, limit: '50mb'}));

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

app.post('/chat-file', async (req, res) => {
  
  try {

    const { fileContent, fileName, customPrompt } = req.body;

    if(!fileContent) {
      return res.status(400).json({error: 'Dosya iceriği bulunamadı'});
    }

    const filePrompt = `Bu bir ${fileName} dosyasından alınan içeriktir. Lütfen içeriği analiz et ve cevabı ver:\n\n${fileContent}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        messages: [
          { role: 'system', content: customPrompt || "Sen yardımcı bir chatbotsun. Dosya içeriğini analiz et ve yararlı bilgiler sağla."},
          { role: 'user', content: filePrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = response.data.choices[0].message.content;
    res.json({ reply: botReply});

  }  catch (error) {
    console.error('Dosya işleme hatası: ', error);
    res.status(500).json({error: 'Dosya işlenirken bir hata oluştu.', details: error.message});
  }

});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});