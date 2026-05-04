import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { error: authError, user, supabase } = await requireAuth();
    if (authError || !user || !supabase) return authError;

    const body = await request.json();
    const { 
      legal_name, tax_id, country, founded_year,
      industry, products_services, target_market, employees_count,
      owner_founder_percent, owner_investor_percent, owner_esop_percent,
      name, founder_pct, investor_pct, esop_pct, registration_country, company_industry
    } = body;

    // Support both old and new form field names just in case
    const final_legal_name = legal_name || name;
    const final_country = country || registration_country;
    const final_industry = industry || company_industry;
    const final_founder = owner_founder_percent ?? founder_pct ?? 0;
    const final_investor = owner_investor_percent ?? investor_pct ?? 0;
    const final_esop = owner_esop_percent ?? esop_pct ?? 0;

    if (final_founder + final_investor + final_esop !== 100) {
      return NextResponse.json(
        { error: 'Ownership percentages must sum to exactly 100%' },
        { status: 400 }
      );
    }

    const { data, error: insertError } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        legal_name: final_legal_name,
        tax_id,
        registration_country: final_country,
        founded_year,
        industry: final_industry,
        products_services,
        target_market,
        employees_count,
        owner_founder_percent: final_founder,
        owner_investor_percent: final_investor,
        owner_esop_percent: final_esop,
        status: 'active',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Save version history
    await supabase.from('company_versions').insert({
      company_id: data.id,
      user_id: user.id,
      data: body,
      version: 1,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
