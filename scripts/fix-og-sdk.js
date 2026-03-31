// Fix opengradient-sdk missing ABI files
// The npm package doesn't include the abi/ directory from src/
const fs = require('fs');
const path = require('path');

const abiDir = path.join(__dirname, '..', 'node_modules', 'opengradient-sdk', 'dist', 'abi');

if (fs.existsSync(path.join(abiDir, 'inference.json'))) {
  console.log('[fix-og-sdk] ABI files already present, skipping.');
} else {
  fs.mkdirSync(abiDir, { recursive: true });
  const srcDir = path.join(__dirname, '..', 'abi');
  for (const file of ['inference.json', 'precompile.json']) {
    fs.copyFileSync(path.join(srcDir, file), path.join(abiDir, file));
  }
  console.log('[fix-og-sdk] Copied ABI files to opengradient-sdk/dist/abi/');
}

// Fix 2: Patch utils.js to handle float values in convertToModelInput
// The SDK passes { value: float, decimals: 0 } which causes BigNumber.from(float) to crash
const utilsPath = path.join(__dirname, '..', 'node_modules', 'opengradient-sdk', 'dist', 'utils.js');
if (fs.existsSync(utilsPath)) {
  let utils = fs.readFileSync(utilsPath, 'utf8');
  const needle = '{ value: value, decimals: 0 }';
  if (utils.includes(needle) && !utils.includes('floatToFixed')) {
    // Add helper function at top of file (after "use strict")
    const helper = `
function floatToFixed(n) {
  if (Number.isInteger(n)) return { value: n, decimals: 0 };
  var s = n.toFixed(8).replace(/0+$/, '');
  var dotIdx = s.indexOf('.');
  if (dotIdx === -1) return { value: parseInt(s), decimals: 0 };
  var dec = s.length - dotIdx - 1;
  return { value: Math.round(n * Math.pow(10, dec)), decimals: dec };
}
`;
    utils = utils.replace('"use strict";', '"use strict";' + helper);
    // Replace all occurrences of { value: X, decimals: 0 } with floatToFixed(X)
    utils = utils.replace(/\{ value: value, decimals: 0 \}/g, 'floatToFixed(value)');
    utils = utils.replace(/\{ value: n, decimals: 0 \}/g, 'floatToFixed(n)');
    utils = utils.replace(/\{ value: col, decimals: 0 \}/g, 'floatToFixed(col)');
    fs.writeFileSync(utilsPath, utils);
    console.log('[fix-og-sdk] Patched utils.js to handle float values');
  } else {
    console.log('[fix-og-sdk] utils.js already patched or pattern not found');
  }
}

// Fix 3: Patch client.js to handle empty logs (devnet doesn't emit events inline)
const clientPath = path.join(__dirname, '..', 'node_modules', 'opengradient-sdk', 'dist', 'client.js');
if (fs.existsSync(clientPath)) {
  let client = fs.readFileSync(clientPath, 'utf8');
  const oldCode = 'const event = receipt.logs[1];';
  if (client.includes(oldCode) && !client.includes('// PATCHED: handle empty logs')) {
    const newCode = `// PATCHED: handle empty logs on devnet
            if (!receipt.logs || receipt.logs.length < 2) {
                // No events emitted — try getting result from API node
                let inferenceID = null;
                if (receipt.logs && receipt.logs.length > 0) {
                    const precompileEventAbi = this.precompileContract.options.jsonInterface.find((x) => x.name === "ModelInferenceEvent").inputs;
                    const precompileDecodedLog = this.web3.eth.abi.decodeLog(precompileEventAbi || [], receipt.logs[0].data, receipt.logs[0].topics.slice(1));
                    inferenceID = precompileDecodedLog.inferenceID;
                }
                if (inferenceID) {
                    const inference_result = await (0, utils_1.getInferenceResultFromNode)(defaults_1.DEFAULT_CONFIG.apiUrl, inferenceID, inferenceMode8);
                    if (inference_result) {
                        var modelOutput = (0, utils_1.convertToModelOutput)(inference_result);
                        return [txHash.transactionHash, modelOutput];
                    }
                }
                // Return empty output with tx hash — inference may be async
                return [txHash.transactionHash, {}];
            }
            const event = receipt.logs[1];`;
    client = client.replace(oldCode, newCode);
    fs.writeFileSync(clientPath, client);
    console.log('[fix-og-sdk] Patched client.js to handle empty logs');
  } else {
    console.log('[fix-og-sdk] client.js already patched or pattern not found');
  }
}

// Fix 4: Patch defaults.js to use devnet (10740) instead of alpha testnet (10744)
// Python SDK v0.9.4 uses devnet; TS SDK is outdated and still points to deprecated alpha
const defaultsPath = path.join(__dirname, '..', 'node_modules', 'opengradient-sdk', 'dist', 'defaults.js');
if (fs.existsSync(defaultsPath)) {
  let defaults = fs.readFileSync(defaultsPath, 'utf8');
  if (defaults.includes('eth-devnet.opengradient.ai')) {
    defaults = defaults.replace(
      '"https://eth-devnet.opengradient.ai"',
      '"https://ogevmdevnet.opengradient.ai"'
    );
    fs.writeFileSync(defaultsPath, defaults);
    console.log('[fix-og-sdk] Patched defaults.js: RPC switched to devnet (10740)');
  } else {
    console.log('[fix-og-sdk] defaults.js already patched or pattern not found');
  }
}
