# Crypto Signal Board

Verifiable AI-powered crypto trading signals. Aggregates 6 technical indicators with macro risk analysis verified in OpenGradient's Trusted Execution Environment (TEE), plus ML volatility predictions via ONNX models from the OpenGradient Model Hub.

## What it does

1. Fetches real-time OHLC candles from Binance (25 trading pairs)
2. Runs 6 technical indicators locally (SMA, EMA, RSI, MACD, Bollinger Bands, Volume)
3. Sends indicator consensus + market data to an LLM running in a TEE
4. LLM analyzes macro events (FOMC, CPI, token unlocks) and produces a combined verdict
5. Runs a volatility prediction model (ONNX) locally for 1-hour volatility forecast
6. Every AI prediction comes with a cryptographic proof — it cannot be altered after the fact

## Why TEE matters

- Traditional signal providers can edit predictions retroactively
- TEE guarantees the AI ran in a secure enclave — the output is signed and immutable
- No one (not even the server operator) can tamper with the result

## Tech Stack

- **Next.js 16** + React 19 + TypeScript + Tailwind CSS 4
- **Binance API** for real-time market data (25 pairs)
- **OpenGradient TEE** for verified AI inference via x402 protocol
- **OpenGradient Model Hub** — ONNX volatility model (`og-1hr-volatility-ethusdt`)
- **onnxruntime-node** for local ML inference
- **viem** for blockchain interactions

## Getting Started

```bash
# Install
npm install

# Set up env
cat > .env.local << 'EOF'
APP_WALLET_PRIVATE_KEY=0x...your_base_sepolia_private_key...
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `APP_WALLET_PRIVATE_KEY` | Yes | Base Sepolia wallet for x402 TEE payments |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | Set to `0` for TEE devnet self-signed certs |

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

## Model Hub

The volatility model (`og-1hr-volatility-ethusdt` v0.06) runs locally via `onnxruntime-node`:
- **Input:** 10 x 30-min OHLC candles (tensor shape [10, 4])
- **Output:** Predicted 1-hour volatility % (tensor shape [1])
- **Source:** [OpenGradient Model Hub](https://hub.opengradient.ai/models/og-1hr-volatility-ethusdt)

Built with [OpenGradient](https://opengradient.ai).
