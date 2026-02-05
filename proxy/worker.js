/**
 * Stealth AI Proxy - Cloudflare Worker
 * 
 * This worker relays API requests to AI providers (Gemini, OpenAI, Claude)
 * making the traffic appear as normal website requests.
 * 
 * Deploy to Cloudflare Workers (free tier available)
 */

// CORS headers for extension requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider, X-API-Key',
};

// Provider API endpoints
const PROVIDERS = {
    gemini: 'https://generativelanguage.googleapis.com',
    openai: 'https://api.openai.com',
    claude: 'https://api.anthropic.com'
};

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            const url = new URL(request.url);

            // Health check endpoint
            if (url.pathname === '/health' || url.pathname === '/') {
                return new Response(JSON.stringify({ status: 'ok', service: 'notes-api' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Chat endpoint
            if (url.pathname === '/v1/chat') {
                return await handleChat(request);
            }

            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

async function handleChat(request) {
    const provider = request.headers.get('X-Provider') || 'gemini';
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const body = await request.json();
    let targetUrl, targetHeaders, targetBody;

    switch (provider) {
        case 'gemini':
            targetUrl = `${PROVIDERS.gemini}/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
            targetHeaders = { 'Content-Type': 'application/json' };
            targetBody = {
                contents: body.messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : m.role,
                    parts: [{ text: m.content }]
                })),
                generationConfig: {
                    temperature: body.temperature || 0.7,
                    maxOutputTokens: body.max_tokens || 2048
                }
            };
            break;

        case 'openai':
            targetUrl = `${PROVIDERS.openai}/v1/chat/completions`;
            targetHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            targetBody = {
                model: body.model || 'gpt-3.5-turbo',
                messages: body.messages,
                temperature: body.temperature || 0.7,
                max_tokens: body.max_tokens || 2048
            };
            break;

        case 'claude':
            targetUrl = `${PROVIDERS.claude}/v1/messages`;
            targetHeaders = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            };
            // Separate system message for Claude
            const systemMsg = body.messages.find(m => m.role === 'system');
            const otherMsgs = body.messages.filter(m => m.role !== 'system');
            targetBody = {
                model: body.model || 'claude-3-haiku-20240307',
                max_tokens: body.max_tokens || 2048,
                messages: otherMsgs
            };
            if (systemMsg) {
                targetBody.system = systemMsg.content;
            }
            break;

        default:
            return new Response(JSON.stringify({ error: 'Invalid provider' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
    }

    // Make request to AI provider
    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: targetHeaders,
        body: JSON.stringify(targetBody)
    });

    const data = await response.json();

    // Normalize response format
    let normalizedResponse;

    if (provider === 'gemini') {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        normalizedResponse = { success: true, response: text };
    } else if (provider === 'openai') {
        const text = data.choices?.[0]?.message?.content || '';
        normalizedResponse = { success: true, response: text };
    } else if (provider === 'claude') {
        const text = data.content?.[0]?.text || '';
        normalizedResponse = { success: true, response: text };
    }

    if (!normalizedResponse.response && data.error) {
        normalizedResponse = { success: false, error: data.error.message || 'API error' };
    }

    return new Response(JSON.stringify(normalizedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
