# Crypto Signal Board — Full Project Plan (until release)

## Project Overview

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 dashboard for crypto trading signals.
Uses Binance API for market data, OpenGradient TEE for verified AI analysis, and OpenGradient Model Hub ONNX models for ML volatility predictions.

**Goal: hackathon-ready demo with real predictions, deployed on Vercel.**

## FIRST THING TO DO

Before anything else, check if `.env.local` exists. If not, create it:

```
APP_WALLET_PRIVATE_KEY=0xe3d0db9c3ef5f7187c5b5ba57477b4a705e23e715d43f0a302e2731d2a68d88e
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Then run `npm install` and `npm run dev` to verify the project starts.

After that, follow the TODO phases below in order. Work through each phase, verify it works, commit, and move to the next.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Binance API — real-time OHLC candles
- OpenGradient TEE — LLM macro analysis via x402 protocol (Base Sepolia + OPG tokens)
- OpenGradient Model Hub — ONNX ML models for predictions
- viem — blockchain interactions
- onnxruntime-node — local ONNX inference (needs to be added)

## Current State

### Working:
- 6 technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Volume)
- AI macro analysis in TEE with cryptographic proof (x402 payment flow)
- 25 trading pairs via Binance
- Price chart (48h candles), auto-refresh, signal history (localStorage), mobile responsive
- Model Hub UI panel renders (violet theme, Brain icon)
- On-chain TX sends successfully to OpenGradient devnet (chain 10740)

### Broken:
- **Model Hub prediction shows 0.0000%** — PIPE inference on devnet doesn't emit InferenceResult events. OpenGradient infrastructure bug — Python SDK also fails with same error. See GitHub Issue #1.

### Not done yet:
- Local ONNX inference (the fix for 0.0000%)
- Production build verification
- Vercel deployment
- README update for final state
- Error handling polish

---

## FULL TODO — Steps to Release

### Phase 1: Fix Model Hub (0.0000% → real prediction)

**Problem:** On-chain PIPE inference doesn't return results.
**Solution:** Download the 7KB ONNX model and run locally via `onnxruntime-node`.

#### Step 1.1: Get the ONNX model file

Model: `og-1hr-volatility-ethusdt` v0.06, file: `ethusdt_r1std_60min_smallinput.onnx` (7KB)

Try these approaches in order:
1. Hub API: `GET https://api.opengradient.ai/api/v0/models/og-1hr-volatility-ethusdt` — explore response, look for download links or file URLs
2. Hub API versions: `GET https://api.opengradient.ai/api/v0/models/og-1hr-volatility-ethusdt/versions`
3. Try download URL patterns like `/versions/0.06/files/ethusdt_r1std_60min_smallinput.onnx`
4. Python SDK fallback: `pip install opengradient && python -c "import opengradient; opengradient.download_model('og-1hr-volatility-ethusdt')"`
5. Hub CID: `jKzAHsOHS1zA193_9N-n5H_IjupBjKce08qMLLseRe8` (SHA256, NOT IPFS)

Save to: `models/volatility.onnx` (project root, NOT src/)

#### Step 1.2: Install onnxruntime-node

```bash
npm install onnxruntime-node
```

Note: `onnxruntime-node` has native binaries. If issues on Windows, try `onnxruntime-web` as fallback (runs in WASM, works everywhere).

#### Step 1.3: Rewrite `src/lib/og-models.ts`

Replace `client.infer()` with local ONNX inference:

```typescript
import * as ort from 'onnxruntime-node';
import path from 'path';
import { fetchCandles, type Pair } from './binance';

const MODEL_PATH = path.join(process.cwd(), 'models', 'volatility.onnx');

async function runVolatilityModel(pair: Pair): Promise<ModelPrediction> {
  const candles30m = await fetchCandles(pair, '30m', 10);
  const ohlcMatrix = candles30m.map(c => [c.open, c.high, c.low, c.close]);

  // Flatten [10][4] → Float32Array(40)
  const flat = new Float32Array(ohlcMatrix.flat());
  const inputTensor = new ort.Tensor('float32', flat, [10, 4]);

  const session = await ort.InferenceSession.create(MODEL_PATH);
  const results = await session.run({ open_high_low_close: inputTensor });

  const volatility = results.Y.data[0] as number;

  // ... interpret volatility, return ModelPrediction
}
```

Key points:
- Input: `open_high_low_close` — Float32 tensor shape [10, 4] (10 x 30min OHLC candles)
- Output: `Y` — Float32 tensor shape [1] (predicted volatility %)
- Use `fetchCandles(pair, '30m', 10)` for input data (same as before)
- Remove `opengradient-sdk` import from this file
- txHash = `'local-onnx'`, explorerUrl = Hub model page URL

#### Step 1.4: Update model-hub-panel.tsx

- If `txHash === 'local-onnx'`, show "ONNX Model" or "Model Hub" badge instead of blockchain explorer link
- Keep link to `https://hub.opengradient.ai/models/og-1hr-volatility-ethusdt`

#### Step 1.5: Verify

