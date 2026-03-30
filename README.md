# Crypto Signal Board

Verifiable AI-powered crypto trading signals. Aggregates 6 technical indicators with macro risk analysis, all verified in OpenGradient's Trusted Execution Environment (TEE).

## What it does

1. Fetches real-time OHLC candles from Binance
2. Runs 6 technical indicators locally (SMA, EMA, RSI, MACD, Bollinger Bands, Volume)
3. Sends indicator consensus + market data to an LLM running in a TEE
4. LLM analyzes macro events (FOMC, CPI, token unlocks) and produces a combined verdict
5. Every AI prediction comes with a cryptographic proof — it cannot be altered after the fact

## Why TEE matters

- Traditional signal providers can edit predictions retroactively
- TEE guarantees the AI ran in a secure enclave — the output is signed and immutable
- No one (not even the server operator) can tamper with the result

## Tech Stack

- **Next.js 16** + React 19 + TypeScript + Tailwind CSS 4
- **Binance API** for real-time market data
- **OpenGradient TEE** for verified AI inference
- **x402 Protocol** for micropayments to TEE nodes
- **viem** for blockchain interactions

## Getting Started

```bash
# Install
npm install

# Set up env
cp .env.example .env.local
# Add your Base Sepolia wallet private key (with test tokens)

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `APP_WALLET_PRIVATE_KEY` | Yes | Base Sepolia wallet for x402 payments |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | Set to `0` for TEE devnet certs |

## Architecture

```
Binance API --> OHLC candles (100 x 1h)
     |
     v
Local TA Engine --> SMA, EMA, RSI, MACD, BB, Volume
     |
     v
OpenGradient TEE (LLM) --> Macro risk + combined verdict
     |                       with cryptographic proof
     v
Dashboard UI --> Price, indicators, consensus bar,
                 macro panel, AI verdict + TEE badge
```

Built with [OpenGradient](https://opengradient.ai).
