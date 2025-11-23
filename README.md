# 🚀 Solana DEX Order Router

A high-performance backend service demonstrating **Solana DEX routing**, **background job queues**, and **real-time order status updates** using Fastify, BullMQ, Redis, and WebSockets.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [WebSocket Usage](#websocket-usage)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)

## 🎯 Overview

This project simulates a real trading backend workflow:
1. **Order Creation** → Client creates a market order via REST API
2. **Queue Processing** → Order is queued in BullMQ for asynchronous processing
3. **DEX Routing** → Worker compares prices from multiple DEXs (Raydium, Meteora)
4. **Best Price Selection** → System selects the DEX offering the best output
5. **Order Execution** → Simulated transaction building, submission, and confirmation
6. **Real-time Updates** → WebSocket broadcasts status updates to connected clients

## 🏗 Architecture

```
Client → REST API (Fastify) → BullMQ Queue → Worker → Redis Pub/Sub → WebSocket → Client
```

### Component Breakdown

- **Fastify Server**: Lightweight, high-performance HTTP server handling REST endpoints
- **BullMQ Queue**: Redis-based job queue for asynchronous order processing
- **Order Worker**: Background worker processing orders through lifecycle stages
- **Mock DEX Routers**: Simulated Raydium and Meteora price quote services
- **WebSocket Gateway**: Real-time status updates via Redis pub/sub
- **Redis**: Queue backend and pub/sub messaging

## 🧠 Design Decisions

### Why Market Orders?

**Market Orders** were chosen as the initial order type because they are the simplest to demonstrate:
- ✅ **DEX Routing**: Compare prices from multiple DEXs without price monitoring
- ✅ **Queue Processing**: Show asynchronous job processing with status updates
- ✅ **WebSocket Updates**: Stream order lifecycle without complex state management
- ✅ **No Price Monitoring**: Execute immediately at best available price
- ✅ **No Liquidity Detection**: No need to watch pool states or reserves

**Future Order Types:**
- **Limit Orders**: Require price monitoring and conditional execution
- **Sniper Orders**: Need pool-watching mechanisms and liquidity detection
- These can be added later by extending the worker with price-watching and pool-watching services

### Architecture Choices

1. **Fastify over Express**: Better performance, built-in TypeScript support, modern async/await
2. **BullMQ over Bull**: Better Redis connection handling, improved TypeScript types
3. **Redis Pub/Sub for WebSocket**: Decouples worker from server, enables horizontal scaling
4. **In-Memory Order Store**: Simple Map for demo; replace with database in production
5. **Mock DEX Routers**: Simulated price quotes; replace with real DEX SDKs in production

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Fastify 5.x |
| Queue | BullMQ 5.x |
| Cache/Queue Backend | Redis (ioredis) |
| Live Updates | WebSockets (@fastify/websocket) |
| Mock DEX | JavaScript simulation |
| Language | TypeScript 5.x |
| Runtime | Node.js |

## ✨ Features

### ✅ Market Order Execution
Create market orders that automatically fetch the best price from simulated DEXs.

### ✅ DEX Routing
Compare prices from:
- **Mock Raydium Router**: Simulates Raydium DEX quotes
- **Mock Meteora Router**: Simulates Meteora DEX quotes
- **Best Price Selection**: Automatically chooses the DEX with highest output

### ✅ BullMQ Queue System
Orders are processed asynchronously through a worker with:
- Automatic retries (3 attempts with exponential backoff)
- Job progress tracking
- Failed job handling

### ✅ Order Lifecycle
Every order progresses through these stages:
1. **pending** → Order created, queued for processing
2. **routing** → Fetching quotes from DEXs, comparing prices
3. **building** → Building transaction with selected DEX
4. **submitted** → Transaction submitted to blockchain (simulated)
5. **confirmed** → Transaction confirmed (simulated)

### ✅ WebSocket Live Updates
Real-time status updates streamed to connected clients via WebSocket.

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ 
- Redis (via Docker or local installation)
- npm or yarn

### 1. Clone the Repository

```bash
git clone git@github.com:arpitkashyap22/Order-Execution-Engine.git
cd Order-Execution-Engine
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Redis

**Using Docker (Recommended):**
```bash
docker run -d -p 6379:6379 --name redis redis
```

**Or using Homebrew (macOS):**
```bash
brew install redis
brew services start redis
```

**Or using local installation:**
```bash
# Follow Redis installation guide for your OS
redis-server
```

### 4. Start the Server

In one terminal:
```bash
npm run dev
```

Server starts at: `http://localhost:3000`

### 5. Start the Worker

In another terminal:
```bash
npm run worker
```

The worker processes orders from the queue.

### 6. Verify Setup

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/
```

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

#### 2. API Information
```bash
GET /
```

Returns available endpoints and API version.

#### 3. Create Market Order
```bash
POST /orders
Content-Type: application/json

{
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 1
}
```

Response:
```json
{
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 1
}
```

#### 4. Get All Orders
```bash
GET /orders
```

Response:
```json
{
  "orders": [...],
  "count": 5
}
```

#### 5. Get Order by ID
```bash
GET /orders/:orderId
```

Response:
```json
{
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 1,
  "status": "confirmed",
  "selectedDex": "meteora",
  "outputAmount": 99.75,
  "transactionHash": "0x...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:05.000Z"
}
```

## 🔌 WebSocket Usage

### Connection

```javascript
const ws = new WebSocket("ws://localhost:3000/ws");
```

### Message Format

**Connection Confirmation:**
```json
{
  "type": "connected",
  "message": "WebSocket connected. You will receive order updates."
}
```

**Order Updates:**
```json
{
  "type": "order-update",
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "routing",
  "progress": 20,
  "message": "Finding best DEX route...",
  "data": {
    "selectedDex": "meteora",
    "outputAmount": 99.75
  }
}
```

### Example Client Code

```javascript
const ws = new WebSocket("ws://localhost:3000/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'order-update') {
    console.log(`Order ${data.orderId}: ${data.status} (${data.progress}%)`);
    console.log(`Message: ${data.message}`);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Using wscat (CLI)

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3000/ws
```

## 📁 Project Structure

```
src/
├── app.ts                 # Fastify app initialization
├── server.ts              # Server bootstrap
├── routes/
│   └── order.routes.ts    # REST API routes
├── controllers/
│   └── order.controller.ts # Request handlers
├── services/
│   ├── order.service.ts   # Order business logic
│   └── dex/
│       ├── raydium.router.ts    # Mock Raydium DEX
│       └── meteora.router.ts   # Mock Meteora DEX
├── queue/
│   ├── order.queue.ts     # BullMQ queue setup
│   └── workers/
│       └── order.worker.ts # Order processing worker
├── websocket/
│   └── ws.gateway.ts      # WebSocket gateway
├── utils/
│   └── logger.ts          # Logger utility
├── types/
│   └── order.types.ts     # TypeScript types
└── config/
    └── redis.ts           # Redis connection
```

## 🔄 Order Execution Flow

1. **Client** sends POST request to `/orders`
2. **Controller** validates request and creates order
3. **Service** stores order in memory (status: `pending`)
4. **Queue** adds job to BullMQ
5. **Worker** picks up job and starts processing:
   - Updates status to `routing` (20% progress)
   - Fetches quotes from Raydium and Meteora
   - Selects best DEX
   - Updates status to `building` (40% progress)
   - Simulates transaction building
   - Updates status to `submitted` (60% progress)
   - Simulates blockchain submission
   - Updates status to `confirmed` (100% progress)
6. **Worker** publishes updates to Redis pub/sub
7. **WebSocket Gateway** receives updates and broadcasts to clients
8. **Client** receives real-time status updates

## 🚧 Future Enhancements

### Order Types
- **Limit Orders**: Execute when price reaches target
- **Sniper Orders**: Execute when liquidity pool conditions are met
- **Stop Loss Orders**: Execute when price drops below threshold

### Features
- **Price Monitoring Service**: Watch token prices across DEXs
- **Liquidity Pool Watcher**: Monitor pool reserves and conditions
- **Database Integration**: Replace in-memory store with PostgreSQL/MongoDB
- **Real DEX Integration**: Replace mock routers with actual DEX SDKs
- **Authentication**: Add user authentication and authorization
- **Rate Limiting**: Protect API endpoints
- **Order History**: Persistent order storage and querying
- **Multi-chain Support**: Extend to other blockchains
- **Order Batching**: Combine multiple orders for gas optimization

## 📝 Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Fastify server in development mode |
| `npm run worker` | Start BullMQ worker for order processing |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled JavaScript (production) |

## 🔧 Configuration

### Environment Variables

Create a `.env` file (optional):

```env
PORT=3000
HOST=0.0.0.0
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Redis Configuration

Redis connection is configured in `src/config/redis.ts`. Defaults:
- Host: `localhost`
- Port: `6379`
- `maxRetriesPerRequest: null` (required by BullMQ)


## 👤 Author

**Arpit Kashyap**

- GitHub: [@arpitkashyap22](https://github.com/arpitkashyap22)


