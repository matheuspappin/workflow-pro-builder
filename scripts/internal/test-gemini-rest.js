import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found');
    return;
  }

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: "Você é um assistente de estúdio de dança." }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: "Olá, como você está?" }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Error API:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ Success API:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('💥 Fetch Error:', error);
  }
}

testGemini();
