import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Fallback terms for search
const fallbackTerms = [
  { id: 'aws-1', english: 'EC2 (Elastic Compute Cloud)', chinese: '弹性计算云', category: 'AWS Compute', explanation: 'Amazon EC2 是一种 Web 服务，可在云中提供安全且可调整大小的计算容量。' },
  { id: 'aws-2', english: 'S3 (Simple Storage Service)', chinese: '简单存储服务', category: 'AWS Storage', explanation: 'Amazon S3 是一种对象存储服务。' },
  { id: 'aws-3', english: 'AWS Lambda', chinese: 'AWS Lambda', category: 'AWS Compute', explanation: 'AWS Lambda 是一项无服务器计算服务。' },
  { id: 'aws-4', english: 'VPC (Virtual Private Cloud)', chinese: '虚拟私有云', category: 'AWS Networking', explanation: 'Amazon VPC 允许您预置 AWS 云的一个逻辑隔离部分。' },
  { id: 'aws-5', english: 'Load Balancer', chinese: '负载均衡器', category: 'Networking', explanation: '负载均衡器在多个计算资源之间分配传入的应用程序流量。' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const query = q.toLowerCase();

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .or(`english.ilike.%${query}%,chinese.ilike.%${query}%,explanation.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Glossary search error:', error);
    // Fallback to local search
    const results = fallbackTerms.filter(
      t =>
        t.english.toLowerCase().includes(query) ||
        t.chinese.includes(query) ||
        t.explanation.toLowerCase().includes(query)
    );
    return NextResponse.json(results);
  }
}

