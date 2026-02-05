/**
 * Stealth AI Proxy - Cloudflare Worker
 */

addEventListener('fetch', function (event) {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    var corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider, X-API-Key'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        var url = new URL(request.url);

        if (url.pathname === '/health' || url.pathname === '/') {
            return new Response('{"status":"ok","service":"notes-api"}', {
                headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
            });
        }

        if (url.pathname === '/v1/chat') {
            return handleChat(request, corsHeaders);
        }

        return new Response('{"error":"Not found"}', {
            status: 404,
            headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
        });
    }
}

async function handleChat(request, corsHeaders) {
    var provider = request.headers.get('X-Provider') || 'gemini';
    var apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
        return new Response('{"error":"API key required"}', {
            status: 401,
            headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
        });
    }

    var body = await request.json();
    var targetUrl = '';
    var targetHeaders = {};
    var targetBody = {};

    if (provider === 'gemini') {
        targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
        targetHeaders = { 'Content-Type': 'application/json' };
        var contents = [];
        for (var i = 0; i < body.messages.length; i++) {
            var m = body.messages[i];
            contents.push({
                role: m.role === 'assistant' ? 'model' : m.role,
                parts: [{ text: m.content }]
            });
        }
        targetBody = {
            contents: contents,
            generationConfig: {
                temperature: body.temperature || 0.7,
                maxOutputTokens: body.max_tokens || 2048
            }
        };
    } else if (provider === 'openai') {
        targetUrl = 'https://api.openai.com/v1/chat/completions';
        targetHeaders = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        };
        targetBody = {
            model: body.model || 'gpt-3.5-turbo',
            messages: body.messages,
            temperature: body.temperature || 0.7,
            max_tokens: body.max_tokens || 2048
        };
    } else if (provider === 'claude') {
        targetUrl = 'https://api.anthropic.com/v1/messages';
        targetHeaders = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        };
        var systemMsg = null;
        var otherMsgs = [];
        for (var j = 0; j < body.messages.length; j++) {
            if (body.messages[j].role === 'system') {
                systemMsg = body.messages[j];
            } else {
                otherMsgs.push(body.messages[j]);
            }
        }
        targetBody = {
            model: body.model || 'claude-3-haiku-20240307',
            max_tokens: body.max_tokens || 2048,
            messages: otherMsgs
        };
        if (systemMsg) {
            targetBody.system = systemMsg.content;
        }
    } else {
        return new Response('{"error":"Invalid provider"}', {
            status: 400,
            headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
        });
    }

    var response = await fetch(targetUrl, {
        method: 'POST',
        headers: targetHeaders,
        body: JSON.stringify(targetBody)
    });

    var data = await response.json();
    var result = { success: false, response: '' };

    if (provider === 'gemini' && data.candidates && data.candidates[0]) {
        result = { success: true, response: data.candidates[0].content.parts[0].text || '' };
    } else if (provider === 'openai' && data.choices && data.choices[0]) {
        result = { success: true, response: data.choices[0].message.content || '' };
    } else if (provider === 'claude' && data.content && data.content[0]) {
        result = { success: true, response: data.content[0].text || '' };
    }

    if (!result.response && data.error) {
        result = { success: false, error: data.error.message || 'API error' };
    }

    return new Response(JSON.stringify(result), {
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });
}
