/**
 * Crypto Utilities - AES-256-GCM Encryption
 * Secure encryption for API keys and chat history
 */

export class CryptoUtils {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /**
     * Derive a key from password using PBKDF2
     */
    async deriveKey(password, salt) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt data with AES-256-GCM
     */
    async encrypt(plaintext, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            this.encoder.encode(plaintext)
        );

        // Combine salt + iv + ciphertext and encode as base64
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    /**
     * Decrypt data with AES-256-GCM
     */
    async decrypt(ciphertext, password) {
        try {
            const combined = new Uint8Array(
                atob(ciphertext).split('').map(c => c.charCodeAt(0))
            );

            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const encrypted = combined.slice(28);

            const key = await this.deriveKey(password, salt);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            return this.decoder.decode(decrypted);
        } catch (error) {
            throw new Error('Decryption failed. Wrong password?');
        }
    }

    /**
     * Generate a random encryption key (for session keys)
     */
    generateRandomKey(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }
}
