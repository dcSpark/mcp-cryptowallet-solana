import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'build', 'index.js');

test('wallet_validate_address with valid address', async () => {
  const server = spawn('node', [serverPath]);
  
  const request = {
    jsonrpc: '2.0',
    id: '1',
    method: 'tools/call',
    params: {
      name: 'wallet_validate_address',
      arguments: {
        address: '11111111111111111111111111111111'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
  
  let responseData = '';
  for await (const chunk of server.stdout) {
    responseData += chunk.toString();
    if (responseData.includes('\n')) {
      break;
    }
  }
  
  const response = JSON.parse(responseData);
  console.log('Response:', response);
  assert.ok(response.result);
  assert.strictEqual(response.result.isError, false);
  assert.strictEqual(response.result.content[0].type, 'text');
  assert.ok(response.result.content[0].text.includes('Address is valid'));
  
  server.kill();
});

test('wallet_validate_address with invalid address', async () => {
  const server = spawn('node', [serverPath]);
  
  const request = {
    jsonrpc: '2.0',
    id: '1',
    method: 'tools/call',
    params: {
      name: 'wallet_validate_address',
      arguments: {
        address: 'invalid-address'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
  
  let responseData = '';
  for await (const chunk of server.stdout) {
    responseData += chunk.toString();
    if (responseData.includes('\n')) {
      break;
    }
  }
  
  const response = JSON.parse(responseData);
  console.log('Response:', response);
  assert.ok(response.result);
  assert.strictEqual(response.result.isError, true);
  assert.strictEqual(response.result.content[0].type, 'text');
  assert.ok(response.result.content[0].text.includes('Invalid address'));
  
  server.kill();
});
