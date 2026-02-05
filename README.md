# ⚡ Phantom-AI
   THIS PROJECT IS IN BETA SOIN PRODUCTION NOT FULLY FINISHED YET SO MAY HAVE SOME ERRORS    
> **Stealth AI Chat Extension** - Private, Encrypted, Undetectable

A Chrome extension that provides secure AI chat with Gemini, OpenAI, and Claude — featuring encrypted API key storage, stealth communications, and zero tracking.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-00C853?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🔐 **Encrypted Storage** | AES-256-GCM encryption for API keys |
| 💬 **Multi-Provider** | Gemini, OpenAI GPT, Claude support |
| 🪟 **Pop-out Window** | Larger chat in separate window |
| 📝 **System Prompts** | Custom AI personas |
| 🎨 **Theme Toggle** | Light/dark mode |
| ➡️ **Context Menu** | Right-click → "Ask AI" |
| ⌨️ **Shortcuts** | `Ctrl+Shift+A` popup, `Ctrl+Shift+O` pop-out |
| 🎫 **Token Counter** | Track usage |
| 📤 **Export Chat** | Download as Markdown |
| 🛡️ **Stealth Mode** | Undetectable by monitoring extensions |

---

## 📦 Installation

1. Clone this repository
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the cloned folder

---

## 🔑 Getting API Keys

| Provider | Link |
|----------|------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) |
| Claude | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open popup |
| `Ctrl+Shift+O` | Open pop-out window |
| `Enter` | Send message |
| `Shift+Enter` | New line |

---

## 🛡️ Privacy & Security

- ✅ **Minimal permissions** - Only `storage` and `contextMenus`
- ✅ **No tab access** - Cannot read your browsing
- ✅ **Encrypted storage** - API keys protected with AES-256
- ✅ **No tracking** - Zero analytics, no data collection
- ✅ **Request obfuscation** - Stealth API calls
- ✅ **Local only** - All data stays on your machine

---

## 📁 Project Structure

```
├── manifest.json          # Extension configuration
├── background/            # Service worker
├── popup/                 # Main popup UI
├── popout/                # Pop-out window UI
├── lib/                   # Core libraries
│   ├── providers/         # AI provider integrations
│   ├── crypto-utils.js    # Encryption utilities
│   └── stealth-fetch.js   # Request obfuscation
└── icons/                 # Extension icons
```

---

## 📄 License

MIT © 2026