```bash
npm run dev
# Click "Analyze" → Model Hub panel should show a REAL volatility % (not 0.0000%)
```

### Phase 2: Clean up

#### Step 2.1: Remove opengradient-sdk if not needed

Check: `src/lib/opengradient.ts` (TEE/AI part) does NOT use opengradient-sdk — it uses viem + fetch directly. So if local ONNX inference works:

```bash
npm uninstall opengradient-sdk
```

Also remove:
- `scripts/fix-og-sdk.js`
- `abi/` directory (if exists)
- `postinstall` script from package.json

This eliminates all the SDK patches and makes the project cleaner.

#### Step 2.2: Clean up og-models.ts

Remove any remaining references to opengradient-sdk, Client, InferenceMode.

### Phase 3: Production readiness

#### Step 3.1: Build check

```bash
npm run build
```

Fix any TypeScript errors, unused imports, build warnings.

#### Step 3.2: Error handling

Make sure:
- If ONNX model file is missing → graceful error in Model Hub panel ("Model file not found")
- If Binance API fails → error shown to user
- If TEE is down → AI verdict shows fallback (already implemented)
- If Model Hub fails → panel shows "offline" state (already implemented)

#### Step 3.3: Update README.md

Update to reflect final architecture:
- Mention ONNX local inference (not on-chain)
- Update architecture diagram
- Add Model Hub section
- Update env vars (wallet key only needed for TEE, not for Model Hub)

### Phase 4: Deploy

#### Step 4.1: Vercel deployment

```bash
npx vercel --prod
```

Or connect GitHub repo to Vercel for auto-deploy.

Environment variables to set in Vercel dashboard:
- `APP_WALLET_PRIVATE_KEY` — Base Sepolia wallet private key (for TEE x402 payments)
- `NODE_TLS_REJECT_UNAUTHORIZED=0` — for TEE devnet self-signed certs

**Important:** The ONNX model file (`models/volatility.onnx`) must be in the repo (it's only 7KB) so Vercel includes it in the build. If using `onnxruntime-node`, check that Vercel's serverless functions support native modules — if not, switch to `onnxruntime-web`.

#### Step 4.2: Verify deployed version

- Open Vercel URL
- Click "Analyze" on several pairs
- Check that:
  - Price loads ✓
  - Indicators calculate ✓
  - AI verdict appears (or graceful fallback) ✓
  - Model Hub shows real prediction (not 0.0000%) ✓
  - Price chart renders ✓
  - Pair switching works ✓
  - Mobile layout works ✓

### Phase 5: Final polish (optional but nice)

- Add loading states for individual panels (not just global skeleton)
- Add "About" section explaining what OpenGradient TEE and Model Hub are
- Add link to GitHub repo in footer
- Performance: cache ONNX session (don't create new InferenceSession per request)
- Consider adding more models from Hub if available

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/og-models.ts` | Model Hub inference | **REWRITE** for local ONNX |
| `src/lib/opengradient.ts` | TEE LLM inference (x402 flow) | Working, don't touch |
| `src/lib/binance.ts` | Binance API — candles, ticker, stats | Working |
| `src/lib/indicators.ts` | 6 technical indicators | Working |
| `src/lib/types.ts` | TypeScript types (ModelPrediction, SignalResponse, etc.) | Working |
| `src/app/api/signals/route.ts` | Main API route — parallel TEE + Model Hub | Working |
| `src/app/page.tsx` | Main page — all panels | Working |
| `src/components/model-hub-panel.tsx` | Model Hub UI panel (violet) | May need minor update |
| `src/components/indicator-card.tsx` | Indicator cards | Working |
| `src/components/verdict-banner.tsx` | AI verdict display | Working |
| `src/components/macro-panel.tsx` | Macro risk events | Working |
| `src/components/price-chart.tsx` | Candlestick chart | Working |
| `src/components/pair-selector.tsx` | 25-pair selector | Working |
| `src/components/auto-refresh.tsx` | Auto-refresh toggle | Working |
| `src/components/signal-history.tsx` | localStorage history | Working |
| `scripts/fix-og-sdk.js` | SDK patches | **DELETE** after removing SDK |

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
| Hub URL | https://hub.opengradient.ai/models/og-1hr-volatility-ethusdt |
| Hub API | https://api.opengradient.ai/api/v0/models/og-1hr-volatility-ethusdt |

## Environment

```bash
npm install          # install deps
npm run dev          # dev server at localhost:3000
npm run build        # production build
```

`.env.local` needs:
```
APP_WALLET_PRIVATE_KEY=0x...   # Base Sepolia wallet for TEE payments
NODE_TLS_REJECT_UNAUTHORIZED=0 # TEE devnet certs
```

## Architecture

```
Binance API ──> OHLC candles (1h for indicators, 30m for ONNX model)
       │
       ├──> Local TA Engine ──> 6 indicators + consensus bar
       │
       ├──> OpenGradient TEE (LLM via x402) ──> macro risk + AI verdict + proof
       │
       └──> ONNX Model (local onnxruntime) ──> volatility prediction
                │
                v
         Next.js Dashboard UI ──> all panels, chart, history
```
