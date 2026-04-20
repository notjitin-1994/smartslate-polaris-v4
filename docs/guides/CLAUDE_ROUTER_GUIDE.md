# Claude Code Router - Complete Setup & Usage Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Model Switching](#model-switching)
7. [Advanced Configuration](#advanced-configuration)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Claude Code Router** is a powerful proxy tool that allows you to:
- Use **multiple AI providers** (Anthropic, Z.AI GLM, OpenRouter, etc.) with Claude Code
- **Switch between models dynamically** during a session using `/model` commands
- **Route different tasks** to different models (e.g., simple tasks to cheaper models)
- **Save costs** by using cost-effective models like GLM-4.6 ($3/month subscription)
- Maintain the **Claude Code interface** you're familiar with

### Why Use This?

| Feature | Native Claude Code | With Claude Code Router |
|---------|-------------------|------------------------|
| Providers | Anthropic only | Any provider (Anthropic, Z.AI, OpenRouter, etc.) |
| Model Switching | CLI restart required | Dynamic with `/model` command |
| Cost Optimization | Fixed pricing | Route tasks to cost-effective models |
| Flexibility | Limited | Highly customizable |

---

## ✅ Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
   ```bash
   node -v  # Should show v18.x.x or higher
   ```
   If not installed: https://nodejs.org

2. **API Keys**:
   - **Anthropic API Key**: Get from https://console.anthropic.com/
   - **Z.AI API Key**: Get from https://z.ai/subscribe (GLM Coding Plan)

3. **Operating System**: Linux, macOS, or WSL on Windows

---

## 🚀 Installation

### Method 1: Automated Setup (Recommended)

Run the provided setup script:

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3
./claude-router-setup.sh
```

The script will:
- ✅ Install Claude Code CLI
- ✅ Install Claude Code Router
- ✅ Create configuration directory
- ✅ Generate config file with your API keys
- ✅ Set up environment templates

### Method 2: Manual Installation

```bash
# 1. Install Claude Code
npm install -g @anthropic-ai/claude-code

# 2. Install Claude Code Router
npm install -g @musistudio/claude-code-router

# 3. Verify installation
claude --version
ccr --version
```

---

## ⚙️ Configuration

### Configuration File Location

**Main config**: `~/.claude-code-router/config.json`

### Basic Configuration Structure

The setup script creates this configuration for you:

```json
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 600000,
  "Providers": [
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "YOUR_ANTHROPIC_API_KEY",
      "models": [
        "claude-sonnet-4-5",
        "claude-opus-4",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022"
      ]
    },
    {
      "name": "zai",
      "api_base_url": "https://api.z.ai/api/paas/v4/chat/completions",
      "api_key": "YOUR_ZAI_API_KEY",
      "models": [
        "glm-4.6",
        "glm-4.5-air",
        "glm-4.5"
      ]
    }
  ],
  "Router": {
    "default": "anthropic,claude-sonnet-4-5",
    "background": "zai,glm-4.5-air",
    "think": "anthropic,claude-opus-4",
    "longContext": "zai,glm-4.6",
    "longContextThreshold": 60000
  }
}
```

### Adding Your API Keys

1. **Edit the config file**:
   ```bash
   nano ~/.claude-code-router/config.json
   ```

2. **Replace placeholders**:
   - `YOUR_ANTHROPIC_API_KEY` → Your actual Anthropic key (starts with `sk-ant-`)
   - `YOUR_ZAI_API_KEY` → Your actual Z.AI key

3. **Save and close** (Ctrl+X, then Y, then Enter)

### Using Environment Variables (Optional - More Secure)

Instead of hardcoding keys in config.json, use environment variables:

1. **Create `.env` file**:
   ```bash
   nano ~/.claude-code-router/.env
   ```

2. **Add keys**:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ZAI_API_KEY=your-zai-key-here
   ```

3. **Update config.json** to reference them:
   ```json
   {
     "Providers": [
       {
         "name": "anthropic",
         "api_key": "$ANTHROPIC_API_KEY",
         ...
       },
       {
         "name": "zai",
         "api_key": "$ZAI_API_KEY",
         ...
       }
     ]
   }
   ```

