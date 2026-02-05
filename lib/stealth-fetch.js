/**
 * Stealth Fetch - Obfuscated HTTP Requests
 * Makes API calls harder to detect and track
 */

export class StealthFetch {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];
    }

    /**
     * Get a random user agent
     */
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * Add random delay to avoid pattern detection
     */
    async randomDelay() {
        const delay = 100 + Math.random() * 400; // 100-500ms
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Make a stealth fetch request
     */
    async fetch(url, options = {}) {
        await this.randomDelay();

        const headers = new Headers(options.headers || {});

        // Don't override API-specific headers, just add stealth ones
        if (!headers.has('User-Agent')) {
            headers.set('User-Agent', this.getRandomUserAgent());
        }

        // Remove potentially identifying headers
        headers.delete('X-Requested-With');

        const stealthOptions = {
            ...options,
            headers: headers,
            referrerPolicy: 'no-referrer',
            mode: 'cors',
            credentials: 'omit'
        };

        try {
            const response = await fetch(url, stealthOptions);
            return response;
        } catch (error) {
            console.error('Stealth fetch error:', error);
            throw error;
        }
    }

    /**
     * Make a stealth POST request with JSON body
     */
    async postJSON(url, data, apiKeyHeader = {}) {
        return await this.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...apiKeyHeader
            },
            body: JSON.stringify(data)
        });
    }
}
