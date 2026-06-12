# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

English conversation practice app using Vue 3 + TypeScript + Vite. Users chat with AI (NVIDIA NIM or OpenAI) to practice English. Includes simulated responses when no API keys are configured.

## Commands

```bash
pnpm dev      # Start Vite dev server (frontend)
pnpm proxy    # Start Express proxy server (CORS workaround, runs separately)
pnpm build    # Type check + production build
pnpm preview  # Preview production build
```

The proxy server is required for API calls — run `pnpm proxy` in a separate terminal before using the app.

## Architecture

### Frontend (src/)
- **App.vue** → ChatWindow component only
- **components/**
  - `ChatWindow.vue` — Main chat UI, handles message sending/display
  - `MessageBubble.vue` — Individual message rendering
  - `ChatInput.vue` — Text input with send button
  - `SettingsModal.vue` — Provider/model/API key configuration
- **composables/**
  - `useNVIDIA.ts` — NVIDIA NIM API integration
  - `useOpenAI.ts` — OpenAI API integration
- **types/index.ts` — `Message` and `ChatConversation` interfaces

### Proxy Server (proxy-server.mjs)
Express server that proxies requests to NVIDIA NIM and OpenAI to avoid CORS. Routes:
- `POST /proxy/nvidia` — NVIDIA NIM chat completions
- `POST /proxy/openai` — OpenAI chat completions

### Provider Selection Logic
When both providers have API keys configured, `VITE_DEFAULT_PROVIDER` determines which is used. Single-key scenarios use that key automatically. Fallback is simulated responses.

## Environment Variables

All environment variables for the frontend must use `VITE_` prefix (Vite convention):

```bash
# API Configuration
VITE_NVIDIA_API_KEY=your_nvidia_api_key_here
VITE_NVIDIA_MODEL=minimaxai/minimax-m2.7
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-3.5-turbo

# Provider (nvidia | openai)
VITE_DEFAULT_PROVIDER=nvidia

# Proxy Server (no prefix - Node.js)
PROXY_PORT=3001
```

Copy `.env.example` to `.env` for development. The `.env` file is gitignored.