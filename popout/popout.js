/**
 * ANTI-EQUALITY CHAT - Pop-out Script
 * Extended functionality for the larger window
 */

// State
let currentProvider = 'gemini';
let messages = [];
let settings = {};
let masterPassword = null;
let systemPrompt = '';
let tokenCount = 0;

// DOM Elements
const elements = {
    // Views
    chatView: document.getElementById('chatView'),
    settingsView: document.getElementById('settingsView'),
    sidebar: document.getElementById('sidebar'),

    // Header
    settingsBtn: document.getElementById('settingsBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    themeToggle: document.getElementById('themeToggle'),
    exportBtn: document.getElementById('exportBtn'),
    screenshotBtn: document.getElementById('screenshotBtn'),
    tokenCount: document.getElementById('tokenCount'),

    // Provider
    providerBtns: document.querySelectorAll('.provider-btn'),

    // Chat
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),

    // Sidebar
    toggleSidebar: document.getElementById('toggleSidebar'),
    closeSidebar: document.getElementById('closeSidebar'),
    systemPromptInput: document.getElementById('systemPrompt'),
    savePrompt: document.getElementById('savePrompt'),
    clearPrompt: document.getElementById('clearPrompt'),
    presetBtns: document.querySelectorAll('.preset-btn'),

    // Settings Navigation
    backToChat: document.getElementById('backToChat'),

    // Security Settings
    masterPasswordToggle: document.getElementById('masterPasswordToggle'),
    masterPasswordSetup: document.getElementById('masterPasswordSetup'),
    newMasterPassword: document.getElementById('newMasterPassword'),
    confirmMasterPassword: document.getElementById('confirmMasterPassword'),
    saveMasterPassword: document.getElementById('saveMasterPassword'),
    saveChatHistoryToggle: document.getElementById('saveChatHistoryToggle'),
    clearAllData: document.getElementById('clearAllData'),

    // API Keys
    geminiKey: document.getElementById('geminiKey'),
    openaiKey: document.getElementById('openaiKey'),
    claudeKey: document.getElementById('claudeKey'),
    geminiStatus: document.getElementById('geminiStatus'),
    openaiStatus: document.getElementById('openaiStatus'),
    claudeStatus: document.getElementById('claudeStatus'),

    // Advanced
    maxTokens: document.getElementById('maxTokens'),
    temperature: document.getElementById('temperature'),
    temperatureValue: document.getElementById('temperatureValue'),

    // Modal
    passwordModal: document.getElementById('passwordModal'),
    masterPasswordInput: document.getElementById('masterPasswordInput'),
    unlockBtn: document.getElementById('unlockBtn'),
    cancelUnlockBtn: document.getElementById('cancelUnlockBtn'),
    passwordError: document.getElementById('passwordError')
};

// Initialize
async function init() {
    await loadSettings();
    await checkApiKeys();
    await loadSystemPrompt();
    setupEventListeners();
    await loadChatHistory();
    applyTheme();
}

// Load settings from storage
async function loadSettings() {
    const response = await sendMessage({ type: 'GET_SETTINGS' });
    if (response.success) {
        settings = response.settings;
        applySettings();
    }
}

// Apply settings to UI
function applySettings() {
    elements.masterPasswordToggle.checked = settings.masterPasswordEnabled;
    elements.saveChatHistoryToggle.checked = settings.saveChatHistory;
    elements.maxTokens.value = settings.maxTokens || 2048;
    elements.temperature.value = settings.temperature || 0.7;
    elements.temperatureValue.textContent = settings.temperature || 0.7;

    selectProvider(settings.selectedProvider || 'gemini');
}

