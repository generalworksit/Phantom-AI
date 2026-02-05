# Stealth Proxy Setup Guide

Deploy this Cloudflare Worker to disguise your AI API calls.

## Quick Setup (5 minutes)

### 1. Create Cloudflare Account
Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free)

### 2. Create a Worker
1. Click **Workers & Pages** in sidebar
2. Click **Create Application** → **Create Worker**
3. Name it something innocent like `study-notes` or `homework-helper`
4. Click **Deploy**

### 3. Add the Code
1. Click **Edit Code**
2. Delete the default code
3. Copy-paste the contents of `worker.js`
4. Click **Save and Deploy**

### 4. Get Your URL
Your proxy URL will be:
```
https://study-notes.YOUR-SUBDOMAIN.workers.dev
```

### 5. Configure Extension
1. Open the extension settings
2. Enable "Use Stealth Proxy"
3. Enter your worker URL
4. Save

## How It Works

```
Your Extension          Your Cloudflare Worker          AI Provider
     |                         |                            |
     |------- /v1/chat ------->|                            |
     |   (looks like normal    |------- API call ---------->|
     |    website visit)       |                            |
     |                         |<------ AI response --------|
     |<------ response --------|                            |
```

**What monitoring sees:** Request to `study-notes.workers.dev`
**What actually happens:** Request forwarded to Gemini/OpenAI/Claude

## Free Tier Limits
- 100,000 requests/day
- More than enough for personal use!

## Security Notes
- Your API keys are sent through the proxy, not stored
- Use HTTPS (automatic with Cloudflare)
- The worker code is private to your account