---

## 🎮 Usage

### Starting Claude Code with Router

```bash
# Start Claude Code through the router
ccr code
```

You'll see the Claude Code interface, but requests will be routed through your configured providers.

### Basic Commands

| Command | Description |
|---------|-------------|
| `ccr code` | Start Claude Code with router |
| `ccr ui` | Open web-based configuration UI |
| `ccr model` | Interactive model management CLI |
| `ccr restart` | Restart router (needed after config changes) |
| `ccr stop` | Stop the router |

---

## 🔄 Model Switching

### Dynamic Switching During Session

Once inside Claude Code, you can switch models on-the-fly:

```bash
# Switch to Z.AI GLM-4.6 (cost-effective)
/model zai,glm-4.6

# Switch to Anthropic Claude Opus 4 (most powerful)
/model anthropic,claude-opus-4

# Switch to Claude Sonnet 4.5 (balanced)
/model anthropic,claude-sonnet-4-5

# Switch to GLM-4.5-Air (fastest, cheapest)
/model zai,glm-4.5-air
```

### When to Use Which Model

| Task Type | Recommended Model | Why |
|-----------|------------------|-----|
| Complex reasoning, architecture | `anthropic,claude-opus-4` | Best reasoning capabilities |
| Daily coding tasks | `anthropic,claude-sonnet-4-5` | Balanced performance/cost |
| Simple queries, exploration | `zai,glm-4.5-air` | Fast and cost-effective |
| Long documents (>60K tokens) | `zai,glm-4.6` | 200K context window |
| Code generation, refactoring | `zai,glm-4.6` | Optimized for coding tasks |

### Automatic Routing

The router automatically uses different models for different scenarios based on your `Router` configuration:

- **`default`**: Used for most interactions
- **`background`**: Used for background tasks (file searches, etc.)
- **`think`**: Used when deep reasoning is needed
- **`longContext`**: Auto-switches when context exceeds `longContextThreshold`

---

## 🔧 Advanced Configuration

### Adding More Providers

Example: Adding OpenRouter for access to 400+ models

```json
{
  "Providers": [
    ...existing providers...,
    {
      "name": "openrouter",
      "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
      "api_key": "YOUR_OPENROUTER_KEY",
      "models": [
        "google/gemini-2.5-pro-preview",
        "anthropic/claude-sonnet-4",
        "deepseek/deepseek-coder"
      ],
      "transformer": {
        "use": ["openrouter"]
      }
    }
  ]
}
```

### Using Transformers

Transformers adapt requests/responses for provider compatibility:

```json
{
  "name": "deepseek",
  "api_base_url": "https://api.deepseek.com/chat/completions",
  "api_key": "YOUR_KEY",
  "models": ["deepseek-chat"],
  "transformer": {
    "use": ["deepseek", "tooluse"]  // Apply multiple transformers
  }
}
```

**Available transformers**:
- `openrouter` - OpenRouter API compatibility
- `deepseek` - DeepSeek API compatibility
- `gemini` - Google Gemini compatibility
- `tooluse` - Optimize tool usage
- `maxtoken` - Set custom token limits
- `reasoning` - Handle reasoning fields

### Custom Routing Rules

```json
{
  "Router": {
    "default": "zai,glm-4.6",              // Default for all tasks
    "background": "zai,glm-4.5-air",       // Fast, cheap for background
    "think": "anthropic,claude-opus-4",    // Powerful for reasoning
    "longContext": "zai,glm-4.6",          // 200K context window
    "longContextThreshold": 80000,         // Trigger at 80K tokens
    "webSearch": "openrouter,perplexity"   // Web search capable model
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Command not found: ccr"

**Solution**:
```bash
# Reinstall globally
npm install -g @musistudio/claude-code-router

# Check npm global path
npm config get prefix

# If needed, add to PATH
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Issue: "Invalid API Key"

**Solution**:
1. Check your API keys are correct in `~/.claude-code-router/config.json`
2. Verify keys work by testing directly:
   ```bash
   # Test Anthropic
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01"

   # Test Z.AI
   curl https://api.z.ai/api/paas/v4/chat/completions \
     -H "Authorization: Bearer YOUR_KEY"
   ```