// Save settings
async function saveSettings() {
    await sendMessage({ type: 'SAVE_SETTINGS', settings });
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    elements.settingsBtn.addEventListener('click', showSettings);
    elements.backToChat.addEventListener('click', showChat);
    elements.clearChatBtn.addEventListener('click', clearChat);

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Export
    elements.exportBtn.addEventListener('click', exportChat);

    // Screenshot
    if (elements.screenshotBtn) {
        elements.screenshotBtn.addEventListener('click', captureScreenshot);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);

    // Provider selection
    elements.providerBtns.forEach(btn => {
        btn.addEventListener('click', () => selectProvider(btn.dataset.provider));
    });

    // Chat
    elements.sendBtn.addEventListener('click', sendChatMessage);
    elements.messageInput.addEventListener('keydown', handleInputKeydown);
    elements.messageInput.addEventListener('input', autoResizeTextarea);

    // Sidebar
    elements.toggleSidebar.addEventListener('click', toggleSidebarVisibility);
    elements.closeSidebar.addEventListener('click', () => elements.sidebar.classList.add('hidden'));
    elements.savePrompt.addEventListener('click', saveSystemPrompt);
    elements.clearPrompt.addEventListener('click', clearSystemPrompt);

    // Preset prompts
    elements.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.systemPromptInput.value = btn.dataset.prompt;
            saveSystemPrompt();
        });
    });

    // Master Password Toggle
    elements.masterPasswordToggle.addEventListener('change', handleMasterPasswordToggle);
    elements.saveMasterPassword.addEventListener('click', saveMasterPasswordHandler);

    // Chat History Toggle
    elements.saveChatHistoryToggle.addEventListener('change', handleChatHistoryToggle);

    // Clear All Data
    elements.clearAllData.addEventListener('click', handleClearAllData);

    // API Key verify buttons (same as popup)
    document.querySelectorAll('.btn-verify').forEach(btn => {
        btn.addEventListener('click', () => verifyAndSaveApiKey(btn.dataset.provider));
    });

    // Still support old buttons if present
    document.querySelectorAll('.btn-test').forEach(btn => {
        btn.addEventListener('click', () => testApiKey(btn.dataset.provider));
    });

    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', () => saveApiKey(btn.dataset.provider));
    });

    // Temperature slider
    elements.temperature.addEventListener('input', (e) => {
        elements.temperatureValue.textContent = e.target.value;
        settings.temperature = parseFloat(e.target.value);
        saveSettings();
    });

    // Max tokens
    elements.maxTokens.addEventListener('change', (e) => {
        settings.maxTokens = parseInt(e.target.value);
        saveSettings();
    });

    // Password modal
    if (elements.unlockBtn) {
        elements.unlockBtn.addEventListener('click', handleUnlock);
    }
    if (elements.cancelUnlockBtn) {
        elements.cancelUnlockBtn.addEventListener('click', hidePasswordModal);
    }
}

// Theme functions
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    settings.theme = isLight ? 'light' : 'dark';
    saveSettings();
    updateThemeIcon();
}

