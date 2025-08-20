# WebSocket Connection Setup Guide

[한국어](WEBSOCKET_SETUP.md) | [English](WEBSOCKET_SETUP.en.md)

## Overview

The Code Racer backend uses WebSocket for real-time game communication. This document explains how to set up WebSocket connections and solve potential issues in production environments.

## WebSocket Endpoint

```
ws://your-backend-domain/ws/{gameId}
```

- **Protocol**: `ws://` (HTTP) or `wss://` (HTTPS)
- **Path**: `/ws/{gameId}` (Game ID in UUID format)
- **Authentication**: JWT token required

## Authentication Methods

You can authenticate WebSocket connections using one of these two methods:

### 1. Authorization Header (Recommended)

```javascript
// JavaScript example
const token = 'your_jwt_token_here';
const ws = new WebSocket(`wss://your-backend-domain/ws/${gameId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 2. Query Parameter (Fallback)

```javascript
// JavaScript example
const token = 'your_jwt_token_here';
const ws = new WebSocket(
  `wss://your-backend-domain/ws/${gameId}?token=${token}`
);
```

**Note**: Cookie-based authentication is no longer supported. We recommend using Authorization headers for security and cross-domain compatibility.

## Client Implementation Examples

### JavaScript (Browser)

```javascript
class GameWebSocket {
  constructor(gameId, token) {
    this.gameId = gameId;
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    try {
      // Connect using Authorization header (recommended)
      this.ws = new WebSocket(`wss://your-backend-domain/ws/${this.gameId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Message parsing failed:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      if (!event.wasClean) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'player_joined':
        console.log('Player joined:', data.data);
        break;
      case 'game_started':
        console.log('Game started:', data.data);
        break;
      case 'code_submitted':
        console.log('Code submitted:', data.data);
        break;
      case 'game_finished':
        console.log('Game finished:', data.data);
        break;
      default:
        console.log('Unknown message type:', data);
    }
  }

  sendMessage(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, data };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(
        `Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Maximum reconnection attempts exceeded');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User requested');
    }
  }
}

// Usage example
const gameWs = new GameWebSocket('game-uuid-here', 'jwt-token-here');
gameWs.connect();

// Send message
gameWs.sendMessage('ready', { status: 'ready' });
```

### Python

```python
import websocket
import json
import time
import threading

class GameWebSocket:
    def __init__(self, game_id, token, backend_url):
        self.game_id = game_id
        self.token = token
        self.backend_url = backend_url
        self.ws = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5

    def connect(self):
        try:
            # Connect using Authorization header
            headers = {
                'Authorization': f'Bearer {self.token}'
            }

            url = f"{self.backend_url}/ws/{self.game_id}"
            self.ws = websocket.WebSocketApp(
                url,
                header=headers,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close
            )

            # Run WebSocket in separate thread
            wst = threading.Thread(target=self.ws.run_forever)
            wst.daemon = True
            wst.start()

        except Exception as e:
            print(f'WebSocket connection failed: {e}')
            self.handle_reconnect()

    def on_open(self, ws):
        print('WebSocket connection established')
        self.reconnect_attempts = 0

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            self.handle_message(data)
        except json.JSONDecodeError as e:
            print(f'Message parsing failed: {e}')

    def on_error(self, ws, error):
        print(f'WebSocket error: {error}')

    def on_close(self, ws, close_status_code, close_msg):
        print(f'WebSocket connection closed: {close_status_code} - {close_msg}')
        if close_status_code != 1000:  # Not a normal closure
            self.handle_reconnect()

    def handle_message(self, data):
        message_type = data.get('type')
        message_data = data.get('data', {})

        if message_type == 'player_joined':
            print(f'Player joined: {message_data}')
        elif message_type == 'game_started':
            print(f'Game started: {message_data}')
        elif message_type == 'code_submitted':
            print(f'Code submitted: {message_data}')
        elif message_type == 'game_finished':
            print(f'Game finished: {message_data}')
        else:
            print(f'Unknown message type: {data}')

    def send_message(self, message_type, data):
        if self.ws and self.ws.sock and self.ws.sock.connected:
            message = {'type': message_type, 'data': data}
            self.ws.send(json.dumps(message))
        else:
            print('WebSocket not connected')

    def handle_reconnect(self):
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            delay = min(1000 * (2 ** self.reconnect_attempts), 30000)

            print(f'Reconnecting in {delay}ms ({self.reconnect_attempts}/{self.max_reconnect_attempts})')

            time.sleep(delay / 1000)
            self.connect()
        else:
            print('Maximum reconnection attempts exceeded')

    def disconnect(self):
        if self.ws:
            self.ws.close(1000, 'User requested')

