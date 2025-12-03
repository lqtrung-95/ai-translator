-- Supabase Schema for AI Translator
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Glossary Terms Table
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  english TEXT NOT NULL,
  chinese TEXT NOT NULL,
  category TEXT NOT NULL,
  explanation TEXT,
  examples TEXT[],
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation History Table
CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  source_text TEXT NOT NULL,
  translated_text TEXT,
  source_language TEXT DEFAULT 'en',
  target_language TEXT DEFAULT 'zh',
  mode TEXT DEFAULT 'professional',
  provider TEXT DEFAULT 'gemini',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Glossary: Everyone can read, authenticated users can create
CREATE POLICY "Anyone can read glossary" ON glossary_terms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create glossary terms" ON glossary_terms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own terms" ON glossary_terms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own terms" ON glossary_terms
  FOR DELETE USING (auth.uid() = user_id);

-- Translations: Users can only access their own
CREATE POLICY "Users can read their own translations" ON translations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own translations" ON translations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own translations" ON translations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own translations" ON translations
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_glossary_english ON glossary_terms(english);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_translations_user ON translations(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_created ON translations(created_at DESC);

-- Seed default glossary terms
INSERT INTO glossary_terms (english, chinese, category, explanation) VALUES
  ('EC2 (Elastic Compute Cloud)', '弹性计算云', 'AWS Compute', 'Amazon EC2 是一种 Web 服务，可在云中提供安全且可调整大小的计算容量。'),
  ('S3 (Simple Storage Service)', '简单存储服务', 'AWS Storage', 'Amazon S3 是一种对象存储服务。'),
  ('AWS Lambda', 'AWS Lambda', 'AWS Compute', 'AWS Lambda 是一项无服务器计算服务。'),
  ('VPC (Virtual Private Cloud)', '虚拟私有云', 'AWS Networking', 'Amazon VPC 允许您预置 AWS 云的一个逻辑隔离部分。'),
  ('IAM (Identity and Access Management)', '身份与访问管理', 'AWS Security', 'AWS IAM 可帮助您安全地控制对 AWS 资源的访问。'),
  ('Load Balancer', '负载均衡器', 'Networking', '负载均衡器在多个计算资源之间分配传入的应用程序流量。'),
  ('Auto Scaling', '自动伸缩', 'Compute', '自动伸缩可根据负载需求自动调整计算资源。'),
  ('Compute Engine', '计算引擎', 'GCP Compute', 'Google Cloud 上的虚拟机服务。'),
  ('BigQuery', 'BigQuery', 'GCP Analytics', 'Google Cloud 的企业数据仓库。'),
  ('Cloud Run', 'Cloud Run', 'GCP Compute', 'Google Cloud 上运行容器的完全托管式计算平台。')
ON CONFLICT DO NOTHING;

