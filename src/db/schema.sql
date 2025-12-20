-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(255) PRIMARY KEY,
  from_token VARCHAR(50) NOT NULL,
  to_token VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  selected_dex VARCHAR(50),
  output_amount DECIMAL(20, 8),
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