# Usage example
if __name__ == "__main__":
    game_ws = GameWebSocket(
        game_id='game-uuid-here',
        token='jwt-token-here',
        backend_url='wss://your-backend-domain'
    )

    game_ws.connect()

    # Send message
    game_ws.send_message('ready', {'status': 'ready'})

    # Keep connection alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        game_ws.disconnect()
```

## Production Environment Setup

### Environment Variables

Set the following environment variables in production:

```bash
# Frontend domain
FRONTEND_URL=https://yourdomain.com

# CORS allowed origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment setting
ENVIRONMENT=production
```

### Nginx Configuration (When Using Proxy)

```nginx
# WebSocket proxy configuration
location /ws/ {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket connection keep-alive
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

## Troubleshooting

### 1. Connection Failure

**Symptoms**: WebSocket connection fails

**Solutions**:

1. Check if backend server is running
2. Verify firewall settings
3. Check CORS configuration
4. Validate authentication token

### 2. Authentication Failure

**Symptoms**: "Authentication required" error

**Solutions**:

1. Verify JWT token validity
2. Check if token is sent in correct format
3. Use Authorization header (recommended)

### 3. CORS Errors

**Symptoms**: CORS errors in browser

**Solutions**:

1. Add frontend domain to `CORS_ALLOWED_ORIGINS` environment variable
2. Set `FRONTEND_URL` environment variable
3. Restart backend server

### 4. Connection Drops

**Symptoms**: WebSocket connection frequently drops

**Solutions**:

1. Check network connection status
2. Verify proxy timeout settings
3. Implement automatic reconnection logic

## Debugging

### Log Checking

Check backend logs for WebSocket-related messages:

```bash
# Check backend logs
docker logs your-backend-container

# Or for local execution
tail -f logs/app.log
```

### Browser Developer Tools

1. **Network Tab**: Check WebSocket connection status
2. **Console Tab**: Check error messages and logs
3. **Application Tab**: Check cookies and local storage

### WebSocket Testing Tools

- **wscat**: Command-line WebSocket client
- **Postman**: WebSocket support
- **Browser Extensions**: WebSocket testers

## Performance Optimization

### 1. Connection Pooling

```javascript
// Connection pool management
class WebSocketPool {
  constructor(maxConnections = 5) {
    this.connections = new Map();
    this.maxConnections = maxConnections;
  }

  getConnection(gameId, token) {
    if (this.connections.has(gameId)) {
      const conn = this.connections.get(gameId);
      if (conn.readyState === WebSocket.OPEN) {
        return conn;
      }
    }

    if (this.connections.size >= this.maxConnections) {
      // Remove oldest connection
      const oldestKey = this.connections.keys().next().value;
      this.connections.delete(oldestKey);
    }

    const conn = new GameWebSocket(gameId, token);
    this.connections.set(gameId, conn);
    return conn;
  }
}
```

### 2. Message Batching

```javascript
// Message batch sending
class MessageBatcher {
  constructor(ws, batchSize = 10, batchDelay = 100) {
    this.ws = ws;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.messages = [];
    this.timer = null;
  }

  addMessage(type, data) {
    this.messages.push({ type, data });

    if (this.messages.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.messages.length > 0) {
      this.ws.send(
        JSON.stringify({
          type: 'batch',
          data: this.messages,
        })
      );
      this.messages = [];
    }
  }
}
```

## Security Considerations

1. **Use HTTPS/WSS**: Always use encrypted connections in production
2. **Token Expiration**: Set appropriate JWT token expiration times
3. **Origin Verification**: Allow connections only from permitted domains
4. **Rate Limiting**: Implement rate limiting for WebSocket connections and message sending

## Monitoring

### Connection Status Monitoring

```javascript
// Connection status monitoring
setInterval(() => {
  if (gameWs.ws && gameWs.ws.readyState === WebSocket.OPEN) {
    // Check connection status
    gameWs.sendMessage('ping', { timestamp: Date.now() });
  }
}, 30000); // Every 30 seconds
```

### Metrics Collection

```javascript
// Collect connection metrics
class WebSocketMetrics {
  constructor() {
    this.connectionCount = 0;
    this.messageCount = 0;
    this.errorCount = 0;
  }

  recordConnection() {
    this.connectionCount++;
  }

  recordMessage() {
    this.messageCount++;
  }

  recordError() {
    this.errorCount++;
  }

  getMetrics() {
    return {
      connectionCount: this.connectionCount,
      messageCount: this.messageCount,
      errorCount: this.errorCount,
    };
  }
}
```

Use this document to resolve WebSocket connection issues and implement stable real-time game communication.