### Issue: "Configuration changes not applied"

**Solution**:
```bash
# Always restart after config changes
ccr restart
```

### Issue: "Model not found"

**Solution**:
Ensure the model name exactly matches what's in your `models` array:
```bash
# Correct format: provider,model
/model zai,glm-4.6

# NOT:
/model glm-4.6  # Missing provider name
```

### Issue: "Connection timeout"

**Solution**:
1. Increase timeout in config:
   ```json
   {
     "API_TIMEOUT_MS": 900000  // 15 minutes
   }
   ```
2. Check your internet connection
3. Try a different model

### Enable Debug Logging

```json
{
  "LOG": true,
  "LOG_LEVEL": "debug"  // Change from "info" to "debug"
}
```

Logs are stored in:
- `~/.claude-code-router/logs/` (server logs)
- `~/.claude-code-router/claude-code-router.log` (app logs)

---

## 📊 Cost Comparison

### Anthropic Pricing
- Claude Opus 4: $15.00 / million input tokens
- Claude Sonnet 4.5: $3.00 / million input tokens
- Claude Haiku: $0.80 / million input tokens

### Z.AI GLM Coding Plan
- **$3/month**: 120 prompts per 5-hour cycle
- **$15/month**: 600 prompts per 5-hour cycle
- GLM-4.6: Comparable to Claude Sonnet 4 performance
- 30% more token-efficient than GLM-4.5

### Strategic Routing Savings

Example monthly usage:
```
Scenario: 1000 requests/month
- 40% complex tasks → Anthropic Claude Opus 4
- 60% simple tasks → Z.AI GLM-4.6

Without Router: ~$150/month (all Anthropic Opus)
With Router: ~$15/month (Z.AI subscription + limited Anthropic)

Savings: ~90%
```

---

## 🎓 Quick Reference

### Essential Commands

```bash
# Start
ccr code

# Switch models (during session)
/model zai,glm-4.6
/model anthropic,claude-opus-4

# Configuration
ccr ui          # Web UI for config
ccr model       # CLI model manager
ccr restart     # After config changes

# Logs
tail -f ~/.claude-code-router/claude-code-router.log
```

### Model Selection Cheat Sheet

```bash
# Budget-conscious workflow
/model zai,glm-4.5-air        # Exploration, simple queries
/model zai,glm-4.6            # Main coding work
/model anthropic,claude-opus-4 # Complex architecture only

# Performance-first workflow
/model anthropic,claude-sonnet-4-5  # Default
/model anthropic,claude-opus-4      # Hard problems
/model zai,glm-4.6                  # Long documents

# Experimental workflow
/model openrouter,gemini-2.5-pro    # Google's latest
/model openrouter,deepseek-coder    # Specialized coding
/model zai,glm-4.6                  # Chinese AI powerhouse
```

---

## 📚 Additional Resources

- **Claude Code Router GitHub**: https://github.com/musistudio/claude-code-router
- **Z.AI Documentation**: https://docs.z.ai
- **Anthropic Docs**: https://docs.anthropic.com
- **OpenRouter Models**: https://openrouter.ai/models

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: `~/.claude-code-router/claude-code-router.log`
2. **Restart router**: `ccr restart`
3. **Verify config**: `ccr ui` or `nano ~/.claude-code-router/config.json`
4. **Test API keys**: Use curl commands from troubleshooting section
5. **GitHub Issues**: https://github.com/musistudio/claude-code-router/issues

---

## ✅ Setup Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Claude Code CLI installed (`claude --version` works)
- [ ] Claude Code Router installed (`ccr --version` works)
- [ ] Configuration file created at `~/.claude-code-router/config.json`
- [ ] API keys added to configuration
- [ ] Router starts successfully (`ccr code`)
- [ ] Can switch models with `/model` command
- [ ] Both Anthropic and Z.AI providers work

---

**Setup Date**: 2025-01-07
**Configuration**: Anthropic Claude + Z.AI GLM-4.6
**Status**: Production Ready ✅

Enjoy coding with multiple AI providers! 🚀
