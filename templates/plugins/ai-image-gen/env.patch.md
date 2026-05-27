# Append to .env.example (ai-image-gen plugin)

```env
# AI Image Generation (ai-image-gen plugin)
# Provider: dezgo | openai | local
IMAGE_GEN_PROVIDER=dezgo

# Dezgo (default provider — Flux model)
# Get your key at: https://dezgo.com/account
DEZGO_API_KEY=your-dezgo-api-key
# Optional: override the Dezgo model (default: flux_1_schnell_fp8)
# DEZGO_MODEL=flux_1_schnell_fp8

# OpenAI DALL-E (set IMAGE_GEN_PROVIDER=openai)
# OPENAI_API_KEY=sk-...
# Optional: override the model (default: dall-e-3)
# DALLE_MODEL=dall-e-3

# Local Stable Diffusion (set IMAGE_GEN_PROVIDER=local)
# Requires Automatic1111 running with --api flag
# LOCAL_DIFFUSION_URL=http://localhost:7860

# Per-user rate limit: max image generations per minute (default: 10)
IMAGE_GEN_RATE_LIMIT_RPM=10
```
