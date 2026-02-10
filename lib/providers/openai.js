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
    async chat(apiKey, messages, image = null, model = null) {
        const selectedModel = model || this.model;

        const formattedMessages = messages.map(msg => {
            if (msg.image) {
                return {
                    role: msg.role,
                    content: [
                        { type: 'text', text: msg.content },
                        { type: 'image_url', image_url: { url: msg.image } }
                    ]
                };
            }
            return {
                role: msg.role,
                content: msg.content
            };
        });

        // Add current image if provided
        if (image) {
            const lastMsg = formattedMessages[formattedMessages.length - 1];
            if (lastMsg.role === 'user') {
                if (Array.isArray(lastMsg.content)) {
                    lastMsg.content.push({ type: 'image_url', image_url: { url: image } });
                } else {
                    lastMsg.content = [
                        { type: 'text', text: lastMsg.content },
                        { type: 'image_url', image_url: { url: image } }
                    ];
                }
            }
        }

        const response = await this.stealth.postJSON(
            `${this.baseUrl}/chat/completions`,
            {
                model: selectedModel,
                messages: formattedMessages,
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
