-- =========================================================================
-- Finance & Loan Management Ledger - Supabase PostgreSQL Schema Setup
-- =========================================================================
-- Paste this script into the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- and click "Run" to initialize all tables.

-- Disable RLS (Row-Level Security) by default for these tables,
-- or grant full access if the backend server connects using the Service Role Key.

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- 3. Loans
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  duration_weeks INTEGER,
  weekly_payment NUMERIC,
  monthly_interest NUMERIC,
  balance NUMERIC NOT NULL,
  status TEXT NOT NULL,
  total_profit NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  repayment_schedule JSONB
);

-- 4. Loan Payments
CREATE TABLE IF NOT EXISTS loan_payments (
  id TEXT PRIMARY KEY,
  loan_id TEXT REFERENCES loans(id) ON DELETE SET NULL,
  customer_name TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '' NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Savings
CREATE TABLE IF NOT EXISTS savings (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  contributor_name TEXT NOT NULL,
  notes TEXT DEFAULT '' NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Profit Records
CREATE TABLE IF NOT EXISTS profit_records (
  id TEXT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  loan_id TEXT REFERENCES loans(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Deleted Records (Trash Bin)
CREATE TABLE IF NOT EXISTS deleted_records (
  id TEXT PRIMARY KEY,
  original_table TEXT NOT NULL,
  record_data JSONB NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_by TEXT NOT NULL
);

-- =========================================================================
-- Initial Seed Data
-- =========================================================================

-- Seed default Administrator account if not already present
INSERT INTO users (id, email, password_hash, full_name, role, created_at)
VALUES (
  'u1',
  'work.santhosh.fsd@gmail.com',
  'admin123',
  'Santhosh Kumar',
  'owner',
  timezone('utc'::text, now() - INTERVAL '30 days')
)
ON CONFLICT (email) DO NOTHING;
