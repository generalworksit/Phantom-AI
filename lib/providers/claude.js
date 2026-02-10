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
    async chat(apiKey, messages, image = null, model = null) {
        const selectedModel = model || this.model;

        const formattedMessages = messages.map(msg => {
            const content = [];
            if (msg.image) {
                const base64Data = msg.image.split(',')[1];
                content.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: 'image/jpeg',
                        data: base64Data
                    }
                });
            }
            content.push({ type: 'text', text: msg.content });

            return {
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: content
            };
        });

        // Add current image if provided
        if (image) {
            const lastMsg = formattedMessages[formattedMessages.length - 1];
            if (lastMsg.role === 'user') {
                const base64Data = image.split(',')[1];
                lastMsg.content.unshift({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: 'image/jpeg',
                        data: base64Data
                    }
                });
            }
        }

        const response = await this.stealth.fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: selectedModel,
                max_tokens: 2048,
                messages: formattedMessages
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
