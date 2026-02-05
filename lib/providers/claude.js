/**
 * Claude Provider
 * Anthropic Claude API integration
 */

import { StealthFetch } from '../stealth-fetch.js';

export class ClaudeProvider {
    constructor() {
        this.stealth = new StealthFetch();
        this.baseUrl = 'https://api.anthropic.com/v1';
        this.model = 'claude-3-5-sonnet-20241022';
    }

    /**
     * Test API key validity
     */
    async testConnection(apiKey) {
        try {
            // Claude doesn't have a simple endpoint to test, so we send a minimal request
            const response = await this.stealth.fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'content-type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }]
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Claude test failed:', error);
            return false;
        }
    }

    /**
     * Send chat message
     */
    async chat(apiKey, messages) {
        const response = await this.stealth.fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 2048,
                messages: messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }))
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API error');
        }

        const data = await response.json();
        return data.content?.[0]?.text || 'No response';
    }
}
