/**
 * OpenAI Provider
 * OpenAI GPT API integration
 */

import { StealthFetch } from '../stealth-fetch.js';

export class OpenAIProvider {
    constructor() {
        this.stealth = new StealthFetch();
        this.baseUrl = 'https://api.openai.com/v1';
        this.model = 'gpt-4o-mini';
    }

    /**
     * Test API key validity
     */
    async testConnection(apiKey) {
        try {
            const response = await this.stealth.fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('OpenAI test failed:', error);
            return false;
        }
    }

    /**
     * Send chat message
     */
    async chat(apiKey, messages) {
        const response = await this.stealth.postJSON(
            `${this.baseUrl}/chat/completions`,
            {
                model: this.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                max_tokens: 2048,
                temperature: 0.7
            },
            { 'Authorization': `Bearer ${apiKey}` }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response';
    }
}
