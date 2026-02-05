/**
 * Gemini AI Provider
 * Google's Gemini API integration
 */

import { StealthFetch } from '../stealth-fetch.js';

export class GeminiProvider {
    constructor() {
        this.stealth = new StealthFetch();
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.model = 'gemini-1.5-flash';
    }

    /**
     * Test API key validity
     */
    async testConnection(apiKey) {
        try {
            const url = `${this.baseUrl}/models?key=${apiKey}`;
            const response = await this.stealth.fetch(url);
            return response.ok;
        } catch (error) {
            console.error('Gemini test failed:', error);
            return false;
        }
    }

    /**
     * Send chat message
     */
    async chat(apiKey, messages) {
        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${apiKey}`;

        // Convert messages to Gemini format
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const response = await this.stealth.postJSON(url, {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.95
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    }
}
