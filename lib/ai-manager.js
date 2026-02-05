/**
 * AI Manager
 * Unified interface for all AI providers
 */

import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';
import { ClaudeProvider } from './providers/claude.js';

export class AIManager {
    constructor() {
        this.providers = {
            gemini: new GeminiProvider(),
            openai: new OpenAIProvider(),
            claude: new ClaudeProvider()
        };
    }

    /**
     * Get provider by name
     */
    getProvider(name) {
        const provider = this.providers[name.toLowerCase()];
        if (!provider) {
            throw new Error(`Unknown provider: ${name}`);
        }
        return provider;
    }

    /**
     * Test API key for a provider
     */
    async testConnection(providerName, apiKey) {
        const provider = this.getProvider(providerName);
        return await provider.testConnection(apiKey);
    }

    /**
     * Send chat message to a provider
     */
    async chat(providerName, apiKey, messages) {
        const provider = this.getProvider(providerName);
        return await provider.chat(apiKey, messages);
    }

    /**
     * Get available providers
     */
    getAvailableProviders() {
        return [
            { id: 'gemini', name: 'Google Gemini', icon: '✨', model: 'gemini-1.5-flash' },
            { id: 'openai', name: 'OpenAI GPT', icon: '🤖', model: 'gpt-4o-mini' },
            { id: 'claude', name: 'Anthropic Claude', icon: '🧠', model: 'claude-3.5-sonnet' }
        ];
    }
}
