# 1. Health check
curl http://localhost:3000/health

# 2. Root endpoint (API info)
curl http://localhost:3000/

# 3. Create a market order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "SOL",
    "toToken": "USDC",
    "amount": 1
  }'

# 4. Create another order (different tokens)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "SOL",
    "amount": 100
  }'

# 5. Get all orders
curl http://localhost:3000/orders

# 6. Get specific order by ID (replace ORDER_ID with actual ID from step 3)
curl http://localhost:3000/orders/ORDER_ID

# 7. Get order with pretty JSON output
curl -s http://localhost:3000/orders/ORDER_ID | jq

# 8. Create order and save response to variable (bash/zsh)
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"fromToken":"SOL","toToken":"USDC","amount":2.5}')
echo $ORDER_RESPONSE

# 9. Extract orderId and query it (bash/zsh)
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.orderId')
curl http://localhost:3000/orders/$ORDER_ID