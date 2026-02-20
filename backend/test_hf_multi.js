import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

const token = process.env.HF_API_TOKEN;
const models = ['google/flan-t5-base', 'gpt2', 'mistralai/Mistral-7B-v0.1'];

async function testHF() {
    console.log('Testing HF with token:', token ? token.substring(0, 7) + '...' : 'MISSING');
    
    for (const modelId of models) {
        console.log(`--- Testing model: ${modelId} ---`);
        const url = `https://api-inference.huggingface.co/models/${modelId}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                method: 'POST',
                body: JSON.stringify({ inputs: "Hello" }),
            });

            console.log('Status:', response.status);
            const data = await response.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

testHF();
