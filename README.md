# Crypto Signal Board

**AI-powered crypto trading signals, verified in a Trusted Execution Environment.**

Real-time technical analysis for 25 trading pairs, combined with an LLM macro-risk verdict that runs inside an OpenGradient TEE — every prediction is cryptographically signed and tamper-proof.

**[Live Demo](https://crypto-signal-board.vercel.app)**

---

## How It Works

| Step | What happens | Powered by |
|------|-------------|------------|
| 1 | Fetch 48h of 1-hour OHLC candles | Binance API |
| 2 | Compute 6 technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Volume) | Local TA engine |
| 3 | Run an LLM inside a TEE to assess macro risks (FOMC, CPI, ETF decisions, regulatory news) | OpenGradient TEE via x402 |
| 4 | Produce a combined Buy / Sell / Neutral verdict with confidence score | TEE-verified AI |
| 5 | Predict 1-hour volatility using an ONNX neural network | OpenGradient Model Hub |
| 6 | Display everything in a real-time dashboard | Next.js 16 |

Every AI prediction comes with a **cryptographic proof** — it cannot be altered after the fact.

---

## Why TEE Matters

Traditional signal providers can edit predictions retroactively. With TEE:

- The AI model runs inside a **secure enclave** — even the server operator cannot see or modify the computation
- Every output is **signed and immutable** — the result is tied to a verifiable on-chain transaction
- Users get a **trust guarantee**: what the AI predicted is exactly what you see

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Market Data | Binance API (25 pairs, 1h + 30m candles) |
| AI Inference | OpenGradient TEE (LLM via x402 protocol, Base Sepolia) |
| ML Predictions | ONNX model via onnxruntime-node (local inference) |
| Blockchain | viem (x402 payment flow for TEE access) |
| Deployment | Vercel (Stockholm region) |

---

## Features

- **6 Technical Indicators** — SMA, EMA, RSI, MACD, Bollinger Bands, Volume analysis with bull/bear/neutral consensus
- **TEE-Verified AI Verdict** — Buy/Sell/Neutral with confidence %, backed by on-chain proof
- **Macro Risk Assessment** — AI evaluates upcoming economic events and their crypto market impact
- **ML Volatility Forecast** — ONNX neural network predicts 1-hour price movement magnitude
- **Interactive Price Chart** — 48h candlestick chart with real-time data
- **25 Trading Pairs** — BTC, ETH, BNB, SOL, XRP, DOGE, ADA, and 18 more
- **Auto-Refresh** — continuous monitoring with configurable refresh interval
- **Signal History** — locally stored past signals for comparison
- **Mobile Responsive** — optimized layout for all screen sizes

---

## Architecture

```
                        Binance API
                            |
                   OHLC candles (1h + 30m)
                            |
              +-------------+-------------+
              |             |             |
        Local TA Engine  OpenGradient   ONNX Model
        (6 indicators)   TEE (LLM)    (volatility)
              |             |             |
              +-------------+-------------+
                            |
                    Next.js API Route
                     (parallel fetch)
                            |
                    Dashboard UI
           (charts, verdicts, indicators)
```

---

## Model Hub

The volatility model runs locally via `onnxruntime-node`:

| Field | Value |
|-------|-------|
| Model | `og-1hr-volatility-ethusdt` v0.06 |
| Input | 10 x 30-min OHLC candles — tensor `float32 [10, 4]` |
| Output | Predicted 1-hour volatility % — tensor `float32 [1]` |
| Size | 7 KB |
| Source | [OpenGradient Model Hub](https://hub.opengradient.ai/models/og-1hr-volatility-ethusdt) |

---

## Getting Started

```bash
# Clone
git clone https://github.com/cryptoyasenka/crypto-signal-board.git
cd crypto-signal-board

# Install dependencies
npm install

# Configure environment
cat > .env.local << 'EOF'
APP_WALLET_PRIVATE_KEY=0x...your_base_sepolia_private_key...
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_WALLET_PRIVATE_KEY` | Yes | Base Sepolia wallet private key for x402 TEE payments |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | Set to `0` for TEE devnet self-signed certs |

> **Note:** You need OPG tokens on Base Sepolia to pay for TEE inference. The wallet key is used to sign x402 payment transactions.

---

## Deployment

Deployed on Vercel with automatic deploys from `main`:

```bash
npx vercel --prod
```

The ONNX model file (7 KB) is included in the repo, so Vercel bundles it automatically.

---

Built with [OpenGradient](https://opengradient.ai) for the OpenGradient hackathon.
