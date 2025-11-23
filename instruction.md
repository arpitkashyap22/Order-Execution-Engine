# 🚀 Solana DEX Order Router — Fastify + BullMQ + WebSockets

A high-performance backend service that demonstrates **Solana DEX routing**,  
**background job queues**, and **real-time order status updates** using:

- **Fastify (Node.js framework)**
- **BullMQ (Job Queue)**
- **Redis**
- **WebSockets**
- **Mock DEX Routers (Raydium + Meteora)**

This project simulates how a real trading backend works:  
creating orders → queueing → routing → executing → notifying clients.

---

## 🧩 Why This Project?
This project demonstrates backend engineering skills involving:

- Queue-based order execution  
- Event-driven system design  
- Retry-safe execution  
- Routing logic across DEXs  
- Fastify performance tuning  
- WebSocket streaming  
- Clean architecture  

Perfect for demonstrating system design + production-grade backend experience.

---

# 🎯 Features

### ✅ Market Order Execution  
Create a market order that fetches the **best price** from simulated DEXs.

### ✅ DEX Routing  
Compare "prices" returned by:

- mockRaydiumRouter  
- mockMeteoraRouter  

Choose best venue → execute order.

### ✅ BullMQ Queue  
Orders run asynchronously through a worker:

```

pending → routing → building → submitted → confirmed

```

### ✅ WebSocket Live Status  
Client gets real-time status updates for each stage.

### ✅ Fastify API  
Lightweight, fast, modern Node.js framework.

---

# 🏗 Architecture

```

Client → REST API (Fastify) → BullMQ Queue → Worker → WebSocket → Client

```

Breakdown:

- **Fastify Controller:** creates orders  
- **BullMQ Queue:** stores and schedules jobs  
- **BullMQ Worker:** executes routing logic  
- **Mock Routers:** simulate Raydium & Meteora  
- **WebSocket Gateway:** emits job updates  
- **Redis:** queue + pub/sub backend  

---

# 🔥 Order Execution Lifecycle

Every market order goes through these stages:

1. **pending**  
   User creates order; stored in queue.

2. **routing**  
   Worker compares Raydium vs Meteora quotes.

3. **building**  
   Worker "builds" a mock transaction.

4. **submitted**  
   Simulated transaction sent to blockchain.

5. **confirmed**  
   Mock confirmation returned.

Each stage is streamed to client via WebSocket.

---

# 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Fastify |
| Queue | BullMQ |
| Cache/Queue Backend | Redis |
| Live Updates | WebSockets (ws) |
| Mock DEX | JS simulation |
| Language | Node.js / TypeScript |

---

# 📁 Folder Structure

```

src/
├── app.ts                 # Fastify initialization
├── server.ts              # Server bootstrap
├── routes/
│    └── order.routes.ts   # REST endpoints
├── controllers/
│    └── order.controller.ts
├── services/
│    ├── order.service.ts
│    ├── dex/
│    │     ├── raydium.router.ts
│    │     └── meteora.router.ts
├── queue/
│    ├── order.queue.ts
│    └── workers/
│          └── order.worker.ts
├── websocket/
│    └── ws.gateway.ts
├── utils/
│    └── logger.ts
├── types/
│    └── order.types.ts
└── config/
└── redis.ts

````

---

# ⚙ Installation & Setup

### **1. Clone the repo**

```bash
git clone https://github.com/yourusername/solana-dex-router.git
cd solana-dex-router
````

### **2. Install dependencies**

```bash
npm install
```

### **3. Start Redis**

Using Docker:

```bash
docker run -p 6379:6379 redis
```

### **4. Run the server**

```bash
npm run dev
```

Server starts at:

```
http://localhost:3000
```

WebSocket server:

```
ws://localhost:3000/ws
```

---

# 🧪 API Usage

### 👉 **1. Create Market Order**

```bash
POST /orders
```

Body:

```json
{
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 1
}
```

Response:

```json
{
  "orderId": "12345",
  "status": "pending"
}
```

---

# 📡 WebSocket Usage

Connect:

```js
const ws = new WebSocket("ws://localhost:3000/ws");

ws.onmessage = (msg) => {
  console.log("Order Update:", msg.data);
};
```

You will receive:

```
pending
routing
building
submitted
confirmed
```

---

# 🎯 Routing Logic

The worker fetches both prices:

```ts
const raydium = await mockRaydiumRouter(amount);
const meteora = await mockMeteoraRouter(amount);
```

Choose best:

```ts
const best = meteora.output > raydium.output ? meteora : raydium;
```

Continue flow → send WebSocket updates → complete order.

---

# 🚀 Running the Worker

```bash
npm run worker
```

---

# 🧰 Scripts

| Command          | Action             |
| ---------------- | ------------------ |
| `npm run dev`    | Start Fastify      |
| `npm run worker` | Start queue worker |
| `npm run build`  | Compile TypeScript |
| `npm start`      | Run compiled JS    |

---

# 🧠 Prompt to Generate Full Project (For AI Use)

Use the following prompt to generate this entire codebase:

```
Generate a complete Node.js + TypeScript backend project with this structure:

- Fastify server
- BullMQ queue system
- Redis connection
- WebSocket gateway
- Market order creation endpoint
- Order queue processor worker
- Mock DEX routing using Raydium + Meteora routers
- Order lifecycle statuses:
  pending → routing → building → submitted → confirmed
- WebSocket should broadcast each status update
- Folder structure exactly as described in the README
- Use clean code architecture (controllers, services, queue, workers, utils)
- Include TypeScript types
- Use mock functions for DEX price quotes
- Use job.progress() for status events
- Emit WebSocket events based on queue job progress
- Include logger utility
- Ensure the code builds and runs without missing imports
- Follow the README setup and naming conventions
```

