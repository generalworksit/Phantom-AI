/**
 * ANTI-EQUALITY CHAT - Popup Script
 * Handles UI interactions and communication with service worker
 */

// State
let currentProvider = 'gemini';
let messages = [];
let settings = {};
let masterPassword = null;
let isLocked = false;

// DOM Elements
const elements = {
    // Views
    chatView: document.getElementById('chatView'),
    settingsView: document.getElementById('settingsView'),

    // Header
    settingsBtn: document.getElementById('settingsBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    popoutBtn: document.getElementById('popoutBtn'),

    // Provider
    providerBtns: document.querySelectorAll('.provider-btn'),
    connectionStatus: document.getElementById('connectionStatus'),

    // Chat
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),

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

    // Models
    geminiModel: document.getElementById('geminiModel'),
    openaiModel: document.getElementById('openaiModel'),
    claudeModel: document.getElementById('claudeModel'),

    // Screenshot
    screenshotBtn: document.getElementById('screenshotBtn'),

    // Modal
    passwordModal: document.getElementById('passwordModal'),
    masterPasswordInput: document.getElementById('masterPasswordInput'),
    unlockBtn: document.getElementById('unlockBtn'),
    cancelUnlockBtn: document.getElementById('cancelUnlockBtn'),
    passwordError: document.getElementById('passwordError')
};

// Image handling
let capturedImage = null;

// Initialize
async function init() {
    await loadSettings();
    await checkApiKeys();
    setupEventListeners();
    await loadChatHistory();
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

    // Load saved models
    if (elements.geminiModel) elements.geminiModel.value = settings.geminiModel || 'gemini-1.5-flash';
    if (elements.openaiModel) elements.openaiModel.value = settings.openaiModel || 'gpt-4o-mini';
    if (elements.claudeModel) elements.claudeModel.value = settings.claudeModel || 'claude-3-5-sonnet-20241022';

    // Select current provider
    selectProvider(settings.selectedProvider || 'gemini');

    // Check if locked
    if (settings.masterPasswordEnabled) {
        isLocked = true;
        showPasswordModal(); // Ensure modal shows if locked
    }
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

    // Pop-out window
    elements.popoutBtn.addEventListener('click', openPopout);

    // Screenshot
    if (elements.screenshotBtn) {
        elements.screenshotBtn.addEventListener('click', captureScreenshot);
    }

    // Provider selection
    elements.providerBtns.forEach(btn => {
        btn.addEventListener('click', () => selectProvider(btn.dataset.provider));
    });

    // Chat
    elements.sendBtn.addEventListener('click', sendChatMessage);
    elements.messageInput.addEventListener('keydown', handleInputKeydown);
    elements.messageInput.addEventListener('input', autoResizeTextarea);

    // Master Password Toggle
    elements.masterPasswordToggle.addEventListener('change', handleMasterPasswordToggle);
    elements.saveMasterPassword.addEventListener('click', saveMasterPasswordHandler);

    // Chat History Toggle
    elements.saveChatHistoryToggle.addEventListener('change', handleChatHistoryToggle);

    // Clear All Data
    elements.clearAllData.addEventListener('click', handleClearAllData);

    // API Key verify buttons
    document.querySelectorAll('.btn-verify').forEach(btn => {
        btn.addEventListener('click', () => verifyAndSaveApiKey(btn.dataset.provider));
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

    // Model selectors
    if (elements.geminiModel) {
        elements.geminiModel.addEventListener('change', (e) => {
            settings.geminiModel = e.target.value;
            saveSettings();
        });
    }
    if (elements.openaiModel) {
        elements.openaiModel.addEventListener('change', (e) => {
            settings.openaiModel = e.target.value;
            saveSettings();
        });
    }
    if (elements.claudeModel) {
        elements.claudeModel.addEventListener('change', (e) => {
            settings.claudeModel = e.target.value;
            saveSettings();
        });
    }

    // Password modal
    elements.unlockBtn.addEventListener('click', handleUnlock);
    elements.cancelUnlockBtn.addEventListener('click', hidePasswordModal);
    elements.masterPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleUnlock();
    });
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

    updateConnectionStatus();
}

