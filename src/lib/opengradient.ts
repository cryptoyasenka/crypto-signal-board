import crypto from 'crypto';
import type { IndicatorResult, MacroEvent, AIVerdict } from './types';
import type { Candle } from './binance';

const OG_RPC = 'https://ogevmdevnet.opengradient.ai';
const TEE_REGISTRY_ADDRESS = '0x4e72238852f3c918f4E4e57AeC9280dDB0c80248' as const;
const MODEL = 'claude-haiku-4-5';
const PLACEHOLDER_AUTH = 'Bearer 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

const TEE_REGISTRY_ABI = [{
  name: 'getActiveTEEs',
  type: 'function',
  inputs: [{ name: 'teeType', type: 'uint8' }],
  outputs: [{ type: 'tuple[]', components: [
    { name: 'owner', type: 'address' },
    { name: 'paymentAddress', type: 'address' },
    { name: 'endpoint', type: 'string' },
    { name: 'publicKey', type: 'bytes' },
    { name: 'tlsCertificate', type: 'bytes' },
    { name: 'pcrHash', type: 'bytes32' },
    { name: 'teeType', type: 'uint8' },
    { name: 'enabled', type: 'bool' },
    { name: 'registeredAt', type: 'uint256' },
    { name: 'lastHeartbeatAt', type: 'uint256' },
  ]}],
  stateMutability: 'view',
}] as const;

let cachedTeeEndpoint: string | null = null;

async function getTeeEndpoint(): Promise<string> {
  if (cachedTeeEndpoint) return cachedTeeEndpoint;

  const { createPublicClient, http } = await import('viem');
  const client = createPublicClient({
    transport: http(OG_RPC),
    chain: {
      id: 10740,
      name: 'OG EVM Devnet',
      nativeCurrency: { name: 'OPG', symbol: 'OPG', decimals: 18 },
      rpcUrls: { default: { http: [OG_RPC] } },
    },
  });

  const tees = (await client.readContract({
    address: TEE_REGISTRY_ADDRESS,
    abi: TEE_REGISTRY_ABI,
    functionName: 'getActiveTEEs',
    args: [0],
  })) as unknown as Array<{ endpoint: string; enabled: boolean }>;

  const active = tees.filter((t) => t.enabled && t.endpoint);
  if (!active.length) throw new Error('No active TEE nodes found');

  cachedTeeEndpoint = active[0].endpoint + '/v1/chat/completions';
  console.log('[og] TEE endpoint:', cachedTeeEndpoint);
  return cachedTeeEndpoint;
}

async function teeNodeFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      // @ts-expect-error -- Node fetch option for self-signed TEE certs
      agent: undefined,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function createUptoPayment(
  privateKey: string,
  requirements: {
    network: string;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
  },
) {
  const { privateKeyToAccount } = await import('viem/accounts');
  const { getAddress } = await import('viem');

  const OG_PERMIT2_WITNESS_TYPES = {
    PermitWitnessTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'witness', type: 'Witness' },
    ],
    TokenPermissions: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    Witness: [
      { name: 'to', type: 'address' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'extra', type: 'bytes' },
    ],
  } as const;

  const OG_UPTO_PROXY = '0xBe08D629cc799E6C17200F454F68A61E017038C8';
  const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chainId = parseInt(requirements.network.split(':')[1]);
  const now = Math.floor(Date.now() / 1000);

  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = BigInt(
    '0x' +
      Array.from(nonceBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
  );
  const deadline = (now + requirements.maxTimeoutSeconds).toString();
  const validAfter = (now - 60).toString();

  const signature = await account.signTypedData({
    domain: { name: 'Permit2', chainId, verifyingContract: PERMIT2_ADDRESS },
    types: OG_PERMIT2_WITNESS_TYPES,
    primaryType: 'PermitWitnessTransferFrom',
    message: {
      permitted: {
        token: getAddress(requirements.asset),
        amount: BigInt(requirements.amount),
      },
      spender: getAddress(OG_UPTO_PROXY),
      nonce,
      deadline: BigInt(deadline),
      witness: {
        to: getAddress(requirements.payTo),
        validAfter: BigInt(validAfter),
        extra: '0x' as `0x${string}`,
      },
    },
  });

  return {
    x402Version: 2,
    payload: {
      signature,
      permit2Authorization: {
        from: account.address,
        permitted: {
          token: getAddress(requirements.asset),
          amount: requirements.amount,
        },
        spender: getAddress(OG_UPTO_PROXY),
        nonce: nonce.toString(),
        deadline,
        witness: { to: getAddress(requirements.payTo), validAfter, extra: '0x' },
      },
    },
  };
}