function applyTheme() {
    if (settings.theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    const isLight = document.body.classList.contains('light-theme');

    if (isLight) {
        // Moon icon
        icon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    } else {
        // Sun icon
        icon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    }
}

// Sidebar functions
function toggleSidebarVisibility() {
    elements.sidebar.classList.toggle('hidden');
    elements.toggleSidebar.classList.toggle('active');
}

// System prompt functions
async function loadSystemPrompt() {
    const result = await chrome.storage.local.get('systemPrompt');
    if (result.systemPrompt) {
        systemPrompt = result.systemPrompt;
        elements.systemPromptInput.value = systemPrompt;
    }
}

async function saveSystemPrompt() {
    systemPrompt = elements.systemPromptInput.value.trim();
    await chrome.storage.local.set({ systemPrompt });
}

function clearSystemPrompt() {
    systemPrompt = '';
    elements.systemPromptInput.value = '';
    chrome.storage.local.remove('systemPrompt');
}

// Export chat
function exportChat() {
    if (messages.length === 0) {
        alert('No messages to export');
        return;
    }

    const date = new Date().toISOString().split('T')[0];
    let markdown = `# ANTI-EQUALITY CHAT Export\n`;
    markdown += `**Date:** ${date}\n`;
    markdown += `**Provider:** ${currentProvider}\n\n`;
    markdown += `---\n\n`;

    messages.forEach(msg => {
        const role = msg.role === 'user' ? '👤 **You**' : `${getProviderIcon()} **AI**`;
        markdown += `${role}\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anti-equality-chat-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// View switching
function showSettings() {
    elements.chatView.classList.remove('active');
    elements.settingsView.classList.add('active');
}

function showChat() {
    elements.settingsView.classList.remove('active');
    elements.chatView.classList.add('active');
}

// Provider selection
function selectProvider(provider) {
    currentProvider = provider;
    settings.selectedProvider = provider;
    saveSettings();

    elements.providerBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.provider === provider);
    });
}

// Check API keys on load
async function checkApiKeys() {
    const providers = ['gemini', 'openai', 'claude'];

    for (const provider of providers) {
        const hasKey = await hasStoredKey(provider);
        const statusEl = document.getElementById(`${provider}Status`);

        if (hasKey && statusEl) {
            statusEl.textContent = 'Configured';
            statusEl.classList.add('configured');
            statusEl.classList.remove('error');
        }
    }
}

// Check if API key exists
async function hasStoredKey(provider) {
    try {
        const response = await sendMessage({
            type: 'GET_API_KEY',
            provider,
            masterPassword
        });
        return response.success && response.apiKey;
    } catch {
        return false;
    }
}

// Verify and Save API key (combined function)
async function verifyAndSaveApiKey(provider) {
    const keyInput = document.getElementById(`${provider}Key`);
    const statusEl = document.getElementById(`${provider}Status`);
    const apiKey = keyInput.value.trim();

    if (!apiKey) {
        statusEl.textContent = 'Paste your API key first';
        statusEl.classList.add('error');
        statusEl.classList.remove('configured');
        return;
    }

    statusEl.textContent = 'Verifying...';
    statusEl.classList.remove('configured', 'error');

    try {
        const testResponse = await sendMessage({
            type: 'TEST_API_KEY',
            provider,
            apiKey
        });

        if (testResponse.success && testResponse.valid) {
            await sendMessage({
                type: 'SAVE_API_KEY',
                provider,
                apiKey,
                masterPassword
            });

            statusEl.textContent = '✓ Activated';
            statusEl.classList.add('configured');
            statusEl.classList.remove('error');
            keyInput.value = '';
        } else {
            statusEl.textContent = '✗ Invalid API key';
            statusEl.classList.add('error');
            statusEl.classList.remove('configured');
        }
    } catch (error) {
        statusEl.textContent = '✗ Connection error';
        statusEl.classList.add('error');
        statusEl.classList.remove('configured');
    }
}

// Test API key (legacy)
async function testApiKey(provider) {
    const keyInput = document.getElementById(`${provider}Key`);
    const statusEl = document.getElementById(`${provider}Status`);
    const apiKey = keyInput.value.trim();

    if (!apiKey) {
        statusEl.textContent = 'Enter a key first';
        statusEl.classList.add('error');
        return;
    }

    statusEl.textContent = 'Testing...';
    statusEl.classList.remove('configured', 'error');

    try {
        const response = await sendMessage({
            type: 'TEST_API_KEY',
            provider,
            apiKey
        });

        if (response.success && response.valid) {
            statusEl.textContent = 'Valid ✓';
            statusEl.classList.add('configured');
        } else {
            statusEl.textContent = 'Invalid ✗';
            statusEl.classList.add('error');
        }
    } catch (error) {
        statusEl.textContent = 'Error testing';
        statusEl.classList.add('error');
    }
}

// Save API key (legacy)
async function saveApiKey(provider) {
    const keyInput = document.getElementById(`${provider}Key`);
    const statusEl = document.getElementById(`${provider}Status`);
    const apiKey = keyInput.value.trim();

    if (!apiKey) {
        statusEl.textContent = 'Enter a key first';
        statusEl.classList.add('error');
        return;
    }

    try {
        await sendMessage({
            type: 'SAVE_API_KEY',
            provider,
            apiKey,
            masterPassword
        });

        statusEl.textContent = 'Saved ✓';
        statusEl.classList.add('configured');
        statusEl.classList.remove('error');
        keyInput.value = '';
    } catch (error) {
        statusEl.textContent = 'Error saving';
        statusEl.classList.add('error');
    }
}

// Handle input keydown
function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Estimate tokens (rough approximation)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Update token counter
function updateTokenCount(text) {
    tokenCount += estimateTokens(text);
    elements.tokenCount.textContent = tokenCount.toLocaleString();
}

// Send chat message
async function sendChatMessage() {
    const content = elements.messageInput.value.trim();
    if (!content) return;

    const hasKey = await hasStoredKey(currentProvider);
    if (!hasKey) {
        addSystemMessage('Please configure your API key in Settings first.');
        return;
    }

    addMessage('user', content);
    updateTokenCount(content);
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';

    showTypingIndicator();
    elements.sendBtn.disabled = true;

    try {
        // Build messages array with system prompt
        const chatMessages = [];

        if (systemPrompt) {
            chatMessages.push({ role: 'system', content: systemPrompt });
        }

        chatMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

        const response = await sendMessage({
            type: 'CHAT',
            provider: currentProvider,
            messages: chatMessages,
            masterPassword
        });

        hideTypingIndicator();

        if (response.success) {
            addMessage('assistant', response.response);
            updateTokenCount(response.response);

            // Save to shared storage for popup/popout sync
            await saveCurrentMessages();
        } else {
            addSystemMessage(`Error: ${response.error}`);
        }
    } catch (error) {
        hideTypingIndicator();
        addSystemMessage(`Error: ${error.message}`);
    }

    elements.sendBtn.disabled = false;
}

// Add message to chat
function addMessage(role, content) {
    messages.push({ role, content, timestamp: Date.now() });

    const welcomeMsg = elements.chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const avatarIcon = role === 'user' ? '👤' : getProviderIcon();

    messageEl.innerHTML = `
    <div class="message-avatar">${avatarIcon}</div>
    <div class="message-content">${formatMessage(content)}</div>
  `;

    elements.chatMessages.appendChild(messageEl);
    scrollToBottom();

    // Save to shared storage for popup/popout sync
    saveCurrentMessages();
}

// Add system message
function addSystemMessage(content) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message assistant';
    messageEl.innerHTML = `
    <div class="message-avatar">⚠️</div>
    <div class="message-content" style="border-color: var(--warning);">${content}</div>
  `;
    elements.chatMessages.appendChild(messageEl);
    scrollToBottom();
}

// Get provider icon
function getProviderIcon() {
    const icons = { gemini: '✨', openai: '🤖', claude: '🧠' };
    return icons[currentProvider] || '🤖';
}

// Format message with markdown-like styling
function formatMessage(content) {
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    content = content.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    content = content.replace(/\n/g, '<br>');
    return content;
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
    <div class="message-avatar">${getProviderIcon()}</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
    elements.chatMessages.appendChild(indicator);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Clear chat
function clearChat() {
    messages = [];
    tokenCount = 0;
    elements.tokenCount.textContent = '0';
    elements.chatMessages.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-icon">⚡</div>
      <h2>Welcome to ANTI-EQUALITY CHAT</h2>
      <p>Secure, private AI conversations</p>
      <div class="welcome-tips">
        <div class="tip">
          <span class="tip-icon">🔐</span>
          <span>Your API keys are encrypted locally</span>
        </div>
        <div class="tip">
          <span class="tip-icon">👁️</span>
          <span>No tracking, no data collection</span>
        </div>
        <div class="tip">
          <span class="tip-icon">🛡️</span>
          <span>Stealth mode active - undetectable</span>
        </div>
        <div class="tip">
          <span class="tip-icon">⌨️</span>
          <span>Press Ctrl+Shift+A to quick open</span>
        </div>
      </div>
      <p class="setup-hint">Configure your API keys in <strong>Settings</strong> to get started</p>
    </div>
  `;
}

// Load chat history (from shared storage - same as popup)
async function loadChatHistory() {
    try {
        // Load from shared session storage (for popup/popout sync)
        const result = await chrome.storage.session.get('currentMessages');

        if (result.currentMessages && result.currentMessages.length > 0) {
            messages = result.currentMessages;
            renderMessages();
            return;
        }

        // Fall back to persistent history if enabled
        if (settings.saveChatHistory) {
            const response = await sendMessage({
                type: 'GET_CHAT_HISTORY',
                masterPassword
            });

            if (response.success && response.history && response.history.length > 0) {
                messages = response.history;
                renderMessages();
            }
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

// Render messages to the chat UI
function renderMessages() {
    // Remove welcome message
    const welcomeMsg = elements.chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // Clear existing messages
    elements.chatMessages.innerHTML = '';

    // Render messages
    messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.role}`;
        const avatarIcon = msg.role === 'user' ? '👤' : getProviderIcon();
        messageEl.innerHTML = `
          <div class="message-avatar">${avatarIcon}</div>
          <div class="message-content">${formatMessage(msg.content)}</div>
        `;
        elements.chatMessages.appendChild(messageEl);
        tokenCount += estimateTokens(msg.content);
    });

    elements.tokenCount.textContent = tokenCount.toLocaleString();
    scrollToBottom();
}

// Save current messages to shared storage (for popup/popout sync)
async function saveCurrentMessages() {
    try {
        // Save to session storage for popup/popout sync
        await chrome.storage.session.set({ currentMessages: messages });

        // Also save to persistent history if enabled
        if (settings.saveChatHistory) {
            await sendMessage({
                type: 'SAVE_CHAT_HISTORY',
                history: messages,
                masterPassword
            });
        }
    } catch (error) {
        console.error('Failed to save messages:', error);
    }
}

// Handle master password toggle
function handleMasterPasswordToggle() {
    if (elements.masterPasswordToggle.checked) {
        elements.masterPasswordSetup.classList.remove('hidden');
    } else {
        elements.masterPasswordSetup.classList.add('hidden');
        settings.masterPasswordEnabled = false;
        masterPassword = null;
        saveSettings();
    }
}

// Save master password
function saveMasterPasswordHandler() {
    const password = elements.newMasterPassword.value;
    const confirm = elements.confirmMasterPassword.value;

    if (!password || password.length < 4) {
        alert('Password must be at least 4 characters');
        return;
    }

    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }

    masterPassword = password;
    settings.masterPasswordEnabled = true;
    saveSettings();

    elements.newMasterPassword.value = '';
    elements.confirmMasterPassword.value = '';
    elements.masterPasswordSetup.classList.add('hidden');

    alert('Master password set! Your API keys will now be encrypted.');
}

// Handle chat history toggle
function handleChatHistoryToggle() {
    settings.saveChatHistory = elements.saveChatHistoryToggle.checked;
    saveSettings();
}

// Handle clear all data
async function handleClearAllData() {
    if (!confirm('Are you sure you want to delete ALL data?\n\nThis will remove:\n• All API keys\n• Chat history\n• All settings\n\nThis cannot be undone!')) {
        return;
    }

    await sendMessage({ type: 'CLEAR_ALL_DATA' });

    messages = [];
    settings = {};
    masterPassword = null;
    tokenCount = 0;

    await loadSettings();
    clearChat();

    alert('All data has been cleared.');
}

// Show password modal
function showPasswordModal() {
    elements.passwordModal.classList.remove('hidden');
    elements.masterPasswordInput.focus();
}

// Hide password modal
function hidePasswordModal() {
    elements.passwordModal.classList.add('hidden');
    elements.masterPasswordInput.value = '';
    elements.passwordError.classList.add('hidden');
}

// Handle unlock
async function handleUnlock() {
    const password = elements.masterPasswordInput.value;

    if (!password) {
        elements.passwordError.classList.remove('hidden');
        return;
    }

    masterPassword = password;
    hidePasswordModal();

    await checkApiKeys();
    await loadChatHistory();
}

// Send message to service worker
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

// Start app
init();

// Handle global keyboard shortcuts
function handleGlobalKeydown(e) {
    // Ctrl+Shift+S: Screenshot
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        captureScreenshot();
    }
}

// Capture screenshot (stealth mode - downloads as image)
async function captureScreenshot() {
    try {
        // Capture the visible tab using Chrome API
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        });

        // Generate a stealth filename (no obvious extension name)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `capture_${timestamp}.png`;

        // Download the screenshot
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show subtle confirmation
        const btn = elements.screenshotBtn;
        if (btn) {
            btn.style.color = 'var(--success)';
            setTimeout(() => {
                btn.style.color = '';
            }, 1000);
        }
    } catch (error) {
        console.error('Screenshot failed:', error);
        addSystemMessage('Screenshot failed. Use browser screenshot (Win+Shift+S) instead.');
    }
}
