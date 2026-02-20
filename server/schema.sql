-- ===== HotelCom Database Schema =====
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  dia_cobranca INTEGER NOT NULL CHECK (dia_cobranca >= 1 AND dia_cobranca <= 31),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('Transfer', 'Passeio', 'Restaurante', 'Outro')),
  fornecedor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  tipo_comissao TEXT NOT NULL CHECK (tipo_comissao IN ('fixa', 'percentual')),
  valor_comissao NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospede_nome TEXT NOT NULL,
  quarto TEXT,
  servico_id UUID REFERENCES services(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  data_servico DATE NOT NULL,
  valor_venda NUMERIC(10,2) NOT NULL,
  valor_comissao NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  data_pagamento TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operador' CHECK (role IN ('admin', 'operador')),
  nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_data_servico ON sales(data_servico);
CREATE INDEX IF NOT EXISTS idx_sales_fornecedor_id ON sales(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_services_fornecedor_id ON services(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