async function callTEE(prompt: string): Promise<{ content: string; txHash: string | null }> {
  const privateKey = process.env.APP_WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error('APP_WALLET_PRIVATE_KEY not set');

  const teeUrl = await getTeeEndpoint();
  const body = JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.2,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: PLACEHOLDER_AUTH,
    'X-SETTLEMENT-TYPE': 'batch',
  };

  // Step 1: probe
  console.log('[og] Probing TEE...');
  const probe = await teeNodeFetch(teeUrl, { method: 'POST', headers, body });

  if (probe.status !== 402) {
    if (!probe.ok) {
      const err = await probe.text().catch(() => '');
      throw new Error(`TEE returned ${probe.status}: ${err.slice(0, 300)}`);
    }
    const data = await probe.json();
    return { content: data?.choices?.[0]?.message?.content ?? '', txHash: null };
  }

  // Step 2: parse payment
  const payHeader = probe.headers.get('payment-required') ?? probe.headers.get('PAYMENT-REQUIRED');
  if (!payHeader) throw new Error('No payment-required header');
  const payReqs = JSON.parse(Buffer.from(payHeader, 'base64').toString());

  const accepts = payReqs.accepts ?? [];
  let req = accepts.find(
    (r: { scheme: string; network: string }) => r.scheme === 'upto' && r.network === 'eip155:84532',
  );
  if (!req) req = accepts[0];
  if (!req) throw new Error('No payment option found');

  // Step 3: pay and send
  console.log('[og] Sending payment...');
  const payment = await createUptoPayment(privateKey, req);
  const fullPayment = {
    ...payment,
    resource: payReqs.resource ?? teeUrl,
    accepted: req,
    extensions: payReqs.extensions ?? {},
  };
  const paymentHeader = Buffer.from(JSON.stringify(fullPayment)).toString('base64');

  const paid = await teeNodeFetch(teeUrl, {
    method: 'POST',
    headers: { ...headers, 'PAYMENT-SIGNATURE': paymentHeader },
    body,
  });

  if (!paid.ok) {
    const err = await paid.text().catch(() => '');
    throw new Error(`TEE payment failed ${paid.status}: ${err.slice(0, 300)}`);
  }

  const teeOutputHash = paid.headers.get('x-tee-output-hash');
  const teeRequestHash = paid.headers.get('x-tee-request-hash');
  const txHash = teeOutputHash ? `${teeRequestHash}:${teeOutputHash}` : null;

  const data = await paid.json();
  return { content: data?.choices?.[0]?.message?.content ?? '', txHash };
}

function buildPrompt(
  pair: string,
  price: number,
  stats: { priceChangePercent: number; high: number; low: number; volume: number },
  indicators: IndicatorResult[],
  candles: Candle[],
): string {
  const recent10 = candles.slice(-10).map((c) => ({
    time: new Date(c.openTime).toISOString(),
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close,
    vol: Math.round(c.volume),
  }));

  return `You are a crypto market analyst running inside a Trusted Execution Environment (TEE).
Your analysis is cryptographically verified and cannot be tampered with.

Today is ${new Date().toISOString().split('T')[0]}.

TASK: Analyze ${pair} and provide a trading signal with macro risk assessment.

CURRENT MARKET DATA:
- Pair: ${pair}
- Price: $${price.toFixed(2)}
- 24h Change: ${stats.priceChangePercent.toFixed(2)}%
- 24h High: $${stats.high.toFixed(2)}
- 24h Low: $${stats.low.toFixed(2)}
- 24h Volume: ${stats.volume.toFixed(0)}

RECENT 1H CANDLES (last 10):
${JSON.stringify(recent10, null, 1)}

TECHNICAL INDICATORS:
${indicators.map((i) => `- ${i.name}: ${i.signal.toUpperCase()} (${i.value}) — ${i.detail}`).join('\n')}

INDICATOR CONSENSUS: ${indicators.filter((i) => i.signal === 'bullish').length} bullish, ${indicators.filter((i) => i.signal === 'bearish').length} bearish, ${indicators.filter((i) => i.signal === 'neutral').length} neutral

INSTRUCTIONS:
1. Consider the technical indicator consensus
2. Think about any major macro events happening today or this week that could impact crypto markets (FOMC, CPI, NFP, ETF decisions, major token unlocks, regulatory news, geopolitical events)
3. Assess the macro risk level
4. Combine technical signals with macro context for a final verdict

Respond with ONLY valid JSON in this exact format:
{
  "macro_events": [
    {"event": "Event name", "time": "Today/Tomorrow/This week", "impact": "high|medium|low", "relevance": "How it affects crypto"}
  ],
  "macro_risk": "low|medium|high",
  "combined_verdict": "strong_buy|buy|neutral|sell|strong_sell",
  "confidence": 65,
  "summary": "2-3 sentence summary explaining the verdict, combining technical and macro factors"
}

If no significant macro events are happening, return an empty macro_events array and "low" macro_risk.
Be honest about uncertainty. Confidence should reflect how aligned the signals are (50 = mixed, 80+ = strong consensus).`;
}

export async function getAIVerdict(
  pair: string,
  price: number,
  stats: { priceChangePercent: number; high: number; low: number; volume: number },
  indicators: IndicatorResult[],
  candles: Candle[],
): Promise<AIVerdict> {
  const prompt = buildPrompt(pair, price, stats, indicators, candles);
  const { content, txHash } = await callTEE(prompt);

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid JSON');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    macro_events: parsed.macro_events ?? [],
    macro_risk: parsed.macro_risk ?? 'low',
    combined_verdict: parsed.combined_verdict ?? 'neutral',
    confidence: parsed.confidence ?? 50,
    summary: parsed.summary ?? '',
    txHash,
  };
}
