# Claude Code Router - Quick Start Guide 🚀

## ⚡ 5-Minute Setup

### Step 1: Get Your API Keys (2 minutes)

1. **Anthropic API Key**:
   - Visit: https://console.anthropic.com/
   - Sign in → Settings → API Keys → Create Key
   - Copy key (starts with `sk-ant-`)

2. **Z.AI API Key**:
   - Visit: https://z.ai/subscribe
   - Subscribe to GLM Coding Plan ($3/month)
   - Dashboard → API Keys → Generate
   - Copy key

### Step 2: Run Setup Script (2 minutes)

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3
./claude-router-setup.sh
```

When prompted, paste your API keys.

### Step 3: Start Using (1 minute)

```bash
# Start Claude Code with router
ccr code

# Inside Claude Code, switch between models:
/model zai,glm-4.6              # Switch to Z.AI GLM
/model anthropic,claude-opus-4   # Switch to Anthropic
```

---

## 🎯 Most Common Usage Patterns

### Pattern 1: Cost-Conscious Developer

```bash
# Start with Z.AI for daily work
/model zai,glm-4.6

# Switch to Anthropic only for complex problems
/model anthropic,claude-opus-4
```

**Savings**: ~90% compared to using Anthropic exclusively

### Pattern 2: Performance-First Developer

```bash
# Default: Anthropic Sonnet for balanced performance
/model anthropic,claude-sonnet-4-5

# Complex reasoning: Opus
/model anthropic,claude-opus-4

# Long documents: GLM-4.6 (200K context)
/model zai,glm-4.6
```

### Pattern 3: Experimenter

```bash
# Try different models for same task
/model zai,glm-4.6               # Chinese AI
/model anthropic,claude-opus-4   # Best Western AI
/model openrouter,gemini-2.5-pro # Google's latest
```

---

## 📋 Command Cheat Sheet

### Router Commands (Terminal)
```bash
ccr code         # Start Claude Code with router
ccr ui           # Open config web interface
ccr model        # Interactive model selector
ccr restart      # Restart after config changes
ccr stop         # Stop the router
```

### Model Switching (Inside Claude Code)
```bash
# Format: /model provider,model-name

# Anthropic Models
/model anthropic,claude-opus-4
/model anthropic,claude-sonnet-4-5
/model anthropic,claude-3-5-haiku-20241022

# Z.AI Models
/model zai,glm-4.6        # Latest, most powerful
/model zai,glm-4.5-air    # Fastest, cheapest
/model zai,glm-4.5        # Middle ground
```

---

## 🔧 Configuration File Reference

**Location**: `~/.claude-code-router/config.json`

### Minimal Working Config

```json
{
  "Providers": [
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "sk-ant-YOUR-KEY",
      "models": ["claude-sonnet-4-5", "claude-opus-4"]
    },
    {
      "name": "zai",
      "api_base_url": "https://api.z.ai/api/paas/v4/chat/completions",
      "api_key": "YOUR-ZAI-KEY",
      "models": ["glm-4.6", "glm-4.5-air"]
    }
  ],
  "Router": {
    "default": "anthropic,claude-sonnet-4-5"
  }
}
```

### Edit API Keys

```bash
nano ~/.claude-code-router/config.json
# Replace YOUR-KEY placeholders
# Save: Ctrl+X, Y, Enter
# Restart: ccr restart
```

---

## 🐛 Quick Troubleshooting

### Problem: ccr command not found
```bash
npm install -g @musistudio/claude-code-router
```

### Problem: Invalid API key
```bash
# Edit config and check keys
nano ~/.claude-code-router/config.json
ccr restart
```

### Problem: Model switch doesn't work
```bash
# Use correct format: provider,model
/model zai,glm-4.6
# NOT: /model glm-4.6
```

### Problem: Configuration changes not working
```bash
ccr restart  # Always restart after config edits
```

---

## 💡 Pro Tips

1. **Use GLM for most work** → Save 90% on costs
2. **Switch to Opus for hard problems** → Get best reasoning
3. **Use UI mode** for easy config → `ccr ui`
4. **Enable debug logging** for troubleshooting → Set `"LOG_LEVEL": "debug"`
5. **Leverage automatic routing** → Configure Router section properly

---

## 📊 Quick Cost Comparison

| Scenario | Without Router | With Router | Savings |
|----------|---------------|-------------|---------|
| 1000 requests/month (mixed tasks) | $150 | $15 | 90% |
| Pure coding work | $120 | $3-15 | 87-97% |
| Complex reasoning heavy | $200 | $50 | 75% |

---

## ✅ Verification Steps

After setup, verify everything works:

```bash
# 1. Start router
ccr code

# 2. Test Anthropic (inside Claude Code)
> Hi, what model are you?
/model anthropic,claude-sonnet-4-5
> What model are you now?

# 3. Test Z.AI
/model zai,glm-4.6
> What model are you now?

# 4. Test switching
/model anthropic,claude-opus-4
> Tell me about yourself
```

If all responses come back, you're good to go! ✅

---

## 📚 Need More Help?

- **Full Guide**: Read `CLAUDE_ROUTER_GUIDE.md`
- **Config Issues**: Run `ccr ui` for visual editor
- **Model Questions**: Run `ccr model` for interactive CLI
- **Logs**: `tail -f ~/.claude-code-router/claude-code-router.log`

---

**Happy Coding!** 🎉

Remember:
- Start with `ccr code`
- Switch models with `/model provider,model`
- Use Z.AI for 90% of tasks
- Save Anthropic Opus for the really hard stuff

You now have the power of multiple AI models at your fingertips! 🚀
