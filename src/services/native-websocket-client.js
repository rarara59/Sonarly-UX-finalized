/**
 * NATIVE WEBSOCKET CLIENT - ZERO EXTERNAL DEPENDENCIES
 * 
 * Built using only Node.js built-ins for maximum reliability
 * Implements WebSocket protocol RFC 6455 manually
 */

import { createHash, randomBytes } from 'crypto';
import { connect } from 'net';
import { connect as tlsConnect, checkServerIdentity } from 'tls';
import { EventEmitter } from 'events';

export class NativeWebSocketClient extends EventEmitter {
  constructor(url, options = {}) {
    super();
    
    this.url = url;
    this.options = {
      timeout: options.timeout || 30000,
      reconnectInterval: options.reconnectInterval || 5000,
      maxReconnects: options.maxReconnects || 10,
      ...options
    };
    
    this.socket = null;
    this.isConnected = false;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.partialMessage = null;    // accumulates UTF-8 text frames
    this.partialOpcode = null;     // remembers first opcode (0x1 or 0x2)
    
    // Parse URL
    this.parseUrl(url);
    
    // Orchestrator interface state
    this.isInitialized = false;
    
    // Statistics
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      connectionAttempts: 0,
      lastConnected: null,
      latency: 0
    };
  }

  parseUrl(url) {
    const match = url.match(/^(wss?):\/\/([^:\/]+):?(\d+)?(\/.*)?$/);
    if (!match) {
      throw new Error(`Invalid WebSocket URL: ${url}`);
    }
    
    this.protocol = match[1];
    this.hostname = match[2];
    this.port = parseInt(match[3]) || (this.protocol === 'wss' ? 443 : 80);
    this.path = match[4] || '/';
    this.isSecure = this.protocol === 'wss';
  }

  /**
   * Initialize for orchestrator compatibility
   */
  async initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    console.log(`NativeWebSocketClient initialized for ${this.hostname}:${this.port}`);
    
    // Don't auto-connect in initialize - let the parent service control connection
    return Promise.resolve();
  }

  /**
   * Health check for orchestrator monitoring
   */
  async healthCheck() {
    try {
      const isHealthy = this.isConnected && 
                       this.socket && 
                       !this.socket.destroyed &&
                       this.reconnectCount < this.options.maxReconnects;
      
      return isHealthy;
      
    } catch (error) {
      console.error('NativeWebSocketClient health check failed:', error);
      return false;
    }
  }

  /**
   * Shutdown for orchestrator compatibility
   */
  async shutdown() {
    console.log(`Shutting down NativeWebSocketClient for ${this.hostname}:${this.port}`);
    
    // Cancel any pending reconnection
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close connection gracefully
    this.close();
    
    // Reset state
    this.isInitialized = false;
    this.isConnected = false;
    this.reconnectCount = 0;
    this.partialMessage = null;
    this.partialOpcode = null;
    
    // Remove all listeners
    this.removeAllListeners();
    
    console.log(`NativeWebSocketClient shutdown complete for ${this.hostname}:${this.port}`);
    
    return Promise.resolve();
  }

  connect() {
    this.stats.connectionAttempts++;
    
    // Generate WebSocket key
    const key = randomBytes(16).toString('base64');
    const acceptKey = this.generateAcceptKey(key);
    
    // Create socket connection (with TLS support)
    if (this.isSecure) {
      this.socket = tlsConnect({
        host: this.hostname,
        port: this.port,
        timeout: this.options.timeout,
        rejectUnauthorized: true,
        secureProtocol: 'TLSv1_2_method',
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384',
        servername: this.hostname,
        checkServerIdentity: (servername, cert) => {
          // Verify certificate matches hostname
          return checkServerIdentity(servername, cert);
        }
      });

      this.socket.on('secureConnect', () => {
        console.log(`✅ Secure TLS connection established to ${this.hostname}`);
        console.log(`   Protocol: ${this.socket.getProtocol()}`);
        console.log(`   Cipher: ${this.socket.getCipher().name}`);
      });

      this.socket.on('error', (error) => {
        if (error.code === 'EPROTO') {
          console.error(`🔒 TLS/SSL Error for ${this.hostname}:`, {
            code: error.code,
            message: error.message,
            protocol: this.socket?.getProtocol?.(),
            authorized: this.socket?.authorized
          });
        } else {
          console.error('Socket error:', error);
        }
        this.emit('error', error);
        this.scheduleReconnect();
      });

    } else {
      this.socket = connect({
        host: this.hostname,
        port: this.port,
        timeout: this.options.timeout
      });
    }

    // Setup socket event handlers
    this.setupSocketHandlers(key, acceptKey);
    
    // Send WebSocket handshake
    this.sendHandshake(key);
  }

  setupSocketHandlers(key, acceptKey) {
    this.socket.on('connect', () => {
      console.log(`Connected to ${this.hostname}:${this.port}`);
    });

    this.socket.on('data', (data) => {
      this.handleSocketData(data, acceptKey);
    });

    this.socket.on('close', () => {
      this.isConnected = false;
      this.emit('close');
      this.scheduleReconnect();
    });

    //Replacing the below with code (146-166) bc w're adding TLS-specific error handling
    /*this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    });

    this.socket.on('timeout', () => {
      console.error('Socket timeout');
      this.socket.destroy();
      this.scheduleReconnect();
    });
  }*/

    this.socket.on('error', (error) => {
      if (error.code === 'EPROTO') {
        console.error(`🔒 TLS/SSL Error for ${this.hostname}:`, {
          code: error.code,
          message: error.message,
          protocol: this.socket?.getProtocol?.(),
          authorized: this.socket?.authorized
        });
      } else {
        console.error('Socket error:', error);
      }
      this.emit('error', error);
      this.scheduleReconnect();
    });

    this.socket.on('timeout', () => {
      console.error('Socket timeout');
      this.socket.destroy();
      this.scheduleReconnect();
    });
  }

  sendHandshake(key) {
  const headers = [
    `GET ${this.path} HTTP/1.1`,
    `Host: ${this.hostname}:${this.port}`,
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Key: ${key}`,
    'Sec-WebSocket-Version: 13',
    'User-Agent: Native-WebSocket-Client/1.0'
  ];

  // Add authorization header if API key is in the URL path
  //if (this.path.includes('api-key=')) {
    //const apiKey = this.path.match(/api-key=([^&]+)/)[1];
    //headers.push(`Authorization: Bearer ${apiKey}`);
    // Remove API key from path for clean handshake
    //this.path = this.path.replace(/[?&]api-key=[^&]+/, '');
  //}

  // We keep the query string intact so every reconnect still carries the key.
  // Helius does **not** accept `Authorization` headers on WS, only the query param,
  // so we do nothing here.

  headers.push('', '');
  const handshake = headers.join('\r\n');
  this.socket.write(handshake);
}

  handleSocketData(data, expectedAcceptKey) {
    this.stats.bytesReceived += data.length;

    if (!this.isConnected) {
      // Handle handshake response
      const response = data.toString();
      
      if (response.includes('HTTP/1.1 101')) {
        const acceptMatch = response.match(/Sec-WebSocket-Accept:\s*(.+)/i);
        
        if (acceptMatch && acceptMatch[1].trim() === expectedAcceptKey) {
          this.isConnected = true;
          this.reconnectCount = 0;
          this.stats.lastConnected = Date.now();
          this.emit('open');
          console.log('WebSocket handshake successful');
        } else {
          this.emit('error', new Error('Invalid WebSocket handshake'));
        }
      } else {
        this.emit('error', new Error(`WebSocket handshake failed: ${response}`));
      }
    } else {
      // Handle WebSocket frames
      this.parseWebSocketFrames(data);
    }
  }

  parseWebSocketFrames(buffer) {
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 2 > buffer.length) break;  // incomplete header → wait for more data

      const firstByte = buffer[offset];
      const secondByte = buffer[offset + 1];

      const fin = (firstByte & 0x80) === 0x80;
      const opcode = firstByte & 0x0f;
      const masked = (secondByte & 0x80) === 0x80;
      let payloadLength = secondByte & 0x7f;

      offset += 2;

      // Extended payload length
      if (payloadLength === 126) {
        if (offset + 2 > buffer.length) break;
        payloadLength = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === 127) {
        if (offset + 8 > buffer.length) break;
        payloadLength = buffer.readBigUInt64BE(offset);
        offset += 8;
      }

      // Masking key (client to server only)
      let maskingKey = null;
      if (masked) {
        if (offset + 4 > buffer.length) break;
        maskingKey = buffer.slice(offset, offset + 4);
        offset += 4;
      }

      // Payload
      if (offset + Number(payloadLength) > buffer.length) break;
      
      let payload = buffer.slice(offset, offset + Number(payloadLength));
      offset += Number(payloadLength);

      // Unmask payload if needed
      if (masked && maskingKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskingKey[i % 4];
        }
      }

      // Handle different opcodes
      if (opcode === 0x1 || opcode === 0x2 || opcode === 0x0) {
      // 0x1 = text, 0x2 = binary, 0x0 = continuation
        if (opcode !== 0x0) {
          // new message starts
          this.partialOpcode = opcode;
          this.partialMessage = payload;
        } else if (this.partialMessage) {
          // continuation frame
          this.partialMessage = Buffer.concat([this.partialMessage, payload]);
        }
        
        if (fin) {
          const complete = this.partialMessage;
          const firstOp = this.partialOpcode;
          this.partialMessage = null;
          this.partialOpcode = null;
          
          if (firstOp === 0x1) {
            // text
            const text = complete.toString('utf8');
            this.stats.messagesReceived++;
            this.emit('message', text);
          } else {
            // binary
            this.stats.messagesReceived++;
            this.emit('message', complete);
          }
        }
        continue;  // next frame
      }
      else if (opcode === 0x8) { // Close frame
        this.close();
      } else if (opcode === 0x9) { // Ping frame
        this.writePong(this.socket, payload);
        return;
      } else if (opcode === 0xa) { // Pong frame
        this.handlePong(payload);
      }
    }
  }

  send(data) {
    if (!this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    const isBuffer = Buffer.isBuffer(data);
    const payload = isBuffer ? data : Buffer.from(data, 'utf8');
    const opcode = isBuffer ? 0x2 : 0x1; // Binary or text

    const frame = this.createWebSocketFrame(opcode, payload);
    this.socket.write(frame);
    
    this.stats.messagesSent++;
    this.stats.bytesSent += frame.length;
  }

  createWebSocketFrame(opcode, payload) {
    const payloadLength = payload.length;
    let frame;

    if (payloadLength < 126) {
      frame = Buffer.allocUnsafe(2 + 4 + payloadLength);
      frame[0] = 0x80 | opcode; // FIN = 1
      frame[1] = 0x80 | payloadLength; // MASK = 1
    } else if (payloadLength < 65536) {
      frame = Buffer.allocUnsafe(4 + 4 + payloadLength);
      frame[0] = 0x80 | opcode;
      frame[1] = 0x80 | 126;
      frame.writeUInt16BE(payloadLength, 2);
    } else {
      frame = Buffer.allocUnsafe(10 + 4 + payloadLength);
      frame[0] = 0x80 | opcode;
      frame[1] = 0x80 | 127;
      frame.writeBigUInt64BE(BigInt(payloadLength), 2);
    }

    // Generate masking key
    const maskingKey = randomBytes(4);
    const maskOffset = frame.length - payloadLength - 4;
    maskingKey.copy(frame, maskOffset);

    // Copy and mask payload
    const payloadOffset = maskOffset + 4;
    for (let i = 0; i < payloadLength; i++) {
      frame[payloadOffset + i] = payload[i] ^ maskingKey[i % 4];
    }

    return frame;
  }

  ping(data = Buffer.alloc(0)) {
    if (!this.isConnected) return;
    
    const frame = this.createWebSocketFrame(0x9, data);
    this.socket.write(frame);
  }

  pong(data = Buffer.alloc(0)) {
    if (!this.isConnected) return;
    
    const frame = this.createWebSocketFrame(0xa, data);
    this.socket.write(frame);
  }

  handlePong(data) {
    // Calculate latency if this was a response to our ping
    this.emit('pong', data);
  }

  close() {
    if (this.isConnected) {
      const closeFrame = this.createWebSocketFrame(0x8, Buffer.alloc(0));
      this.socket.write(closeFrame);
    }
    
    this.isConnected = false;
    
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectCount >= this.options.maxReconnects) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    if (this.reconnectTimer) return;

    this.reconnectCount++;
    const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectCount - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  generateAcceptKey(key) {
    const websocketMagicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    return createHash('sha1')
      .update(key + websocketMagicString)
      .digest('base64');
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      ...this.stats,
      isConnected: this.isConnected,
      reconnectCount: this.reconnectCount,
      uptime: this.stats.lastConnected ? Date.now() - this.stats.lastConnected : 0
    };
  }

  writePong(socket, payload) {
    const len = payload.length;
    const header = [];
    
    header.push(0b1000_1010);  // FIN=1, opcode=0xA (PONG)
    if (len < 126) {
      header.push(0b1000_0000 | len);  // MASK bit + length
    } else if (len < 65536) {
      header.push(0b1000_0000 | 126);
      header.push((len >> 8) & 0xff, len & 0xff);
    } else {
      header.push(0b1000_0000 | 127, ...new Array(6).fill(0));
      header.push((len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff);
    }
    
    const mask = randomBytes(4);
    const framed = Buffer.concat([
      Buffer.from(header),
      mask,
      Buffer.from(payload.map((b, i) => b ^ mask[i & 3]))
    ]);
    
    socket.write(framed);
  }
}

// Mathematical utilities (built-in implementations)
export class NativeMath {
  static mean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static standardDeviation(values) {
    const avg = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  static zScore(value, mean, stdDev) {
    return (value - mean) / (stdDev || 1);
  }

  static normalCDF(x) {
    // Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return x > 0 ? 1 - prob : prob;
  }

  static linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }
}

export default NativeWebSocketClient;