// Update connection status
async function updateConnectionStatus() {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');

    const keyInput = document.getElementById(`${currentProvider}Key`);
    const hasKey = keyInput.value.trim() !== '' || await hasStoredKey(currentProvider);

    if (hasKey) {
        statusDot.classList.remove('error', 'loading');
        statusText.textContent = 'Ready';
        statusDot.style.background = 'var(--success)';
    } else {
        statusDot.classList.add('error');
        statusDot.classList.remove('loading');
        statusText.textContent = 'No API Key';
        statusDot.style.background = 'var(--danger)';
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

    updateConnectionStatus();
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
        // Test the key first
        const testResponse = await sendMessage({
            type: 'TEST_API_KEY',
            provider,
            apiKey
        });

        if (testResponse.success && testResponse.valid) {
            // Key is valid, save it
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

            updateConnectionStatus();
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
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Send chat message
async function sendChatMessage() {
    const content = elements.messageInput.value.trim();
    if (!content && !capturedImage) return;

    // Check if API key exists
    const hasKey = await hasStoredKey(currentProvider);
    if (!hasKey) {
        addSystemMessage('Please configure your API key in Settings first.');
        return;
    }

    // Add user message
    addMessage('user', content, capturedImage);
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';

    // Show typing indicator
    showTypingIndicator();

    // Disable input while processing
    elements.sendBtn.disabled = true;

    try {
        // Build messages array
        const chatMessages = messages.map(m => ({
            role: m.role,
            content: m.content,
            image: m.image
        }));

        // Determine selected model
        let selectedModel = null;
        if (currentProvider === 'gemini') selectedModel = settings.geminiModel || 'gemini-1.5-flash';
        if (currentProvider === 'openai') selectedModel = settings.openaiModel || 'gpt-4o-mini';
        if (currentProvider === 'claude') selectedModel = settings.claudeModel || 'claude-3-5-sonnet-20241022';

        const imageToSend = capturedImage;
        if (capturedImage) clearImagePreview();

        const response = await sendMessage({
            type: 'CHAT',
            provider: currentProvider,
            messages: chatMessages,
            masterPassword,
            image: imageToSend,
            model: selectedModel
        });

        hideTypingIndicator();

        if (response.success) {
            addMessage('assistant', response.response);

            // Always save to shared storage for popup/popout sync
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

// Capture screenshot
async function captureScreenshot() {
    try {
        const response = await sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });

        if (response.success && response.dataUrl) {
            capturedImage = response.dataUrl;
            showImagePreview(capturedImage);
        } else {
            alert('Failed to capture screenshot: ' + (response.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Screenshot error:', error);
        alert('Screenshot error: ' + error.message);
    }
}

// Show image preview in input area
function showImagePreview(dataUrl) {
    // Check if preview already exists
    let previewContainer = document.getElementById('imagePreviewContainer');

    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'imagePreviewContainer';
        previewContainer.className = 'image-preview-container';
        previewContainer.style.padding = '8px 16px 0';
        previewContainer.style.display = 'flex';
        previewContainer.style.alignItems = 'center';

        const inputContainer = document.querySelector('.input-container');
        inputContainer.insertBefore(previewContainer, inputContainer.firstChild);
    }

    previewContainer.innerHTML = `
        <div style="position: relative; display: inline-block;">
            <img src="${dataUrl}" style="height: 60px; border-radius: 8px; border: 1px solid var(--border-color);">
            <button id="removeImageBtn" style="position: absolute; top: -5px; right: -5px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">×</button>
        </div>
    `;

    document.getElementById('removeImageBtn').addEventListener('click', clearImagePreview);
}

// Clear image preview
function clearImagePreview() {
    capturedImage = null;
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
        previewContainer.remove();
    }
}

// Add message to chat
function addMessage(role, content, image = null) {
    messages.push({ role, content, image, timestamp: Date.now() });

    // Remove welcome message if present
    const welcomeMsg = elements.chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const avatarIcon = role === 'user' ? '👤' : getProviderIcon();

    let imageHtml = '';
    if (image) {
        imageHtml = `<img src="${image}" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-color);">`;
    }

    messageEl.innerHTML = `
    <div class="message-avatar">${avatarIcon}</div>
    <div class="message-content">
        ${imageHtml}
        ${formatMessage(content)}
    </div>
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
    if (!content) return '';
    // Escape HTML
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks
    content = content.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
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
      </div>
      <p class="setup-hint">Configure your API keys in <strong>Settings</strong> to get started</p>
    </div>
  `;
}

// Load chat history (from shared storage)
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

        let imageHtml = '';
        if (msg.image) {
            imageHtml = `<img src="${msg.image}" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-color);">`;
        }

        messageEl.innerHTML = `
          <div class="message-avatar">${avatarIcon}</div>
          <div class="message-content">
            ${imageHtml}
            ${formatMessage(msg.content)}
          </div>
        `;
        elements.chatMessages.appendChild(messageEl);
    });

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

    // Reset inputs
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

    // Reset state
    messages = [];
    settings = {};
    masterPassword = null;
    capturedImage = null; // Clear image
    clearImagePreview();

    // Reload
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
    isLocked = false;
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

// Open pop-out window
function openPopout() {
    chrome.windows.create({
        url: chrome.runtime.getURL('popout/popout.html'),
        type: 'popup',
        width: 900,
        height: 700,
        focused: true
    });
}

// Start app
init();

