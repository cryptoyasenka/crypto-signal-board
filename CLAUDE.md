# Crypto Signal Board — Project Plan

## Project Overview

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 dashboard for crypto trading signals.
Uses Binance API for market data, OpenGradient TEE for AI analysis, and OpenGradient Model Hub for ML predictions.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Binance API — real-time OHLC candles
- OpenGradient TEE — LLM macro analysis via x402 protocol (Base Sepolia + OPG tokens)
- OpenGradient Model Hub — ONNX ML models for predictions
- viem — blockchain interactions

## Current State

### Working:
- 6 technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Volume)
- AI macro analysis in TEE with cryptographic proof
- 25 trading pairs
- Price chart, auto-refresh, signal history, mobile responsive UI
- Model Hub UI panel renders (violet theme, Brain icon)
- On-chain TX sends successfully to OpenGradient devnet

### Broken:
- **Model Hub prediction shows 0.0000%** — PIPE inference on devnet doesn't emit InferenceResult events. This is an OpenGradient infrastructure bug (Python SDK also fails with same error). See GitHub Issue #1.

## TODO — What Needs to Be Done

### Priority 1: Fix Model Hub predictions (0.0000% problem)

The on-chain inference is broken on OpenGradient's side. Solution: **download the ONNX model and run it locally with onnxruntime-node**.

#### Steps:

1. **Download the ONNX model file**
   - Model: `og-1hr-volatility-ethusdt` version 0.06
   - File: `ethusdt_r1std_60min_smallinput.onnx` (7KB)
   - Hub API (no auth): `https://api.opengradient.ai/api/v0/models/og-1hr-volatility-ethusdt`
   - Try endpoints to find download URL, or use Python SDK: `pip install opengradient` then download
   - Hub CID: `jKzAHsOHS1zA193_9N-n5H_IjupBjKce08qMLLseRe8`
   - Save to `src/models/volatility.onnx` (create directory)

2. **Install onnxruntime-node**
   ```bash
   npm install onnxruntime-node
   ```

3. **Rewrite `src/lib/og-models.ts`** to use local ONNX inference:
   - Replace `client.infer()` with `ort.InferenceSession.create()` + `session.run()`
   - Model input: `open_high_low_close` — Float32 tensor shape [10, 4] (10 candles x OHLC)
   - Model output: `Y` — Float32 tensor shape [1] (volatility percentage)
   - Keep using `fetchCandles(pair, '30m', 10)` for input data
   - Since it's local inference, txHash can be 'local-onnx' and explorerUrl can link to Hub page

4. **Update `src/components/model-hub-panel.tsx`** if needed:
   - If txHash is 'local-onnx', show "Local ONNX" badge instead of explorer link
   - Or keep explorer link pointing to model page on Hub

5. **Verify prediction is not 0.0000%** — should show a real volatility value

### Priority 2: Clean up SDK dependency (optional)

If ONNX local inference works, the `opengradient-sdk` package and `scripts/fix-og-sdk.js` patches are only needed for TEE (AI analysis part). You can:
- Remove SDK dependency if TEE also doesn't need it (check `src/lib/og-infer.ts`)
- Or keep it — it's not harmful

### Priority 3: Deploy to Vercel

```bash
vercel --prod
```

Env vars needed:
- `APP_WALLET_PRIVATE_KEY` — Base Sepolia wallet for x402 TEE payments
- `OPENGRADIENT_PRIVATE_KEY` — same key (used by SDK)
- `NODE_TLS_REJECT_UNAUTHORIZED=0` — for TEE devnet certs

Note: for local ONNX inference, wallet keys are NOT needed (only for TEE AI part).

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/og-models.ts` | Model Hub inference — **REWRITE THIS** for local ONNX |
| `src/lib/og-infer.ts` | TEE LLM inference (working, don't touch) |
| `src/lib/binance.ts` | Binance API — candles, ticker, stats |
| `src/lib/indicators.ts` | 6 technical indicators |
| `src/lib/types.ts` | TypeScript types (includes ModelPrediction) |
| `src/app/api/signals/route.ts` | Main API route — runs indicators + TEE + Model Hub |
| `src/app/page.tsx` | Main page — renders all panels |
| `src/components/model-hub-panel.tsx` | Model Hub UI panel (violet theme) |
| `src/components/indicator-card.tsx` | Individual indicator cards |
| `src/components/verdict-banner.tsx` | AI verdict display |
| `src/components/macro-panel.tsx` | Macro risk events panel |
| `scripts/fix-og-sdk.js` | Postinstall patches for opengradient-sdk |

## Model Details

| Field | Value |
|-------|-------|
| Name | og-1hr-volatility-ethusdt |
| Author | OpenGradient |
| Version | 0.06 |
| File | ethusdt_r1std_60min_smallinput.onnx |
| Size | 7KB |
| Input | `open_high_low_close` — tensor(float32) shape [10, 4] |
| Output | `Y` — tensor(float32) shape [1] |
| Hub CID | jKzAHsOHS1zA193_9N-n5H_IjupBjKce08qMLLseRe8 |
| Hub page | https://hub.opengradient.ai/models/og-1hr-volatility-ethusdt |

## Commands

```bash
npm install          # install deps
npm run postinstall  # patches opengradient-sdk
npm run dev          # dev server at localhost:3000
npm run build        # production build
```

## Architecture

```
Binance API ──> OHLC candles
       │
       ├──> Local TA Engine ──> 6 indicators + consensus
       │
       ├──> OpenGradient TEE (LLM) ──> macro risk + AI verdict (with proof)
       │
       └──> ONNX Model (local) ──> volatility prediction ← FIX THIS
                │
                v
         Dashboard UI ──> all panels rendered
```
