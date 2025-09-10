import { RpcConnectionPool } from '../detection/transport/rpc-connection-pool.js';

console.log('Testing RPC Connection Pool initialization...');

try {
  const pool = new RpcConnectionPool();
  console.log('Pool created successfully');
  console.log('Endpoints:', pool.endpoints);
  console.log('Stats:', pool.stats);
  console.log('Constructor test passed');
} catch (error) {
  console.error('Error creating pool:', error);
  console.error('Stack:', error.stack);
}