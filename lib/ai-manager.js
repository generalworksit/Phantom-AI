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
    async chat(providerName, apiKey, messages, image = null, model = null) {
        const provider = this.getProvider(providerName);
        return await provider.chat(apiKey, messages, image, model);
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

    /**
     * Get available models for a provider
     */
    getAvailableModels(providerName) {
        const models = {
            gemini: [
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Brainy)' },
                { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro (Standard)' },
                { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' }
            ],
            openai: [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
                { id: 'gpt-4o', name: 'GPT-4o (Smart)' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
            ],
            claude: [
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
                { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
            ]
        };
        return models[providerName] || [];
    }
}
