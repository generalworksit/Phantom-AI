/**
 * ANTI-EQUALITY CHAT - Service Worker
 * Handles all background operations in isolated context
 */

import { CryptoUtils } from '../lib/crypto-utils.js';
import { AIManager } from '../lib/ai-manager.js';

// Initialize managers
const crypto = new CryptoUtils();
const aiManager = new AIManager();

// Message handler for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'SAVE_API_KEY':
        await saveApiKey(message.provider, message.apiKey, message.masterPassword);
        sendResponse({ success: true });
        break;

      case 'GET_API_KEY':
        const key = await getApiKey(message.provider, message.masterPassword);
        sendResponse({ success: true, apiKey: key });
        break;

      case 'TEST_API_KEY':
        const isValid = await testApiKey(message.provider, message.apiKey);
        sendResponse({ success: true, valid: isValid });
        break;

      case 'CHAT':
        const response = await sendChatMessage(message.provider, message.messages, message.masterPassword);
        sendResponse({ success: true, response });
        break;

      case 'SAVE_SETTINGS':
        await chrome.storage.local.set({ settings: message.settings });
        sendResponse({ success: true });
        break;

      case 'GET_SETTINGS':
        const result = await chrome.storage.local.get('settings');
        sendResponse({ success: true, settings: result.settings || getDefaultSettings() });
        break;

      case 'SAVE_CHAT_HISTORY':
        await saveChatHistory(message.history, message.masterPassword);
        sendResponse({ success: true });
        break;

      case 'GET_CHAT_HISTORY':
        const history = await getChatHistory(message.masterPassword);
        sendResponse({ success: true, history });
        break;

      case 'CLEAR_ALL_DATA':
        await chrome.storage.local.clear();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Service worker error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function getDefaultSettings() {
  return {
    masterPasswordEnabled: false,
    saveChatHistory: false,
    selectedProvider: 'gemini',
    theme: 'dark',
    streamResponses: true,
    maxTokens: 2048,
    temperature: 0.7,
    proxyUrl: '',  // Stealth proxy URL (e.g., https://study-notes.user.workers.dev)
    useProxy: false
  };
}

async function saveApiKey(provider, apiKey, masterPassword) {
  const settings = (await chrome.storage.local.get('settings')).settings || getDefaultSettings();

  let keyToStore = apiKey;
  if (settings.masterPasswordEnabled && masterPassword) {
    keyToStore = await crypto.encrypt(apiKey, masterPassword);
  }

  const keys = (await chrome.storage.local.get('apiKeys')).apiKeys || {};
  keys[provider] = keyToStore;
  await chrome.storage.local.set({ apiKeys: keys });
}

async function getApiKey(provider, masterPassword) {
  const settings = (await chrome.storage.local.get('settings')).settings || getDefaultSettings();
  const keys = (await chrome.storage.local.get('apiKeys')).apiKeys || {};

  if (!keys[provider]) return null;

  if (settings.masterPasswordEnabled && masterPassword) {
    return await crypto.decrypt(keys[provider], masterPassword);
  }

  return keys[provider];
}

async function testApiKey(provider, apiKey) {
  return await aiManager.testConnection(provider, apiKey);
}

async function sendChatMessage(provider, messages, masterPassword) {
  const apiKey = await getApiKey(provider, masterPassword);
  if (!apiKey) {
    throw new Error('API key not found. Please add your API key in settings.');
  }

  // Check if proxy mode is enabled
  const settings = (await chrome.storage.local.get('settings')).settings || getDefaultSettings();

  if (settings.useProxy && settings.proxyUrl) {
    // Use stealth proxy
    return await sendViaProxy(provider, apiKey, messages, settings);
  }

  return await aiManager.chat(provider, apiKey, messages);
}

// Send message through stealth proxy
async function sendViaProxy(provider, apiKey, messages, settings) {
  const response = await fetch(`${settings.proxyUrl}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Provider': provider,
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      messages,
      temperature: settings.temperature || 0.7,
      max_tokens: settings.maxTokens || 2048
    })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Proxy request failed');
  }

  return data.response;
}

async function saveChatHistory(history, masterPassword) {
  const settings = (await chrome.storage.local.get('settings')).settings || getDefaultSettings();

  let historyToStore = JSON.stringify(history);
  if (settings.masterPasswordEnabled && masterPassword) {
    historyToStore = await crypto.encrypt(historyToStore, masterPassword);
  }

  await chrome.storage.local.set({ chatHistory: historyToStore });
}

async function getChatHistory(masterPassword) {
  const settings = (await chrome.storage.local.get('settings')).settings || getDefaultSettings();
  const result = await chrome.storage.local.get('chatHistory');

  if (!result.chatHistory) return [];

  let history = result.chatHistory;
  if (settings.masterPasswordEnabled && masterPassword) {
    history = await crypto.decrypt(history, masterPassword);
  }

  return JSON.parse(history);
}

// Log startup
console.log('🔒 ANTI-EQUALITY CHAT service worker initialized');

// ========================================
// Context Menu
// ========================================

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'askAI',
    title: 'Ask AI about "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'openPopout',
    title: 'Open ANTI-EQUALITY CHAT',
    contexts: ['all']
  });

  console.log('✅ Context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'askAI' && info.selectionText) {
    // Store selected text for the popout to use
    chrome.storage.local.set({
      pendingQuestion: info.selectionText,
      pendingTimestamp: Date.now()
    });
    // Open popout window
    openPopoutWindow();
  } else if (info.menuItemId === 'openPopout') {
    openPopoutWindow();
  }
});

// ========================================
// Keyboard Commands
// ========================================

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_popout') {
    openPopoutWindow();
  }
});

// ========================================
// Pop-out Window
// ========================================

function openPopoutWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('popout/popout.html'),
    type: 'popup',
    width: 900,
    height: 700,
    focused: true
  });
}
