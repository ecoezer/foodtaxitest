/*
  # Add IP Address and Device Info to Orders Table

  1. Changes
    - Add `ip_address` column to store client IP address
    - Add `device_info` column to store device information (browser, OS, device type)
  
  2. New Columns
    - `ip_address` (text) - IP address of the customer placing the order
    - `device_info` (jsonb) - JSON object containing browser, OS, device type details
  
  3. Notes
    - These fields help with fraud detection and analytics
    - IP address stored as text for IPv4/IPv6 compatibility
    - Device info stored as JSONB for flexible querying
*/

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  items jsonb NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add ip_address column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN ip_address text;
  END IF;
END $$;

-- Add device_info column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'device_info'
  ) THEN
    ALTER TABLE orders ADD COLUMN device_info jsonb;
  END IF;
END $$;

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for placing orders)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Allow anonymous order creation'
  ) THEN
    CREATE POLICY "Allow anonymous order creation"
      ON orders
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- Create policy to allow service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Service role has full access'
  ) THEN
    CREATE POLICY "Service role has full access"
      ON orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create index on created_at for faster ordering
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
