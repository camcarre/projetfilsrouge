import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

const token = process.env.HF_API_TOKEN;
const modelId = 'google/flan-t5-base';
const prompt = "The stock prices for the last 15 days are: 150, 152, 153, 155, 154, 156, 158, 159, 160, 162, 161, 163, 165, 164, 166. Predict the next 5 prices as a comma-separated list.";

async function testHF() {
    console.log('Testing HF with token:', token ? token.substring(0, 7) + '...' : 'MISSING');
    
    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            method: 'POST',
            body: JSON.stringify({ inputs: prompt }),
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testHF();
