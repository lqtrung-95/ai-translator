import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, GlossaryTerm } from '@/lib/supabase';

// Default terms to seed if table is empty
const defaultTerms = [
  { english: 'EC2 (Elastic Compute Cloud)', chinese: '弹性计算云', category: 'AWS Compute', explanation: 'Amazon EC2 是一种 Web 服务，可在云中提供安全且可调整大小的计算容量。' },
  { english: 'S3 (Simple Storage Service)', chinese: '简单存储服务', category: 'AWS Storage', explanation: 'Amazon S3 是一种对象存储服务。' },
  { english: 'AWS Lambda', chinese: 'AWS Lambda', category: 'AWS Compute', explanation: 'AWS Lambda 是一项无服务器计算服务。' },
  { english: 'VPC (Virtual Private Cloud)', chinese: '虚拟私有云', category: 'AWS Networking', explanation: 'Amazon VPC 允许您预置 AWS 云的一个逻辑隔离部分。' },
  { english: 'Load Balancer', chinese: '负载均衡器', category: 'Networking', explanation: '负载均衡器在多个计算资源之间分配传入的应用程序流量。' },
  { english: 'Auto Scaling', chinese: '自动伸缩', category: 'Compute', explanation: '自动伸缩可根据负载需求自动调整计算资源。' },
  { english: 'Compute Engine', chinese: '计算引擎', category: 'GCP Compute', explanation: 'Google Cloud 上的虚拟机服务。' },
  { english: 'BigQuery', chinese: 'BigQuery', category: 'GCP Analytics', explanation: 'Google Cloud 的企业数据仓库。' },
];

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Search mode
    if (q) {
      const query = q.toLowerCase();
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .or(`english.ilike.%${query}%,chinese.ilike.%${query}%,explanation.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Paginated list
    const { data, error, count } = await supabase
      .from('glossary_terms')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ terms: data || [], total: count || 0 });
  } catch (error: any) {
    console.error('Glossary fetch error:', error);
    // Fallback to default terms if DB fails
    if (q) {
      const query = q.toLowerCase();
      const results = defaultTerms.filter(
        t => t.english.toLowerCase().includes(query) || t.chinese.includes(query)
      );
      return NextResponse.json(results);
    }
    return NextResponse.json({ terms: defaultTerms, total: defaultTerms.length });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { english, chinese, category, explanation, examples } = body;

    if (!english || !chinese || !category) {
      return NextResponse.json({ error: 'english, chinese, and category are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('glossary_terms')
      .insert({
        english,
        chinese,
        category,
        explanation: explanation || null,
        examples: examples || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Glossary create error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create term' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('glossary_terms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Glossary delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete term' }, { status: 500 });
  }
}
