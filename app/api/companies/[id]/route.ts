// /app/api/companies/[id]/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const companyUpdateSchema = z.object({
  name: z.string().min(1, "Company name is required").optional(),
  founder_pct: z.number().min(0).max(100),
  investor_pct: z.number().min(0).max(100),
  esop_pct: z.number().min(0).max(100),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Zod validation
    const validation = companyUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { founder_pct, investor_pct, esop_pct } = validation.data;

    // Cross-field validation (Layer 2)
    if (founder_pct + investor_pct + esop_pct !== 100) {
      return NextResponse.json({ error: "Ownership percentages must sum to exactly 100%" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('companies')
      .update(body)
      .eq('id', id)
      .eq('seller_id', user.id) // Ensure ownership
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
