import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

const token = process.env.HF_API_TOKEN;
const modelId = 'Qwen/Qwen2.5-72B-Instruct'; // Proved chat model
const prompt = "The stock prices for the last 15 days are: 150, 152, 153, 155, 154, 156, 158, 159, 160, 162, 161, 163, 165, 164, 166. Predict the next 5 prices as a simple comma-separated list of numbers only (e.g. 170, 172, 175, 178, 180).";

async function testHF() {
    console.log('Testing HF Router with token:', token ? token.substring(0, 7) + '...' : 'MISSING');
    
    try {
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          method: 'POST',
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: 'You are a financial forecasting assistant. Always respond only with a list of 5 comma-separated numbers.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 50
          }),
        });

        console.log('Status:', response.status);
        if (!response.ok) {
            console.log('Error Body:', await response.text());
            return;
        }
        const hfResult = await response.json();
        const generatedText = hfResult.choices?.[0]?.message?.content || '';
        console.log('Generated Text:', generatedText);
        
        const numbers = generatedText.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
        console.log('Parsed Numbers:', numbers);
    } catch (error) {
        console.error('Error:', error);
    }
}

testHF();
