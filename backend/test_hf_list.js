import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

const token = process.env.HF_API_TOKEN;

async function testHF() {
    console.log('Testing HF with token:', token ? token.substring(0, 7) + '...' : 'MISSING');
    
    const url = `https://router.huggingface.co/v1/models`;
    console.log('Testing URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            method: 'GET',
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response (first 5 models):', JSON.stringify(data.data?.slice(0, 5), null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testHF();
