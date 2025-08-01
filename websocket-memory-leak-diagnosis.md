# WebSocket Memory Leak Diagnosis Report

## Problem Summary
The system is experiencing `MaxListenersExceededWarning` for TLSSocket listeners (close, error, data). This is caused by the HTTP connection tracker repeatedly adding event listeners to the same reused sockets without removing old ones.

## Root Cause Analysis

### 1. **Primary Issue Location**
- **File**: `src/core/rpc-connection-manager/index.js`
- **Method**: `trackConnection()` (line 590)
- **Problem**: When HTTP keep-alive is enabled, sockets are reused for multiple requests. Each request calls `trackConnection()` which adds new event listeners without checking if listeners already exist.

### 2. **How the Leak Occurs**
```javascript
// In HTTPClient.request() - line 827-831
if (res.socket && this.connectionTracker) {
  this.connectionTracker.trackConnection(res.socket, {
    url: url,
    method: options.method || 'GET'
  });
}

// In ConnectionTracker.trackConnection() - line 613-623
socket.on('close', () => {
  this.handleConnectionClose(connectionId);
});

socket.on('error', (error) => {
  this.handleConnectionError(connectionId, error);
});

socket.on('data', () => {
  this.updateLastActivity(connectionId);
});
```

### 3. **Why It Accumulates**
- HTTP Agent has `keepAlive: true` with `maxSockets: 50`
- Same socket is reused for multiple RPC requests
- Each request adds 3 new listeners (close, error, data)
- After 7 requests on same socket: 21 listeners = warning threshold

## Files Already Fixed
✅ `src/services/native-websocket-client.js` - Has proper cleanup
✅ `src/services/helius-websocket-client.js` - Has proper cleanup
✅ `src/services/websocket-manager.service.js` - Has setMaxListeners
❌ `src/services/production-helius-websocket-client.js` - Missing cleanup in disconnect
❌ `src/core/rpc-connection-manager/index.js` - ConnectionTracker adding duplicate listeners

## Recommended Fix

### Option 1: Check for Existing Listeners
```javascript
trackConnection(socket, metadata = {}) {
  if (!this.options.trackingEnabled || !socket) return;
  
  // Check if we're already tracking this socket
  const socketId = `${socket.remoteAddress}:${socket.remotePort}`;
  for (const [connId, conn] of this.connections) {
    if (conn.socket === socket && conn.state === 'active') {
      // Update existing connection info
      conn.lastActivity = Date.now();
      return;
    }
  }
  
  // Rest of the method...
}
```

### Option 2: Remove Listeners Before Adding
```javascript
// Before adding new listeners
socket.removeAllListeners('close');
socket.removeAllListeners('error');
socket.removeAllListeners('data');

// Then add new ones
socket.on('close', () => { ... });
```

### Option 3: Use Once Instead of On
```javascript
// For one-time events
socket.once('close', () => { ... });
```

## Testing Command
```bash
TRADING_MODE=live node --expose-gc src/index.js 2>&1 | grep -E "(MaxListeners|close listeners|error listeners|data listeners)" | head -20
```